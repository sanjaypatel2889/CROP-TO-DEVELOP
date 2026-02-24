const { getDb } = require('../db/database');

class CropModel {
    /**
     * Get all crops.
     * @returns {Array} List of all crop records
     */
    static getAll() {
        const db = getDb();
        return db.prepare('SELECT * FROM crops ORDER BY name').all();
    }

    /**
     * Get a crop by ID.
     * @param {number} id - Crop ID
     * @returns {Object|undefined} Crop record or undefined
     */
    static getById(id) {
        const db = getDb();
        return db.prepare('SELECT * FROM crops WHERE id = ?').get(id);
    }

    /**
     * Get crops by season (kharif, rabi, zaid).
     * @param {string} season - Season name
     * @returns {Array} List of crops for the given season
     */
    static getBySeason(season) {
        const db = getDb();
        return db.prepare('SELECT * FROM crops WHERE LOWER(season) = LOWER(?) ORDER BY name').all(season);
    }

    /**
     * Get crops by category (cereal, pulse, oilseed, vegetable, fruit, spice, fiber, commercial).
     * @param {string} category - Category name
     * @returns {Array} List of crops for the given category
     */
    static getByCategory(category) {
        const db = getDb();
        return db.prepare('SELECT * FROM crops WHERE LOWER(category) = LOWER(?) ORDER BY name').all(category);
    }

    /**
     * Search crops by name or Hindi name.
     * @param {string} query - Search query string
     * @returns {Array} List of matching crops
     */
    static search(query) {
        const db = getDb();
        const searchTerm = `%${query}%`;
        return db.prepare(
            'SELECT * FROM crops WHERE LOWER(name) LIKE LOWER(?) OR LOWER(name_hindi) LIKE LOWER(?) ORDER BY name'
        ).all(searchTerm, searchTerm);
    }
}

module.exports = CropModel;
