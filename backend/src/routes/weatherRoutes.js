const express = require('express');
const router = express.Router();
const { getForecast, generateFarmingTips } = require('../services/weatherAdvisor');

// GET /forecast - Get weather forecast for a location
router.get('/forecast', async (req, res, next) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                message: 'lat and lon query parameters are required'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                message: 'lat and lon must be valid numbers'
            });
        }

        const forecast = await getForecast(latitude, longitude);
        res.json({ success: true, data: forecast });
    } catch (error) {
        next(error);
    }
});

// GET /tips - Get farming tips based on weather forecast
router.get('/tips', async (req, res, next) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                message: 'lat and lon query parameters are required'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                message: 'lat and lon must be valid numbers'
            });
        }

        const forecast = await getForecast(latitude, longitude);
        const tips = generateFarmingTips(forecast);

        res.json({ success: true, data: tips });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
