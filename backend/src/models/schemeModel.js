const { getDb } = require('../db/database');

class SchemeModel {
    /**
     * Get all schemes.
     * @returns {Array} List of all scheme records
     */
    static getAll() {
        const db = getDb();
        return db.prepare('SELECT * FROM schemes ORDER BY name').all();
    }

    /**
     * Get a scheme by ID.
     * @param {number} id - Scheme ID
     * @returns {Object|undefined} Scheme record or undefined
     */
    static getById(id) {
        const db = getDb();
        return db.prepare('SELECT * FROM schemes WHERE id = ?').get(id);
    }

    /**
     * Get schemes by type (e.g., subsidy, insurance, credit, etc.).
     * @param {string} type - Scheme type
     * @returns {Array} List of schemes of the given type
     */
    static getByType(type) {
        const db = getDb();
        return db.prepare(
            'SELECT * FROM schemes WHERE LOWER(scheme_type) = LOWER(?) ORDER BY name'
        ).all(type);
    }

    /**
     * Get all currently active schemes.
     * @returns {Array} List of active scheme records
     */
    static getActive() {
        const db = getDb();
        return db.prepare(
            'SELECT * FROM schemes WHERE is_active = 1 ORDER BY name'
        ).all();
    }

    /**
     * Search schemes by name, Hindi name, description, or ministry.
     * @param {string} query - Search query string
     * @returns {Array} List of matching schemes
     */
    static search(query) {
        const db = getDb();
        const searchTerm = `%${query}%`;
        return db.prepare(`
            SELECT * FROM schemes
            WHERE LOWER(name) LIKE LOWER(?)
               OR LOWER(name_hindi) LIKE LOWER(?)
               OR LOWER(description) LIKE LOWER(?)
               OR LOWER(ministry) LIKE LOWER(?)
            ORDER BY name
        `).all(searchTerm, searchTerm, searchTerm, searchTerm);
    }
}

module.exports = SchemeModel;
