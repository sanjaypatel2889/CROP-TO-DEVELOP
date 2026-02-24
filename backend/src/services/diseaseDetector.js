const { getDb } = require('../db/database');
const { analyzeImage } = require('./imageAnalyzer');

function findCropName(db, input) {
  // 1. Exact match
  const exact = db.prepare('SELECT name FROM crops WHERE LOWER(name) = LOWER(?)').get(input);
  if (exact) return exact.name;

  // 2. Partial match (input contains crop name or vice versa)
  const partial = db.prepare('SELECT name FROM crops WHERE LOWER(name) LIKE ? OR LOWER(?) LIKE \'%\' || LOWER(name) || \'%\'')
    .get(`%${input.toLowerCase()}%`, input.toLowerCase());
  if (partial) return partial.name;

  // 3. Fuzzy match — find crop with shortest edit distance (handles typos like "Tamato" → "Tomato")
  const allCrops = db.prepare('SELECT name FROM crops').all();
  let bestMatch = null;
  let bestDist = Infinity;
  const inputLower = input.toLowerCase();

  for (const crop of allCrops) {
    const cropLower = crop.name.toLowerCase();
    // Simple Levenshtein distance
    const len1 = inputLower.length, len2 = cropLower.length;
    const matrix = Array.from({ length: len1 + 1 }, (_, i) => {
      const row = Array(len2 + 1).fill(0);
      row[0] = i;
      return row;
    });
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = inputLower[i - 1] === cropLower[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }
    const dist = matrix[len1][len2];
    // Allow up to 2 character edits for short names, 3 for longer names
    const maxDist = Math.max(2, Math.floor(cropLower.length * 0.4));
    if (dist < bestDist && dist <= maxDist) {
      bestDist = dist;
      bestMatch = crop.name;
    }
  }

  return bestMatch;
}

async function detectDisease(input) {
  const db = getDb();

  // Run image analysis in parallel with DB matching (if image provided)
  let imageResult = null;
  if (input.imagePath) {
    imageResult = await analyzeImage(input.imagePath);
  }

  // If image says plant is healthy
  if (imageResult && imageResult.isHealthy) {
    return {
      topMatches: [],
      imageAnalysis: {
        source: 'ai-vision',
        diseaseName: 'Healthy Plant',
        cropName: imageResult.cropName,
        confidence: imageResult.confidence,
        description: imageResult.description || 'The plant appears to be healthy with no visible signs of disease.',
        symptoms: [],
        treatment: [],
        prevention: imageResult.prevention || [],
        organicTreatment: [],
        pathogenType: null,
        severity: null,
      },
      severity: { level: 'mild', message: 'Plant appears healthy! Continue with preventive care.', color: 'green' },
      disclaimer: 'AI-powered analysis. For confirmation, consult your local Krishi Vigyan Kendra (KVK).'
    };
  }

  // Smart crop name matching (handles typos, partial names)
  // Use AI-detected crop name as fallback if user didn't provide one or DB doesn't have it
  const cropNameToSearch = input.cropName || (imageResult ? imageResult.cropName : null);
  const matchedCrop = cropNameToSearch ? findCropName(db, cropNameToSearch) : null;

  if (!matchedCrop && !imageResult) {
    const allCrops = db.prepare('SELECT name FROM crops ORDER BY name').all();
    return {
      topMatches: [],
      severity: { level: 'unknown', message: 'Crop not found in our database. Try: ' + allCrops.slice(0, 10).map(c => c.name).join(', ') + '...', color: 'gray' },
      disclaimer: 'This is a rule-based assessment. For accurate diagnosis, consult your local Krishi Vigyan Kendra (KVK).'
    };
  }

  // Get DB diseases for the matched crop
  let diseases = [];
  if (matchedCrop) {
    diseases = db.prepare(
      'SELECT d.*, c.name as crop_name FROM diseases d JOIN crops c ON d.crop_id = c.id WHERE LOWER(c.name) = LOWER(?)'
    ).all(matchedCrop);
  }

  // Score DB diseases
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

    // Boost score if AI image analysis agrees with this disease (+5)
    if (imageResult && imageResult.diseaseName) {
      const aiName = imageResult.diseaseName.toLowerCase();
      const dbName = disease.name.toLowerCase();
      if (dbName.includes(aiName) || aiName.includes(dbName)) {
        score += 5;
      }
    }

    const maxPossibleScore = 19; // 14 base + 5 image boost
    const confidence = Math.min(Math.round((score / maxPossibleScore) * 100), 99);

    return { ...disease, score, confidence };
  });

  scored.sort((a, b) => b.score - a.score);
  const topMatches = scored.slice(0, 3).filter(m => m.score > 0);

  // Format top matches
  const formattedMatches = topMatches.map(m => ({
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
    source: 'database',
  }));

  // Build image analysis result if available
  let imageAnalysis = null;
  if (imageResult && !imageResult.isHealthy) {
    imageAnalysis = {
      source: 'ai-vision',
      diseaseName: imageResult.diseaseName,
      cropName: imageResult.cropName,
      confidence: imageResult.confidence,
      description: imageResult.description,
      symptoms: imageResult.symptoms,
      treatment: imageResult.treatment,
      prevention: imageResult.prevention,
      organicTreatment: imageResult.organicTreatment,
      pathogenType: imageResult.pathogenType,
      severity: imageResult.severity,
    };
  }

  // Severity based on symptom count + image analysis
  const symptomCount = (input.symptoms || []).length;
  let severity;
  if (imageResult && imageResult.severity === 'severe') {
    severity = { level: 'severe', message: 'AI detected severe infection. Immediate intervention required.', color: 'red' };
  } else if (imageResult && imageResult.severity === 'moderate') {
    severity = { level: 'moderate', message: 'AI detected moderate infection. Begin treatment soon.', color: 'orange' };
  } else if (symptomCount < 2) {
    severity = { level: 'mild', message: 'Early stage detected. Preventive action recommended.', color: 'green' };
  } else if (symptomCount <= 4) {
    severity = { level: 'moderate', message: 'Active infection likely. Begin treatment immediately.', color: 'orange' };
  } else {
    severity = { level: 'severe', message: 'Severe infection. Immediate intervention required to save crop.', color: 'red' };
  }

  // If no DB matches but we have AI analysis, still provide a useful response
  if (formattedMatches.length === 0 && !imageAnalysis) {
    if (matchedCrop) {
      return {
        topMatches: [],
        severity: { level: 'unknown', message: `No diseases found for "${matchedCrop}" matching those symptoms.`, color: 'gray' },
        disclaimer: 'This is a rule-based assessment. For accurate diagnosis, consult your local Krishi Vigyan Kendra (KVK).'
      };
    }
    const allCrops = db.prepare('SELECT name FROM crops ORDER BY name').all();
    return {
      topMatches: [],
      severity: { level: 'unknown', message: 'Crop not found in our database. Try: ' + allCrops.slice(0, 10).map(c => c.name).join(', ') + '...', color: 'gray' },
      disclaimer: 'This is a rule-based assessment. For accurate diagnosis, consult your local Krishi Vigyan Kendra (KVK).'
    };
  }

  return {
    topMatches: formattedMatches,
    imageAnalysis,
    severity,
    disclaimer: imageAnalysis
      ? 'AI-powered analysis combined with rule-based matching. For severe infections, consult your local Krishi Vigyan Kendra (KVK).'
      : 'This is a rule-based assessment. For severe infections, consult your local Krishi Vigyan Kendra (KVK).'
  };
}

module.exports = { detectDisease };
