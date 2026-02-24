const express = require('express');
const router = express.Router();
const FarmerModel = require('../models/farmerModel');

// GET / - List all farmers
router.get('/', (req, res, next) => {
    try {
        const farmers = FarmerModel.getAll();
        res.json({ success: true, data: farmers });
    } catch (error) {
        next(error);
    }
});

// GET /:id - Get farmer by ID
router.get('/:id', (req, res, next) => {
    try {
        const farmer = FarmerModel.getById(req.params.id);
        if (!farmer) {
            return res.status(404).json({ success: false, message: 'Farmer not found' });
        }
        res.json({ success: true, data: farmer });
    } catch (error) {
        next(error);
    }
});

// POST / - Create a new farmer
router.post('/', (req, res, next) => {
    try {
        const { name, state, district } = req.body;

        // Validate required fields
        if (!name || !state || !district) {
            return res.status(400).json({
                success: false,
                message: 'Name, state, and district are required fields'
            });
        }

        const result = FarmerModel.create(req.body);
        const farmer = FarmerModel.getById(result.lastInsertRowid);

        res.status(201).json({ success: true, data: farmer });
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({
                success: false,
                message: 'A farmer with this phone number already exists'
            });
        }
        next(error);
    }
});

// PUT /:id - Update a farmer
router.put('/:id', (req, res, next) => {
    try {
        const existing = FarmerModel.getById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Farmer not found' });
        }

        FarmerModel.update(req.params.id, req.body);
        const updated = FarmerModel.getById(req.params.id);

        res.json({ success: true, data: updated });
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({
                success: false,
                message: 'A farmer with this phone number already exists'
            });
        }
        next(error);
    }
});

// DELETE /:id - Delete a farmer
router.delete('/:id', (req, res, next) => {
    try {
        const existing = FarmerModel.getById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Farmer not found' });
        }

        FarmerModel.delete(req.params.id);
        res.json({ success: true, data: { message: 'Farmer deleted successfully' } });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
