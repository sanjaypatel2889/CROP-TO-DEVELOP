// Fix module resolution for Node v24
const Module = require('module');
const path = require('path');
process.env.NODE_PATH = path.join(__dirname, '..', 'backend', 'node_modules');
Module._initPaths();

const { getDb, initializeDatabase } = require('../backend/src/db/database');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'backend', 'src', 'data');

function loadJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: ${filename} not found, skipping...`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function seed() {
  console.log('Initializing database...');
  initializeDatabase();
  const db = getDb();

  const seedAll = db.transaction(() => {
    // Clear existing data
    console.log('Clearing existing data...');
    const tables = ['market_prices', 'price_history', 'soil_tests', 'diseases', 'pests', 'schemes', 'crops', 'soil_types', 'farmers', 'weather_cache'];
    tables.forEach(t => {
      try { db.exec(`DELETE FROM ${t}`); } catch (e) { /* table may not exist */ }
    });

    // 1. Seed crops
    const crops = loadJSON('crops.json');
    if (crops.length) {
      const insertCrop = db.prepare(`
        INSERT INTO crops (name, name_hindi, category, season, sowing_month_start, sowing_month_end,
          harvest_month_start, harvest_month_end, water_requirement, temperature_min, temperature_max,
          suitable_soil_types, msp_per_quintal, avg_yield_per_hectare)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      crops.forEach(c => {
        try {
          insertCrop.run(
            c.name, c.name_hindi, c.category, c.season,
            c.sowing_month_start, c.sowing_month_end, c.harvest_month_start, c.harvest_month_end,
            c.water_requirement, c.temperature_min, c.temperature_max,
            JSON.stringify(c.suitable_soil_types || []),
            c.msp_per_quintal, c.avg_yield_per_hectare
          );
        } catch (e) { console.warn(`  Skipping crop ${c.name}: ${e.message}`); }
      });
      console.log(`  Seeded ${crops.length} crops`);
    }

    // 2. Seed diseases
    const diseases = loadJSON('diseases.json');
    if (diseases.length) {
      const getCropId = db.prepare('SELECT id FROM crops WHERE LOWER(name) = LOWER(?)');
      const insertDisease = db.prepare(`
        INSERT INTO diseases (name, name_hindi, crop_id, pathogen_type, symptoms, leaf_indicators,
          severity_levels, favorable_conditions, treatment, prevention, organic_treatment,
          image_keywords, affected_plant_part)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      diseases.forEach(d => {
        try {
          const crop = getCropId.get(d.crop_name);
          insertDisease.run(
            d.name, d.name_hindi, crop?.id || null, d.pathogen_type,
            JSON.stringify(d.symptoms || []),
            JSON.stringify(d.leaf_indicators || {}),
            JSON.stringify(d.severity_levels || []),
            JSON.stringify(d.favorable_conditions || {}),
            JSON.stringify(d.treatment || []),
            JSON.stringify(d.prevention || []),
            JSON.stringify(d.organic_treatment || []),
            d.image_keywords || '', d.affected_plant_part || 'leaf'
          );
        } catch (e) { console.warn(`  Skipping disease ${d.name}: ${e.message}`); }
      });
      console.log(`  Seeded ${diseases.length} diseases`);
    }

    // 3. Seed pests
    const pests = loadJSON('pests.json');
    if (pests.length) {
      const insertPest = db.prepare(`
        INSERT INTO pests (name, name_hindi, pest_type, target_crops, damage_symptoms,
          lifecycle_days, active_season, active_months, favorable_temp_min, favorable_temp_max,
          favorable_humidity_min, favorable_humidity_max, risk_factors,
          control_chemical, control_biological, control_cultural, severity_if_untreated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      pests.forEach(p => {
        try {
          insertPest.run(
            p.name, p.name_hindi, p.pest_type,
            JSON.stringify(p.target_crops || []),
            JSON.stringify(p.damage_symptoms || []),
            p.lifecycle_days || null, p.active_season || null,
            JSON.stringify(p.active_months || []),
            p.favorable_temp_min, p.favorable_temp_max,
            p.favorable_humidity_min, p.favorable_humidity_max,
            JSON.stringify(p.risk_factors || {}),
            JSON.stringify(p.control_chemical || []),
            JSON.stringify(p.control_biological || []),
            JSON.stringify(p.control_cultural || []),
            p.severity_if_untreated || 'medium'
          );
        } catch (e) { console.warn(`  Skipping pest ${p.name}: ${e.message}`); }
      });
      console.log(`  Seeded ${pests.length} pests`);
    }

    // 4. Seed soil types
    const soilTypes = loadJSON('soilTypes.json');
    if (soilTypes.length) {
      const insertSoil = db.prepare(`
        INSERT INTO soil_types (name, name_hindi, description, regions, characteristics,
          nutrient_profile, suitable_crops, recommended_fertilizers, water_retention, ph_min, ph_max)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      soilTypes.forEach(s => {
        try {
          insertSoil.run(
            s.name, s.name_hindi, s.description,
            JSON.stringify(s.regions || []),
            JSON.stringify(s.characteristics || {}),
            JSON.stringify(s.nutrient_profile || {}),
            JSON.stringify(s.suitable_crops || []),
            JSON.stringify(s.recommended_fertilizers || []),
            s.water_retention || 'medium', s.ph_min, s.ph_max
          );
        } catch (e) { console.warn(`  Skipping soil type ${s.name}: ${e.message}`); }
      });
      console.log(`  Seeded ${soilTypes.length} soil types`);
    }

    // 5. Seed schemes
    const schemes = loadJSON('schemes.json');
    if (schemes.length) {
      const insertScheme = db.prepare(`
        INSERT INTO schemes (name, name_hindi, short_code, description, ministry, scheme_type,
          benefit_amount, eligibility_criteria, required_documents, application_process,
          application_url, helpline, is_active, valid_from, valid_to, target_states)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      schemes.forEach(s => {
        try {
          insertScheme.run(
            s.name, s.name_hindi, s.short_code, s.description, s.ministry, s.scheme_type,
            s.benefit_amount,
            JSON.stringify(s.eligibility_criteria || {}),
            JSON.stringify(s.required_documents || []),
            JSON.stringify(s.application_process || {}),
            s.application_url || null, s.helpline || null,
            s.is_active !== false ? 1 : 0,
            s.valid_from || null, s.valid_to || null,
            s.target_states ? JSON.stringify(s.target_states) : null
          );
        } catch (e) { console.warn(`  Skipping scheme ${s.name}: ${e.message}`); }
      });
      console.log(`  Seeded ${schemes.length} schemes`);
    }

    // 6. Seed market prices
    const marketPrices = loadJSON('marketPrices.json');
    if (marketPrices.length) {
      const getCropId = db.prepare('SELECT id FROM crops WHERE LOWER(name) = LOWER(?)');
      const insertPrice = db.prepare(`
        INSERT INTO market_prices (crop_id, mandi_name, state, district, price_per_quintal,
          price_date, price_type, arrival_tonnes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let inserted = 0;
      marketPrices.forEach(mp => {
        try {
          const crop = getCropId.get(mp.crop_name);
          if (crop) {
            insertPrice.run(
              crop.id, mp.mandi_name, mp.state, mp.district || null,
              mp.price_per_quintal, mp.price_date, mp.price_type || 'modal',
              mp.arrival_tonnes || null
            );
            inserted++;
          }
        } catch (e) { /* skip duplicates or errors */ }
      });
      console.log(`  Seeded ${inserted} market prices`);

      // Generate price history from market prices
      generatePriceHistory(db);
    }

    // 7. Seed farmers
    const farmers = loadJSON('farmers.json');
    if (farmers.length) {
      const insertFarmer = db.prepare(`
        INSERT INTO farmers (name, phone, state, district, village, land_size_hectares,
          soil_type, primary_crop, irrigation_type, income_category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      farmers.forEach(f => {
        try {
          insertFarmer.run(
            f.name, f.phone, f.state, f.district, f.village || null,
            f.land_size_hectares || 1.0, f.soil_type || 'alluvial',
            f.primary_crop || null, f.irrigation_type || 'rainfed',
            f.income_category || 'small'
          );
        } catch (e) { console.warn(`  Skipping farmer ${f.name}: ${e.message}`); }
      });
      console.log(`  Seeded ${farmers.length} farmers`);
    }
  });

  try {
    seedAll();
    console.log('\nDatabase seeded successfully!');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

function generatePriceHistory(db) {
  // Aggregate market_prices into price_history by crop, state, month, year
  const insertHistory = db.prepare(`
    INSERT OR REPLACE INTO price_history (crop_id, state, month, year, avg_price, min_price, max_price, trend)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const aggregated = db.prepare(`
    SELECT crop_id, state,
      CAST(strftime('%m', price_date) AS INTEGER) as month,
      CAST(strftime('%Y', price_date) AS INTEGER) as year,
      ROUND(AVG(price_per_quintal), 2) as avg_price,
      MIN(price_per_quintal) as min_price,
      MAX(price_per_quintal) as max_price
    FROM market_prices
    GROUP BY crop_id, state, year, month
    ORDER BY crop_id, state, year, month
  `).all();

  let count = 0;
  for (let i = 0; i < aggregated.length; i++) {
    const row = aggregated[i];
    let trend = 'stable';
    // Compare with previous month
    if (i > 0 && aggregated[i - 1].crop_id === row.crop_id && aggregated[i - 1].state === row.state) {
      const prevAvg = aggregated[i - 1].avg_price;
      const change = (row.avg_price - prevAvg) / prevAvg;
      if (change > 0.03) trend = 'rising';
      else if (change < -0.03) trend = 'falling';
    }
    try {
      insertHistory.run(row.crop_id, row.state, row.month, row.year, row.avg_price, row.min_price, row.max_price, trend);
      count++;
    } catch (e) { /* skip */ }
  }
  console.log(`  Generated ${count} price history records`);
}

seed();
