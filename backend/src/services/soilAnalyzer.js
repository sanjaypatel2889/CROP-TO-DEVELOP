const { getDb } = require('../db/database');

// ICAR standard thresholds for nutrient classification
const THRESHOLDS = {
  nitrogen: { low: 280, high: 560, unit: 'kg/ha' },
  phosphorus: { low: 10, high: 25, unit: 'kg/ha' },
  potassium: { low: 108, high: 280, unit: 'kg/ha' },
  organicCarbon: { low: 0.5, high: 0.75, unit: '%' },
  zinc: { low: 0.6, high: 1.2, unit: 'ppm' },
  iron: { low: 4.5, high: 9.0, unit: 'ppm' },
  manganese: { low: 2.0, high: 4.0, unit: 'ppm' },
};

function classifyNutrient(name, value, thresholds) {
  if (value == null || value === '') {
    return { status: 'unknown', level: 'unknown', value: null, message: 'No data provided' };
  }
  const v = parseFloat(value);
  if (v < thresholds.low) {
    return { status: 'deficient', level: 'low', value: v, unit: thresholds.unit, message: `${name} is deficient (${v} ${thresholds.unit}). Supplementation needed.` };
  }
  if (v <= thresholds.high) {
    return { status: 'adequate', level: 'medium', value: v, unit: thresholds.unit, message: `${name} levels are adequate (${v} ${thresholds.unit}).` };
  }
  return { status: 'excessive', level: 'high', value: v, unit: thresholds.unit, message: `${name} is high (${v} ${thresholds.unit}). Reduce application.` };
}

function classifyPH(value) {
  if (value == null || value === '') {
    return { status: 'unknown', value: null, message: 'No pH data provided' };
  }
  const v = parseFloat(value);
  if (v < 5.5) return { status: 'strongly_acidic', value: v, message: `Soil is strongly acidic (pH ${v}). Lime application required.`, correction: 'Apply agricultural lime @ 2-4 tonnes/ha' };
  if (v < 6.5) return { status: 'acidic', value: v, message: `Soil is moderately acidic (pH ${v}). Mild liming recommended.`, correction: 'Apply lime @ 1-2 tonnes/ha' };
  if (v <= 7.5) return { status: 'neutral', value: v, message: `Soil pH is ideal (${v}). No correction needed.`, correction: null };
  if (v <= 8.5) return { status: 'alkaline', value: v, message: `Soil is alkaline (pH ${v}). Gypsum application recommended.`, correction: 'Apply gypsum @ 2-5 tonnes/ha' };
  return { status: 'strongly_alkaline', value: v, message: `Soil is strongly alkaline (pH ${v}). Heavy gypsum treatment needed.`, correction: 'Apply gypsum @ 5-10 tonnes/ha + organic matter' };
}

function generateFertilizerPlan(assessment, soilType, targetCrop) {
  const recommendations = [];

  // Nitrogen
  if (assessment.nitrogen.status === 'deficient') {
    recommendations.push({
      nutrient: 'Nitrogen (N)',
      fertilizer: 'Urea (46-0-0)',
      quantity: '100-120 kg/ha',
      application: 'Split into 3 doses: 50% basal, 25% at tillering, 25% at panicle initiation',
      alternative: 'Ammonium Sulphate (21-0-0) @ 200-250 kg/ha if sulphur also deficient',
    });
  } else if (assessment.nitrogen.status === 'adequate') {
    recommendations.push({
      nutrient: 'Nitrogen (N)',
      fertilizer: 'Urea',
      quantity: '60-80 kg/ha (maintenance dose)',
      application: 'Split into 2 doses: 60% basal, 40% at tillering',
      alternative: null,
    });
  }

  // Phosphorus
  if (assessment.phosphorus.status === 'deficient') {
    recommendations.push({
      nutrient: 'Phosphorus (P)',
      fertilizer: 'DAP (18-46-0)',
      quantity: '100-130 kg/ha',
      application: 'Apply full dose as basal before sowing/transplanting',
      alternative: 'Single Super Phosphate (SSP) @ 250-350 kg/ha',
    });
  } else if (assessment.phosphorus.status === 'adequate') {
    recommendations.push({
      nutrient: 'Phosphorus (P)',
      fertilizer: 'DAP',
      quantity: '50-60 kg/ha (maintenance)',
      application: 'Full dose as basal',
      alternative: null,
    });
  }

  // Potassium
  if (assessment.potassium.status === 'deficient') {
    recommendations.push({
      nutrient: 'Potassium (K)',
      fertilizer: 'Muriate of Potash / MoP (0-0-60)',
      quantity: '80-100 kg/ha',
      application: 'Apply 50% basal + 50% at tillering/flowering',
      alternative: 'Sulphate of Potash (SOP) for chloride-sensitive crops',
    });
  }

  // Micronutrients
  if (assessment.zinc && assessment.zinc.status === 'deficient') {
    recommendations.push({
      nutrient: 'Zinc (Zn)',
      fertilizer: 'Zinc Sulphate (ZnSO4)',
      quantity: '20-25 kg/ha',
      application: 'Mix with soil before sowing. For standing crop, foliar spray @ 0.5% solution',
      alternative: null,
    });
  }

  if (assessment.iron && assessment.iron.status === 'deficient') {
    recommendations.push({
      nutrient: 'Iron (Fe)',
      fertilizer: 'Ferrous Sulphate (FeSO4)',
      quantity: '25-50 kg/ha soil application, or 0.5% foliar spray',
      application: 'Soil application before sowing or foliar spray at deficiency symptoms',
      alternative: null,
    });
  }

  // Organic matter recommendation
  if (assessment.organicCarbon && assessment.organicCarbon.status === 'deficient') {
    recommendations.push({
      nutrient: 'Organic Carbon',
      fertilizer: 'Farm Yard Manure (FYM) / Vermicompost',
      quantity: 'FYM 10-15 tonnes/ha OR Vermicompost 3-5 tonnes/ha',
      application: 'Apply and incorporate into soil 2-3 weeks before sowing',
      alternative: 'Green manuring with Dhaincha/Sunhemp before main crop',
    });
  }

  return recommendations;
}

function generateRotationPlan(soilType, assessment) {
  const plans = {
    alluvial: [
      { season: 'Kharif (Jun-Oct)', crop: 'Rice / Maize', reason: 'High water retention suits paddy' },
      { season: 'Rabi (Nov-Mar)', crop: 'Wheat / Mustard', reason: 'Residual moisture supports rabi crops' },
      { season: 'Zaid (Mar-Jun)', crop: 'Moong / Vegetables', reason: 'Short-duration legume fixes nitrogen for next kharif' },
    ],
    black: [
      { season: 'Kharif (Jun-Oct)', crop: 'Cotton / Soybean', reason: 'Black soil ideal for deep-rooted crops' },
      { season: 'Rabi (Nov-Mar)', crop: 'Chana / Wheat', reason: 'Legume fixes nitrogen; wheat uses stored moisture' },
      { season: 'Zaid (Mar-Jun)', crop: 'Sunflower / Vegetables', reason: 'Light crop before monsoon' },
    ],
    red: [
      { season: 'Kharif (Jun-Oct)', crop: 'Groundnut / Ragi', reason: 'Tolerant to acidic red soils' },
      { season: 'Rabi (Nov-Mar)', crop: 'Mustard / Masoor', reason: 'Low water requirement crops' },
      { season: 'Zaid (Mar-Jun)', crop: 'Moong / Sesame', reason: 'Quick-growing legume improves soil health' },
    ],
    laterite: [
      { season: 'Kharif (Jun-Oct)', crop: 'Rice / Arhar', reason: 'Adequate monsoon rain for paddy' },
      { season: 'Rabi (Nov-Mar)', crop: 'Potato / Vegetables', reason: 'Good drainage suits tuber crops' },
      { season: 'Zaid (Mar-Jun)', crop: 'Cowpea / Green Manure', reason: 'Nitrogen fixation for depleted laterite' },
    ],
    desert: [
      { season: 'Kharif (Jun-Oct)', crop: 'Bajra / Moong', reason: 'Drought-tolerant millets thrive here' },
      { season: 'Rabi (Nov-Mar)', crop: 'Mustard / Barley', reason: 'Low water requirement crops' },
      { season: 'Zaid (Mar-Jun)', crop: 'Guar / Moth Bean', reason: 'Extremely drought-tolerant legumes' },
    ],
    forest: [
      { season: 'Kharif (Jun-Oct)', crop: 'Maize / Rice', reason: 'Organic-rich soil supports high yields' },
      { season: 'Rabi (Nov-Mar)', crop: 'Wheat / Potato', reason: 'Cool temperatures suit rabi crops' },
      { season: 'Zaid (Mar-Jun)', crop: 'Vegetables / Spices', reason: 'High-value crops utilize rich soil' },
    ],
    peaty: [
      { season: 'Kharif (Jun-Oct)', crop: 'Rice / Jute', reason: 'Waterlogged conditions suit paddy' },
      { season: 'Rabi (Nov-Mar)', crop: 'Potato / Vegetables', reason: 'Rich organic matter supports vegetables' },
      { season: 'Zaid (Mar-Jun)', crop: 'Cucurbits / Leafy Vegetables', reason: 'High fertility for quick crops' },
    ],
    saline: [
      { season: 'Kharif (Jun-Oct)', crop: 'Rice (salt-tolerant) / Barley', reason: 'Monsoon rain helps flush salts' },
      { season: 'Rabi (Nov-Mar)', crop: 'Mustard / Berseem', reason: 'Moderately salt-tolerant crops' },
      { season: 'Zaid (Mar-Jun)', crop: 'Dhaincha (green manure)', reason: 'Reclamation crop improves soil' },
    ],
  };

  const key = (soilType || 'alluvial').toLowerCase();
  const plan = plans[key] || plans.alluvial;

  // Adjust based on nutrient status
  const notes = [];
  if (assessment.nitrogen && assessment.nitrogen.status === 'deficient') {
    notes.push('Include a legume (moong, dhaincha, or berseem) in rotation to fix atmospheric nitrogen naturally.');
  }
  if (assessment.organicCarbon && assessment.organicCarbon.status === 'deficient') {
    notes.push('Practice green manuring every alternate cycle to build soil organic matter.');
  }

  return { rotation: plan, notes };
}

function generateAmendments(assessment, soilData) {
  const amendments = [];

  // pH correction
  const phStatus = assessment.ph;
  if (phStatus && phStatus.correction) {
    amendments.push({
      type: 'pH Correction',
      amendment: phStatus.correction,
      reason: phStatus.message,
      timing: 'Apply 3-4 weeks before sowing and mix well into topsoil',
    });
  }

  // Organic matter
  if (assessment.organicCarbon && assessment.organicCarbon.status === 'deficient') {
    amendments.push({
      type: 'Organic Matter',
      amendment: 'Apply FYM @ 10-15 tonnes/ha or Vermicompost @ 3-5 tonnes/ha',
      reason: 'Low organic carbon reduces soil health and water retention',
      timing: 'Apply 2-3 weeks before sowing',
    });
    amendments.push({
      type: 'Green Manuring',
      amendment: 'Grow Dhaincha/Sunhemp for 45 days and plough back into soil',
      reason: 'Adds organic matter and fixes nitrogen naturally',
      timing: 'During fallow period between crops',
    });
  }

  // Saline soil reclamation
  if (soilData.soil_type === 'saline' || (phStatus && phStatus.value > 8.5)) {
    amendments.push({
      type: 'Salt Reclamation',
      amendment: 'Apply gypsum @ 5-10 tonnes/ha + ensure adequate drainage',
      reason: 'High salinity/alkalinity damages crop roots and reduces nutrient uptake',
      timing: 'Apply before monsoon season for natural leaching',
    });
  }

  // Compacted soil
  if (soilData.soil_type === 'black' || soilData.soil_type === 'laterite') {
    amendments.push({
      type: 'Soil Structure',
      amendment: 'Deep ploughing + organic matter addition',
      reason: `${soilData.soil_type} soil tends to develop hard pan. Regular organic additions improve structure.`,
      timing: 'Deep plough once a year before kharif season',
    });
  }

  return amendments;
}

function analyzeSoil(soilData) {
  const assessment = {};

  // Classify all nutrients
  assessment.nitrogen = classifyNutrient('Nitrogen', soilData.nitrogen_kg_per_ha, THRESHOLDS.nitrogen);
  assessment.phosphorus = classifyNutrient('Phosphorus', soilData.phosphorus_kg_per_ha, THRESHOLDS.phosphorus);
  assessment.potassium = classifyNutrient('Potassium', soilData.potassium_kg_per_ha, THRESHOLDS.potassium);
  assessment.organicCarbon = classifyNutrient('Organic Carbon', soilData.organic_carbon_percent, THRESHOLDS.organicCarbon);
  assessment.zinc = classifyNutrient('Zinc', soilData.zinc_ppm, THRESHOLDS.zinc);
  assessment.iron = classifyNutrient('Iron', soilData.iron_ppm, THRESHOLDS.iron);
  assessment.manganese = classifyNutrient('Manganese', soilData.manganese_ppm, THRESHOLDS.manganese);
  assessment.ph = classifyPH(soilData.ph_value);

  // Overall health score
  const known = Object.values(assessment).filter(a => a.status !== 'unknown');
  const healthy = known.filter(a => a.status === 'adequate' || a.status === 'neutral');
  const healthScore = known.length > 0 ? Math.round((healthy.length / known.length) * 100) : 0;

  // Generate plans
  const fertilizerPlan = generateFertilizerPlan(assessment, soilData.soil_type, soilData.target_crop);
  const rotationPlan = generateRotationPlan(soilData.soil_type, assessment);
  const amendments = generateAmendments(assessment, soilData);

  return {
    healthScore,
    assessment,
    fertilizerPlan,
    rotationPlan,
    amendments,
    summary: healthScore >= 70
      ? 'Soil health is good. Follow maintenance recommendations.'
      : healthScore >= 40
      ? 'Soil needs attention. Follow fertilizer and amendment recommendations carefully.'
      : 'Soil health is poor. Intensive nutrient management and soil reclamation needed.',
  };
}

function getSoilTypeInfo(soilTypeName) {
  const db = getDb();
  return db.prepare('SELECT * FROM soil_types WHERE LOWER(name) = LOWER(?)').get(soilTypeName);
}

function getAllSoilTypes() {
  const db = getDb();
  return db.prepare('SELECT * FROM soil_types').all();
}

function saveSoilTest(testData) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO soil_tests (farmer_id, soil_type, ph_value, nitrogen_kg_per_ha, phosphorus_kg_per_ha,
      potassium_kg_per_ha, organic_carbon_percent, zinc_ppm, iron_ppm, manganese_ppm, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    testData.farmer_id, testData.soil_type, testData.ph_value,
    testData.nitrogen_kg_per_ha, testData.phosphorus_kg_per_ha, testData.potassium_kg_per_ha,
    testData.organic_carbon_percent, testData.zinc_ppm, testData.iron_ppm, testData.manganese_ppm,
    testData.notes
  );
}

module.exports = { analyzeSoil, getSoilTypeInfo, getAllSoilTypes, saveSoilTest };
