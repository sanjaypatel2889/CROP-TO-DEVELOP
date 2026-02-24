const express = require('express');
const router = express.Router();
const MarketModel = require('../models/marketModel');
const { generateSignal } = require('../services/marketPredictor');

// GET /prices - Get market prices for a crop
router.get('/prices', (req, res, next) => {
    try {
        const { crop, state } = req.query;

        if (!crop) {
            return res.status(400).json({
                success: false,
                message: 'crop query parameter is required'
            });
        }

        const prices = MarketModel.getPrices(crop, state);
        res.json({ success: true, data: prices });
    } catch (error) {
        next(error);
    }
});

// GET /signal - Get buy/sell/hold signal for a crop
router.get('/signal', (req, res, next) => {
    try {
        const { crop, state } = req.query;

        if (!crop) {
            return res.status(400).json({
                success: false,
                message: 'crop query parameter is required'
            });
        }

        const signal = generateSignal(crop, state);

        if (signal.error) {
            return res.status(404).json({ success: false, message: signal.error });
        }

        res.json({ success: true, data: signal });
    } catch (error) {
        next(error);
    }
});

// GET /history - Get price history for a crop
router.get('/history', (req, res, next) => {
    try {
        const { crop, state } = req.query;

        if (!crop) {
            return res.status(400).json({
                success: false,
                message: 'crop query parameter is required'
            });
        }

        const history = MarketModel.getHistory(crop, state);
        res.json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
