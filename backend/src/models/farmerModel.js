const { getDb } = require('../db/database');

class FarmerModel {
    /**
     * Get all farmers.
     * @returns {Array} List of all farmer records
     */
    static getAll() {
        const db = getDb();
        return db.prepare('SELECT * FROM farmers ORDER BY created_at DESC').all();
    }

    /**
     * Get a farmer by ID.
     * @param {number} id - Farmer ID
     * @returns {Object|undefined} Farmer record or undefined
     */
    static getById(id) {
        const db = getDb();
        return db.prepare('SELECT * FROM farmers WHERE id = ?').get(id);
    }

    /**
     * Get a farmer by phone number.
     * @param {string} phone - Phone number
     * @returns {Object|undefined} Farmer record or undefined
     */
    static getByPhone(phone) {
        const db = getDb();
        return db.prepare('SELECT * FROM farmers WHERE phone = ?').get(phone);
    }

    /**
     * Create a new farmer.
     * @param {Object} data - Farmer data
     * @param {string} data.name - Farmer name (required)
     * @param {string} data.phone - Phone number (required, unique)
     * @param {string} data.state - State (required)
     * @param {string} data.district - District (required)
     * @param {string} [data.village] - Village
     * @param {number} [data.land_size_hectares] - Land size in hectares
     * @param {string} [data.soil_type] - Soil type
     * @param {string} [data.primary_crop] - Primary crop
     * @param {string} [data.irrigation_type] - Irrigation type
     * @param {string} [data.income_category] - Income category
     * @returns {Object} Insert result with lastInsertRowid
     */
    static create(data) {
        const db = getDb();
        const stmt = db.prepare(`
            INSERT INTO farmers (name, phone, state, district, village, land_size_hectares,
                soil_type, primary_crop, irrigation_type, income_category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            data.name,
            data.phone || '',
            data.state,
            data.district,
            data.village || '',
            data.land_size_hectares || 0.0,
            data.soil_type || 'unknown',
            data.primary_crop || '',
            data.irrigation_type || 'rainfed',
            data.income_category || 'small'
        );
    }

    /**
     * Update an existing farmer.
     * @param {number} id - Farmer ID
     * @param {Object} data - Fields to update
     * @returns {Object} Update result with changes count
     */
    static update(id, data) {
        const db = getDb();
        const fields = [];
        const values = [];

        const allowedFields = [
            'name', 'phone', 'state', 'district', 'village',
            'land_size_hectares', 'soil_type', 'primary_crop',
            'irrigation_type', 'income_category'
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        }

        if (fields.length === 0) {
            return { changes: 0 };
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const stmt = db.prepare(`UPDATE farmers SET ${fields.join(', ')} WHERE id = ?`);
        return stmt.run(...values);
    }

    /**
     * Delete a farmer by ID.
     * @param {number} id - Farmer ID
     * @returns {Object} Delete result with changes count
     */
    static delete(id) {
        const db = getDb();
        return db.prepare('DELETE FROM farmers WHERE id = ?').run(id);
    }
}

module.exports = FarmerModel;
