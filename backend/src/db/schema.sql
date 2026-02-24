-- KisanAI Database Schema
-- AI-Powered Farmer Advisory System for Indian Farmers
-- SQLite with WAL mode

-- ============================================================
-- FARMERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS farmers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    state TEXT NOT NULL DEFAULT '',
    district TEXT NOT NULL DEFAULT '',
    village TEXT NOT NULL DEFAULT '',
    land_size_hectares REAL DEFAULT 0.0,
    soil_type TEXT DEFAULT 'unknown',
    primary_crop TEXT DEFAULT '',
    irrigation_type TEXT DEFAULT 'rainfed',
    income_category TEXT DEFAULT 'small',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CROPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    name_hindi TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'cereal' CHECK(category IN ('cereal','pulse','oilseed','vegetable','fruit','spice','fiber','commercial')),
    season TEXT NOT NULL DEFAULT 'kharif' CHECK(season IN ('kharif','rabi','zaid')),
    sowing_month_start INTEGER DEFAULT 1 CHECK(sowing_month_start BETWEEN 1 AND 12),
    sowing_month_end INTEGER DEFAULT 1 CHECK(sowing_month_end BETWEEN 1 AND 12),
    harvest_month_start INTEGER DEFAULT 1 CHECK(harvest_month_start BETWEEN 1 AND 12),
    harvest_month_end INTEGER DEFAULT 1 CHECK(harvest_month_end BETWEEN 1 AND 12),
    water_requirement TEXT DEFAULT 'medium' CHECK(water_requirement IN ('low','medium','high','very_high')),
    temperature_min REAL DEFAULT 10.0,
    temperature_max REAL DEFAULT 40.0,
    suitable_soil_types TEXT DEFAULT '[]',
    msp_per_quintal REAL DEFAULT 0.0,
    avg_yield_per_hectare REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DISEASES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS diseases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_hindi TEXT DEFAULT '',
    crop_id INTEGER,
    pathogen_type TEXT NOT NULL DEFAULT 'fungal',
    symptoms TEXT DEFAULT '[]',
    leaf_indicators TEXT DEFAULT '[]',
    severity_levels TEXT DEFAULT '[]',
    favorable_conditions TEXT DEFAULT '{}',
    treatment TEXT DEFAULT '{}',
    prevention TEXT DEFAULT '[]',
    organic_treatment TEXT DEFAULT '[]',
    image_keywords TEXT DEFAULT '',
    affected_plant_part TEXT DEFAULT 'leaf',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- ============================================================
-- PESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_hindi TEXT DEFAULT '',
    pest_type TEXT NOT NULL DEFAULT 'insect',
    target_crops TEXT DEFAULT '[]',
    damage_symptoms TEXT DEFAULT '[]',
    lifecycle_days INTEGER DEFAULT 30,
    active_season TEXT DEFAULT 'kharif',
    active_months TEXT DEFAULT '[]',
    favorable_temp_min REAL DEFAULT 20.0,
    favorable_temp_max REAL DEFAULT 35.0,
    favorable_humidity_min REAL DEFAULT 60.0,
    favorable_humidity_max REAL DEFAULT 90.0,
    risk_factors TEXT DEFAULT '[]',
    control_chemical TEXT DEFAULT '[]',
    control_biological TEXT DEFAULT '[]',
    control_cultural TEXT DEFAULT '[]',
    severity_if_untreated TEXT DEFAULT 'moderate',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- MARKET_PRICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS market_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    mandi_name TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT '',
    district TEXT NOT NULL DEFAULT '',
    price_per_quintal REAL DEFAULT 0.0,
    price_date DATE DEFAULT CURRENT_DATE,
    price_type TEXT DEFAULT 'modal' CHECK(price_type IN ('min','max','modal')),
    arrival_tonnes REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- ============================================================
-- PRICE_HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    state TEXT NOT NULL DEFAULT '',
    month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    avg_price REAL DEFAULT 0.0,
    min_price REAL DEFAULT 0.0,
    max_price REAL DEFAULT 0.0,
    trend TEXT DEFAULT 'stable' CHECK(trend IN ('rising','falling','stable')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- ============================================================
-- SOIL_TYPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS soil_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    name_hindi TEXT DEFAULT '',
    description TEXT DEFAULT '',
    regions TEXT DEFAULT '[]',
    characteristics TEXT DEFAULT '{}',
    nutrient_profile TEXT DEFAULT '{}',
    suitable_crops TEXT DEFAULT '[]',
    recommended_fertilizers TEXT DEFAULT '[]',
    water_retention TEXT DEFAULT 'medium',
    ph_min REAL DEFAULT 5.5,
    ph_max REAL DEFAULT 8.5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SOIL_TESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS soil_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INTEGER NOT NULL,
    soil_type TEXT DEFAULT 'unknown',
    ph_value REAL DEFAULT 7.0,
    nitrogen_kg_per_ha REAL DEFAULT 0.0,
    phosphorus_kg_per_ha REAL DEFAULT 0.0,
    potassium_kg_per_ha REAL DEFAULT 0.0,
    organic_carbon_percent REAL DEFAULT 0.0,
    zinc_ppm REAL DEFAULT 0.0,
    iron_ppm REAL DEFAULT 0.0,
    manganese_ppm REAL DEFAULT 0.0,
    test_date DATE DEFAULT CURRENT_DATE,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- ============================================================
-- SCHEMES TABLE (Government Schemes)
-- ============================================================
CREATE TABLE IF NOT EXISTS schemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_hindi TEXT DEFAULT '',
    short_code TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    ministry TEXT DEFAULT '',
    scheme_type TEXT DEFAULT 'subsidy',
    benefit_amount TEXT DEFAULT '',
    eligibility_criteria TEXT DEFAULT '[]',
    required_documents TEXT DEFAULT '[]',
    application_process TEXT DEFAULT '[]',
    application_url TEXT DEFAULT '',
    helpline TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE DEFAULT NULL,
    target_states TEXT DEFAULT '["all"]',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- WEATHER_CACHE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS weather_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    forecast_data TEXT DEFAULT '{}',
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_diseases_crop ON diseases(crop_id);
CREATE INDEX IF NOT EXISTS idx_market_crop_date ON market_prices(crop_id, price_date);
CREATE INDEX IF NOT EXISTS idx_market_state ON market_prices(state);
CREATE INDEX IF NOT EXISTS idx_price_history_crop ON price_history(crop_id);
CREATE INDEX IF NOT EXISTS idx_soil_tests_farmer ON soil_tests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmers_state ON farmers(state);
