const { getDb } = require('../db/database');

class MarketModel {
    /**
     * Get current market prices for a crop, optionally filtered by state.
     * @param {string} cropName - Name of the crop
     * @param {string} [state] - State name (optional)
     * @returns {Array} List of market price records joined with crop info
     */
    static getPrices(cropName, state) {
        const db = getDb();
        let query = `
            SELECT mp.*, c.name AS crop_name, c.msp_per_quintal
            FROM market_prices mp
            JOIN crops c ON mp.crop_id = c.id
            WHERE LOWER(c.name) = LOWER(?)
        `;
        const params = [cropName];

        if (state) {
            query += ' AND LOWER(mp.state) = LOWER(?)';
            params.push(state);
        }

        query += ' ORDER BY mp.price_date DESC LIMIT 50';
        return db.prepare(query).all(...params);
    }

    /**
     * Get price history for a crop, optionally filtered by state.
     * @param {string} cropName - Name of the crop
     * @param {string} [state] - State name (optional)
     * @returns {Array} List of historical price records
     */
    static getHistory(cropName, state) {
        const db = getDb();
        let query = `
            SELECT ph.*, c.name AS crop_name
            FROM price_history ph
            JOIN crops c ON ph.crop_id = c.id
            WHERE LOWER(c.name) = LOWER(?)
        `;
        const params = [cropName];

        if (state) {
            query += ' AND LOWER(ph.state) = LOWER(?)';
            params.push(state);
        }

        query += ' ORDER BY ph.year DESC, ph.month DESC LIMIT 24';
        return db.prepare(query).all(...params);
    }

    /**
     * Get all mandis (market yards) in a state.
     * @param {string} state - State name
     * @returns {Array} List of distinct mandi records in the state
     */
    static getMandis(state) {
        const db = getDb();
        return db.prepare(`
            SELECT DISTINCT mandi_name, state, district
            FROM market_prices
            WHERE LOWER(state) = LOWER(?)
            ORDER BY mandi_name
        `).all(state);
    }

    /**
     * Get the list of all crops that have market price data.
     * @returns {Array} List of crop names with price data
     */
    static getCropList() {
        const db = getDb();
        return db.prepare(`
            SELECT DISTINCT c.id, c.name, c.name_hindi, c.category, c.season, c.msp_per_quintal
            FROM crops c
            JOIN market_prices mp ON c.id = mp.crop_id
            ORDER BY c.name
        `).all();
    }
}

module.exports = MarketModel;
