const { getDb } = require('../db/database');

class DiseaseModel {
    /**
     * Get all diseases with their associated crop name.
     * @returns {Array} List of all disease records joined with crops
     */
    static getAll() {
        const db = getDb();
        return db.prepare(`
            SELECT d.*, c.name AS crop_name, c.name_hindi AS crop_name_hindi
            FROM diseases d
            JOIN crops c ON d.crop_id = c.id
            ORDER BY d.name
        `).all();
    }

    /**
     * Get a disease by ID with its associated crop name.
     * @param {number} id - Disease ID
     * @returns {Object|undefined} Disease record or undefined
     */
    static getById(id) {
        const db = getDb();
        return db.prepare(`
            SELECT d.*, c.name AS crop_name, c.name_hindi AS crop_name_hindi
            FROM diseases d
            JOIN crops c ON d.crop_id = c.id
            WHERE d.id = ?
        `).get(id);
    }

    /**
     * Get all diseases for a specific crop by crop name.
     * @param {string} cropName - Name of the crop
     * @returns {Array} List of diseases for the given crop
     */
    static getByCrop(cropName) {
        const db = getDb();
        return db.prepare(`
            SELECT d.*, c.name AS crop_name, c.name_hindi AS crop_name_hindi
            FROM diseases d
            JOIN crops c ON d.crop_id = c.id
            WHERE LOWER(c.name) = LOWER(?)
            ORDER BY d.name
        `).all(cropName);
    }

    /**
     * Search diseases by name, Hindi name, or symptoms.
     * @param {string} query - Search query string
     * @returns {Array} List of matching diseases
     */
    static search(query) {
        const db = getDb();
        const searchTerm = `%${query}%`;
        return db.prepare(`
            SELECT d.*, c.name AS crop_name, c.name_hindi AS crop_name_hindi
            FROM diseases d
            JOIN crops c ON d.crop_id = c.id
            WHERE LOWER(d.name) LIKE LOWER(?)
               OR LOWER(d.name_hindi) LIKE LOWER(?)
               OR LOWER(d.symptoms) LIKE LOWER(?)
            ORDER BY d.name
        `).all(searchTerm, searchTerm, searchTerm);
    }
}

module.exports = DiseaseModel;
