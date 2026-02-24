const { getDb } = require('../db/database');

function detectDisease(input) {
  const db = getDb();

  const diseases = db.prepare(
    'SELECT d.*, c.name as crop_name FROM diseases d JOIN crops c ON d.crop_id = c.id WHERE LOWER(c.name) = LOWER(?)'
  ).all(input.cropName);

  if (!diseases.length) {
    return {
      topMatches: [],
      severity: { level: 'unknown', message: 'No diseases found for this crop in our database.' },
      disclaimer: 'This is a rule-based assessment. For accurate diagnosis, consult your local Krishi Vigyan Kendra (KVK).'
    };
  }

  const scored = diseases.map(disease => {
    let score = 0;
    const symptoms = JSON.parse(disease.symptoms || '[]');
    const leafIndicators = JSON.parse(disease.leaf_indicators || '{}');
    const conditions = JSON.parse(disease.favorable_conditions || '{}');

    // Symptom keyword matching (+3 per match)
    if (input.symptoms && input.symptoms.length) {
      input.symptoms.forEach(s => {
        const sLower = s.toLowerCase();
        if (symptoms.some(ds => ds.toLowerCase().includes(sLower))) score += 3;
      });
    }

    // Affected plant part match (+2)
    if (input.affectedPart && disease.affected_plant_part === input.affectedPart) {
      score += 2;
    }

    // Spot color matching (+2)
    if (input.spotColor && leafIndicators.colors) {
      if (leafIndicators.colors.includes(input.spotColor)) score += 2;
    }

    // Spot shape matching (+1)
    if (input.spotShape && leafIndicators.shapes) {
      if (leafIndicators.shapes.includes(input.spotShape)) score += 1;
    }

    // Pathogen type correlation (+2)
    if (input.hasFungalGrowth && disease.pathogen_type === 'fungal') score += 2;
    if (!input.hasFungalGrowth && disease.pathogen_type === 'viral') score += 1;
    if (input.hasFungalGrowth === false && disease.pathogen_type === 'bacterial') score += 1;

    // Weather condition correlation (+1)
    if (input.weatherRecent) {
      if (input.weatherRecent === 'humid' && conditions.humidity_min && conditions.humidity_min >= 60) score += 1;
      if (input.weatherRecent === 'rainy' && conditions.rainfall) score += 1;
      if (input.weatherRecent === 'cold' && conditions.temp_max && conditions.temp_max <= 20) score += 1;
      if (input.weatherRecent === 'dry' && !conditions.rainfall && conditions.humidity_min && conditions.humidity_min < 50) score += 1;
    }

    const maxPossibleScore = 14;
    const confidence = Math.min(Math.round((score / maxPossibleScore) * 100), 99);

    return { ...disease, score, confidence };
  });

  scored.sort((a, b) => b.score - a.score);
  const topMatches = scored.slice(0, 3).filter(m => m.score > 0);

  // Severity based on symptom count
  const symptomCount = (input.symptoms || []).length;
  let severity;
  if (symptomCount < 2) {
    severity = { level: 'mild', message: 'Early stage detected. Preventive action recommended.', color: 'green' };
  } else if (symptomCount <= 4) {
    severity = { level: 'moderate', message: 'Active infection likely. Begin treatment immediately.', color: 'orange' };
  } else {
    severity = { level: 'severe', message: 'Severe infection. Immediate intervention required to save crop.', color: 'red' };
  }

  return {
    topMatches: topMatches.map(m => ({
      id: m.id,
      name: m.name,
      nameHindi: m.name_hindi,
      cropName: m.crop_name,
      confidence: m.confidence,
      pathogenType: m.pathogen_type,
      symptoms: JSON.parse(m.symptoms || '[]'),
      treatment: JSON.parse(m.treatment || '[]'),
      prevention: JSON.parse(m.prevention || '[]'),
      organicTreatment: JSON.parse(m.organic_treatment || '[]'),
      severityLevels: JSON.parse(m.severity_levels || '[]'),
      affectedPart: m.affected_plant_part,
    })),
    severity,
    disclaimer: 'This is a rule-based assessment. For severe infections, consult your local Krishi Vigyan Kendra (KVK).'
  };
}

module.exports = { detectDisease };
