const { getDb } = require('../db/database');

class PestModel {
    /**
     * Get all pests.
     * @returns {Array} List of all pest records
     */
    static getAll() {
        const db = getDb();
        return db.prepare('SELECT * FROM pests ORDER BY name').all();
    }

    /**
     * Get a pest by ID.
     * @param {number} id - Pest ID
     * @returns {Object|undefined} Pest record or undefined
     */
    static getById(id) {
        const db = getDb();
        return db.prepare('SELECT * FROM pests WHERE id = ?').get(id);
    }

    /**
     * Get pests that target a specific crop.
     * target_crops is stored as a JSON array, so we use LIKE for matching.
     * @param {string} cropName - Name of the crop
     * @returns {Array} List of pests targeting the given crop
     */
    static getByCrop(cropName) {
        const db = getDb();
        return db.prepare(
            "SELECT * FROM pests WHERE LOWER(target_crops) LIKE LOWER(?) ORDER BY name"
        ).all(`%${cropName}%`);
    }

    /**
     * Search pests by name, Hindi name, or damage symptoms.
     * @param {string} query - Search query string
     * @returns {Array} List of matching pests
     */
    static search(query) {
        const db = getDb();
        const searchTerm = `%${query}%`;
        return db.prepare(
            `SELECT * FROM pests
             WHERE LOWER(name) LIKE LOWER(?)
                OR LOWER(name_hindi) LIKE LOWER(?)
                OR LOWER(damage_symptoms) LIKE LOWER(?)
             ORDER BY name`
        ).all(searchTerm, searchTerm, searchTerm);
    }
}

module.exports = PestModel;
