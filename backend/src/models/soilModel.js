const { getDb } = require('../db/database');

class SoilModel {
    /**
     * Get all soil types.
     * @returns {Array} List of all soil type records
     */
    static getAllTypes() {
        const db = getDb();
        return db.prepare('SELECT * FROM soil_types ORDER BY name').all();
    }

    /**
     * Get a soil type by its name.
     * @param {string} name - Soil type name
     * @returns {Object|undefined} Soil type record or undefined
     */
    static getTypeByName(name) {
        const db = getDb();
        return db.prepare('SELECT * FROM soil_types WHERE LOWER(name) = LOWER(?)').get(name);
    }

    /**
     * Save a soil test record.
     * @param {Object} data - Soil test data
     * @param {number} data.farmer_id - Farmer ID (required)
     * @param {string} [data.soil_type] - Soil type
     * @param {number} [data.ph_value] - pH value
     * @param {number} [data.nitrogen_kg_per_ha] - Nitrogen in kg/ha
     * @param {number} [data.phosphorus_kg_per_ha] - Phosphorus in kg/ha
     * @param {number} [data.potassium_kg_per_ha] - Potassium in kg/ha
     * @param {number} [data.organic_carbon_percent] - Organic carbon percentage
     * @param {number} [data.zinc_ppm] - Zinc in ppm
     * @param {number} [data.iron_ppm] - Iron in ppm
     * @param {number} [data.manganese_ppm] - Manganese in ppm
     * @param {string} [data.notes] - Additional notes
     * @returns {Object} Insert result with lastInsertRowid
     */
    static saveTest(data) {
        const db = getDb();
        const stmt = db.prepare(`
            INSERT INTO soil_tests (farmer_id, soil_type, ph_value, nitrogen_kg_per_ha,
                phosphorus_kg_per_ha, potassium_kg_per_ha, organic_carbon_percent,
                zinc_ppm, iron_ppm, manganese_ppm, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            data.farmer_id,
            data.soil_type || 'unknown',
            data.ph_value || 7.0,
            data.nitrogen_kg_per_ha || 0.0,
            data.phosphorus_kg_per_ha || 0.0,
            data.potassium_kg_per_ha || 0.0,
            data.organic_carbon_percent || 0.0,
            data.zinc_ppm || 0.0,
            data.iron_ppm || 0.0,
            data.manganese_ppm || 0.0,
            data.notes || ''
        );
    }

    /**
     * Get all soil test records for a specific farmer.
     * @param {number} farmerId - Farmer ID
     * @returns {Array} List of soil test records for the farmer
     */
    static getTestsByFarmer(farmerId) {
        const db = getDb();
        return db.prepare(
            'SELECT * FROM soil_tests WHERE farmer_id = ? ORDER BY test_date DESC'
        ).all(farmerId);
    }
}

module.exports = SoilModel;
