const express = require('express');
const router = express.Router();
const SoilModel = require('../models/soilModel');
const { analyzeSoil } = require('../services/soilAnalyzer');

// GET /types - List all soil types
router.get('/types', (req, res, next) => {
    try {
        const types = SoilModel.getAllTypes();
        res.json({ success: true, data: types });
    } catch (error) {
        next(error);
    }
});

// GET /types/:name - Get soil type info by name
router.get('/types/:name', (req, res, next) => {
    try {
        const soilType = SoilModel.getTypeByName(req.params.name);
        if (!soilType) {
            return res.status(404).json({ success: false, message: 'Soil type not found' });
        }
        res.json({ success: true, data: soilType });
    } catch (error) {
        next(error);
    }
});

// POST /analyze - Analyze soil data and get recommendations
router.post('/analyze', (req, res, next) => {
    try {
        const {
            soil_type,
            ph_value,
            nitrogen_kg_per_ha,
            phosphorus_kg_per_ha,
            potassium_kg_per_ha,
            organic_carbon_percent,
            zinc_ppm,
            iron_ppm,
            manganese_ppm
        } = req.body;

        const soilData = {
            soil_type: soil_type || 'unknown',
            ph_value: ph_value != null ? parseFloat(ph_value) : null,
            nitrogen_kg_per_ha: nitrogen_kg_per_ha != null ? parseFloat(nitrogen_kg_per_ha) : null,
            phosphorus_kg_per_ha: phosphorus_kg_per_ha != null ? parseFloat(phosphorus_kg_per_ha) : null,
            potassium_kg_per_ha: potassium_kg_per_ha != null ? parseFloat(potassium_kg_per_ha) : null,
            organic_carbon_percent: organic_carbon_percent != null ? parseFloat(organic_carbon_percent) : null,
            zinc_ppm: zinc_ppm != null ? parseFloat(zinc_ppm) : null,
            iron_ppm: iron_ppm != null ? parseFloat(iron_ppm) : null,
            manganese_ppm: manganese_ppm != null ? parseFloat(manganese_ppm) : null
        };

        const analysis = analyzeSoil(soilData);
        res.json({ success: true, data: analysis });
    } catch (error) {
        next(error);
    }
});

// POST /tests - Save a soil test record
router.post('/tests', (req, res, next) => {
    try {
        const { farmer_id } = req.body;

        if (!farmer_id) {
            return res.status(400).json({
                success: false,
                message: 'farmer_id is required'
            });
        }

        const result = SoilModel.saveTest(req.body);
        res.status(201).json({
            success: true,
            data: { id: Number(result.lastInsertRowid), message: 'Soil test saved successfully' }
        });
    } catch (error) {
        next(error);
    }
});

// GET /tests/:farmerId - Get all soil tests for a farmer
router.get('/tests/:farmerId', (req, res, next) => {
    try {
        const tests = SoilModel.getTestsByFarmer(req.params.farmerId);
        res.json({ success: true, data: tests });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
