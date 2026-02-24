const express = require('express');
const router = express.Router();
const PestModel = require('../models/pestModel');
const { predictPestRisk } = require('../services/pestWarning');

// GET /list - List all pests
router.get('/list', (req, res, next) => {
    try {
        const pests = PestModel.getAll();
        res.json({ success: true, data: pests });
    } catch (error) {
        next(error);
    }
});

// GET /predict - Predict pest risk for a crop
// NOTE: This route must be defined BEFORE /:id to avoid matching "predict" as an ID
router.get('/predict', (req, res, next) => {
    try {
        const { crop, state, month, temp, humidity } = req.query;

        if (!crop) {
            return res.status(400).json({
                success: false,
                message: 'crop query parameter is required'
            });
        }

        const parsedMonth = month ? parseInt(month, 10) : null;
        const weatherData = {};

        if (temp) weatherData.temp = parseFloat(temp);
        if (humidity) weatherData.humidity = parseFloat(humidity);

        const result = predictPestRisk(
            crop,
            state || null,
            parsedMonth,
            Object.keys(weatherData).length > 0 ? weatherData : null
        );

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// GET /:id - Get pest by ID
// NOTE: This route is placed AFTER /predict so that "predict" is not interpreted as an ID
router.get('/:id', (req, res, next) => {
    try {
        const pest = PestModel.getById(req.params.id);
        if (!pest) {
            return res.status(404).json({ success: false, message: 'Pest not found' });
        }
        res.json({ success: true, data: pest });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
