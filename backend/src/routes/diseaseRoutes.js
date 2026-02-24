const express = require('express');
const router = express.Router();
const DiseaseModel = require('../models/diseaseModel');
const { detectDisease } = require('../services/diseaseDetector');
const upload = require('../middleware/upload');

// GET /list - List diseases with optional crop and search filters
router.get('/list', (req, res, next) => {
    try {
        const { crop, search } = req.query;
        let diseases;

        if (crop) {
            diseases = DiseaseModel.getByCrop(crop);
        } else if (search) {
            diseases = DiseaseModel.search(search);
        } else {
            diseases = DiseaseModel.getAll();
        }

        res.json({ success: true, data: diseases });
    } catch (error) {
        next(error);
    }
});

// GET /:id - Get disease by ID
router.get('/:id', (req, res, next) => {
    try {
        const disease = DiseaseModel.getById(req.params.id);
        if (!disease) {
            return res.status(404).json({ success: false, message: 'Disease not found' });
        }
        res.json({ success: true, data: disease });
    } catch (error) {
        next(error);
    }
});

// POST /detect - Detect disease from symptoms (with optional image upload)
router.post('/detect', upload.single('image'), (req, res, next) => {
    try {
        const {
            cropName,
            symptoms,
            affectedPart,
            spotColor,
            spotShape,
            hasFungalGrowth,
            weatherRecent
        } = req.body;

        if (!cropName) {
            return res.status(400).json({
                success: false,
                message: 'cropName is required'
            });
        }

        // Parse symptoms if it comes as a JSON string
        let parsedSymptoms = symptoms;
        if (typeof symptoms === 'string') {
            try {
                parsedSymptoms = JSON.parse(symptoms);
            } catch (e) {
                parsedSymptoms = [symptoms];
            }
        }

        const input = {
            cropName,
            symptoms: parsedSymptoms || [],
            affectedPart: affectedPart || null,
            spotColor: spotColor || null,
            spotShape: spotShape || null,
            hasFungalGrowth: hasFungalGrowth === 'true' || hasFungalGrowth === true,
            weatherRecent: weatherRecent || null
        };

        // If an image was uploaded, attach the file path to the input
        if (req.file) {
            input.imagePath = req.file.path;
        }

        const result = detectDisease(input);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
