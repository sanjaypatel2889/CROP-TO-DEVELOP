const { getDb } = require('../db/database');

function getCropStageScore(cropName, month) {
  const db = getDb();
  const crop = db.prepare('SELECT * FROM crops WHERE LOWER(name) = LOWER(?)').get(cropName);
  if (!crop) return 5;

  // Vulnerable stages: seedling (just after sowing) and flowering/grain-filling
  const sowStart = crop.sowing_month_start;
  const sowEnd = crop.sowing_month_end;
  const harvestStart = crop.harvest_month_start;

  // Seedling stage (1-2 months after sowing)
  if (month >= sowStart && month <= sowEnd + 1) return 15;
  // Flowering/grain-filling (1-2 months before harvest)
  if (harvestStart && month >= harvestStart - 2 && month < harvestStart) return 20;
  // Active growing season
  if (month > sowEnd && month < harvestStart) return 10;

  return 5;
}

function getPreventiveActions(riskLevel, pest) {
  const actions = [];
  const culturalControls = JSON.parse(pest.control_cultural || '[]');
  const biologicalControls = JSON.parse(pest.control_biological || '[]');

  if (riskLevel === 'low') {
    actions.push('Maintain field hygiene and regular monitoring');
    if (culturalControls.length) actions.push(culturalControls[0]);
  } else if (riskLevel === 'medium') {
    actions.push('Increase monitoring to every 2-3 days');
    if (culturalControls.length) actions.push(...culturalControls.slice(0, 2));
    if (biologicalControls.length) actions.push(biologicalControls[0]);
  } else if (riskLevel === 'high') {
    actions.push('Daily monitoring required');
    if (biologicalControls.length) actions.push(...biologicalControls.slice(0, 2));
    actions.push('Consider preventive spray if pest spotted');
  } else {
    actions.push('IMMEDIATE ACTION REQUIRED');
    const chemicalControls = JSON.parse(pest.control_chemical || '[]');
    if (chemicalControls.length) actions.push(chemicalControls[0]);
    if (biologicalControls.length) actions.push(biologicalControls[0]);
    actions.push('Contact nearest KVK or agriculture officer');
  }

  return actions;
}

function predictPestRisk(cropName, state, month, weatherData) {
  const db = getDb();

  if (!month) month = new Date().getMonth() + 1;

  const pests = db.prepare(
    "SELECT * FROM pests WHERE target_crops LIKE ?"
  ).all(`%${cropName}%`);

  if (!pests.length) {
    return { pests: [], overallRisk: 'low', message: 'No pest data available for this crop.' };
  }

  const results = pests.map(pest => {
    let riskScore = 0;
    const details = [];

    // 1. Seasonal Factor (0-30 points)
    const activeMonths = JSON.parse(pest.active_months || '[]');
    if (activeMonths.includes(month)) {
      riskScore += 20;
      details.push('Currently in active season');

      // Peak month bonus
      const midIndex = Math.floor(activeMonths.length / 2);
      if (activeMonths[midIndex] === month || (activeMonths[midIndex - 1] === month)) {
        riskScore += 10;
        details.push('Peak activity month');
      }
    } else {
      riskScore += 5;
      details.push('Off-season (dormant risk)');
    }

    // 2. Weather Factor (0-30 points)
    if (weatherData) {
      const temp = weatherData.temp || weatherData.temperature;
      const humidity = weatherData.humidity;

      if (temp && pest.favorable_temp_min && pest.favorable_temp_max) {
        if (temp >= pest.favorable_temp_min && temp <= pest.favorable_temp_max) {
          riskScore += 15;
          details.push(`Temperature (${temp}\u00b0C) in favorable range`);
        }
      }

      if (humidity && pest.favorable_humidity_min && pest.favorable_humidity_max) {
        if (humidity >= pest.favorable_humidity_min && humidity <= pest.favorable_humidity_max) {
          riskScore += 15;
          details.push(`Humidity (${humidity}%) in favorable range`);
        }
      }

      // Recent rain bonus for moisture-loving pests
      if (weatherData.recentRain && pest.favorable_humidity_min >= 70) {
        riskScore += 5;
        details.push('Recent rainfall increases risk');
      }
    } else {
      // Without weather data, use moderate estimates
      riskScore += 10;
    }

    // 3. Crop Stage Factor (0-20 points)
    const stageScore = getCropStageScore(cropName, month);
    riskScore += stageScore;
    if (stageScore >= 15) details.push('Crop in vulnerable growth stage');

    // 4. Regional Factor (0-20 points)
    const riskFactors = JSON.parse(pest.risk_factors || '{}');
    if (riskFactors.states && state) {
      if (riskFactors.states.some(s => s.toLowerCase() === state.toLowerCase())) {
        riskScore += 10;
        details.push(`Historically active in ${state}`);
      }
    }
    if (riskFactors.conditions) {
      riskScore += 5; // Generic risk factor present
    }

    riskScore = Math.min(riskScore, 100);
    const riskLevel = riskScore <= 25 ? 'low' : riskScore <= 50 ? 'medium' : riskScore <= 75 ? 'high' : 'critical';

    return {
      id: pest.id,
      name: pest.name,
      nameHindi: pest.name_hindi,
      pestType: pest.pest_type,
      riskScore,
      riskLevel,
      details,
      activeMonths,
      damageSymptoms: JSON.parse(pest.damage_symptoms || '[]'),
      controlMeasures: {
        chemical: JSON.parse(pest.control_chemical || '[]'),
        biological: JSON.parse(pest.control_biological || '[]'),
        cultural: JSON.parse(pest.control_cultural || '[]'),
      },
      preventiveActions: getPreventiveActions(riskLevel, pest),
      severityIfUntreated: pest.severity_if_untreated,
    };
  }).sort((a, b) => b.riskScore - a.riskScore);

  // Overall risk level
  const maxRisk = results.length > 0 ? results[0].riskScore : 0;
  const overallRisk = maxRisk <= 25 ? 'low' : maxRisk <= 50 ? 'medium' : maxRisk <= 75 ? 'high' : 'critical';

  return {
    pests: results,
    overallRisk,
    overallScore: maxRisk,
    cropName,
    state,
    month,
    totalPestsTracked: results.length,
    highRiskCount: results.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length,
  };
}

function getAllPests() {
  const db = getDb();
  return db.prepare('SELECT * FROM pests ORDER BY name').all();
}

function getPestById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM pests WHERE id = ?').get(id);
}

module.exports = { predictPestRisk, getAllPests, getPestById };
