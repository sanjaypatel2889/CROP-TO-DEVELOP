const express = require('express');
const router = express.Router();
const SchemeModel = require('../models/schemeModel');
const { findMatchingSchemes } = require('../services/schemeFinder');

// GET /list - List all schemes with optional type filter
router.get('/list', (req, res, next) => {
    try {
        const { type } = req.query;
        let schemes;

        if (type) {
            schemes = SchemeModel.getByType(type);
        } else {
            schemes = SchemeModel.getAll();
        }

        res.json({ success: true, data: schemes });
    } catch (error) {
        next(error);
    }
});

// POST /match - Match schemes to a farmer profile
router.post('/match', (req, res, next) => {
    try {
        const { state, landSize, incomeCategory, primaryCrop, irrigationType } = req.body;

        const farmerProfile = {
            state: state || null,
            landSize: landSize != null ? parseFloat(landSize) : null,
            incomeCategory: incomeCategory || null,
            primaryCrop: primaryCrop || null,
            irrigationType: irrigationType || null
        };

        const result = findMatchingSchemes(farmerProfile);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// GET /:id - Get scheme by ID
// NOTE: This route is placed AFTER /match so that "match" is not interpreted as an ID
router.get('/:id', (req, res, next) => {
    try {
        const scheme = SchemeModel.getById(req.params.id);
        if (!scheme) {
            return res.status(404).json({ success: false, message: 'Scheme not found' });
        }
        res.json({ success: true, data: scheme });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
