const { getDb } = require('../db/database');

function findMatchingSchemes(farmerProfile) {
  const db = getDb();
  const schemes = db.prepare('SELECT * FROM schemes WHERE is_active = 1').all();

  const results = schemes.map(scheme => {
    const criteria = JSON.parse(scheme.eligibility_criteria || '{}');
    let mandatoryMet = true;
    let matchScore = 0;
    const matchReasons = [];
    const unmatchedReasons = [];

    // 1. Land size check (25 points)
    if (criteria.land_max_hectares != null) {
      if (farmerProfile.landSize <= criteria.land_max_hectares) {
        matchScore += 25;
        matchReasons.push(`Land size (${farmerProfile.landSize} ha) within limit of ${criteria.land_max_hectares} ha`);
      } else {
        mandatoryMet = false;
        unmatchedReasons.push(`Land size exceeds ${criteria.land_max_hectares} ha limit`);
      }
    } else {
      matchScore += 25;
      matchReasons.push('No land size restriction');
    }

    // 2. Income category check (25 points)
    if (criteria.income_categories && criteria.income_categories.length) {
      if (farmerProfile.incomeCategory && criteria.income_categories.includes(farmerProfile.incomeCategory)) {
        matchScore += 25;
        matchReasons.push(`Income category "${farmerProfile.incomeCategory}" is eligible`);
      } else if (farmerProfile.incomeCategory) {
        mandatoryMet = false;
        unmatchedReasons.push(`Income category "${farmerProfile.incomeCategory}" not in eligible list`);
      } else {
        matchScore += 15; // Partial score if not specified
        matchReasons.push('Income category not specified (may be eligible)');
      }
    } else {
      matchScore += 25;
      matchReasons.push('No income restriction');
    }

    // 3. State check (25 points)
    if (criteria.states && criteria.states.length) {
      if (farmerProfile.state && criteria.states.some(s => s.toLowerCase() === farmerProfile.state.toLowerCase())) {
        matchScore += 25;
        matchReasons.push(`Available in ${farmerProfile.state}`);
      } else if (farmerProfile.state) {
        mandatoryMet = false;
        unmatchedReasons.push(`Not available in ${farmerProfile.state}`);
      } else {
        matchScore += 10;
      }
    } else {
      matchScore += 25;
      matchReasons.push('Available across all India');
    }

    // 4. Crop type bonus (25 points)
    if (criteria.crop_types && criteria.crop_types.length) {
      if (farmerProfile.primaryCrop && criteria.crop_types.some(c => c.toLowerCase() === farmerProfile.primaryCrop.toLowerCase())) {
        matchScore += 25;
        matchReasons.push(`Covers ${farmerProfile.primaryCrop} cultivation`);
      } else if (farmerProfile.primaryCrop) {
        matchScore += 5; // Partial - scheme may still apply
      } else {
        matchScore += 15;
      }
    } else {
      matchScore += 25;
      matchReasons.push('Covers all crop types');
    }

    // Bonus: irrigation type match
    if (criteria.irrigation_types && farmerProfile.irrigationType) {
      if (criteria.irrigation_types.includes(farmerProfile.irrigationType)) {
        matchScore = Math.min(matchScore + 5, 100);
        matchReasons.push(`Supports ${farmerProfile.irrigationType} irrigation`);
      }
    }

    if (!mandatoryMet) return null;

    return {
      id: scheme.id,
      name: scheme.name,
      nameHindi: scheme.name_hindi,
      shortCode: scheme.short_code,
      description: scheme.description,
      ministry: scheme.ministry,
      schemeType: scheme.scheme_type,
      benefitAmount: scheme.benefit_amount,
      matchScore: Math.min(matchScore, 100),
      matchReasons,
      requiredDocuments: JSON.parse(scheme.required_documents || '[]'),
      applicationProcess: JSON.parse(scheme.application_process || '{}'),
      applicationUrl: scheme.application_url,
      helpline: scheme.helpline,
      validFrom: scheme.valid_from,
      validTo: scheme.valid_to,
    };
  })
    .filter(Boolean)
    .sort((a, b) => b.matchScore - a.matchScore);

  return {
    matchedSchemes: results,
    totalSchemes: schemes.length,
    matchedCount: results.length,
    farmerProfile: {
      state: farmerProfile.state,
      landSize: farmerProfile.landSize,
      incomeCategory: farmerProfile.incomeCategory,
      primaryCrop: farmerProfile.primaryCrop,
    },
  };
}

function getAllSchemes() {
  const db = getDb();
  return db.prepare('SELECT * FROM schemes WHERE is_active = 1 ORDER BY name').all();
}

function getSchemeById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM schemes WHERE id = ?').get(id);
}

function getSchemesByType(type) {
  const db = getDb();
  return db.prepare('SELECT * FROM schemes WHERE scheme_type = ? AND is_active = 1 ORDER BY name').all(type);
}

module.exports = { findMatchingSchemes, getAllSchemes, getSchemeById, getSchemesByType };
