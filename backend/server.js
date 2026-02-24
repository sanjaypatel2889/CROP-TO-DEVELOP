require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Database
const { initializeDatabase } = require('./src/db/database');

// Middleware
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const farmerRoutes = require('./src/routes/farmerRoutes');
const diseaseRoutes = require('./src/routes/diseaseRoutes');
const weatherRoutes = require('./src/routes/weatherRoutes');
const marketRoutes = require('./src/routes/marketRoutes');
const soilRoutes = require('./src/routes/soilRoutes');
const pestRoutes = require('./src/routes/pestRoutes');
const schemeRoutes = require('./src/routes/schemeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// Middleware
// ============================================================

// Enable CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true
}));

// Parse JSON request bodies with a 10MB limit
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// Initialize Database
// ============================================================
try {
    initializeDatabase();
    console.log('[Server] Database initialized successfully');
} catch (err) {
    console.error('[Server] Failed to initialize database:', err.message);
    process.exit(1);
}

// ============================================================
// Routes
// ============================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'KisanAI API is running',
        timestamp: new Date().toISOString()
    });
});

// API route mounts
app.use('/api/farmers', farmerRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/pests', pestRoutes);
app.use('/api/schemes', schemeRoutes);

// ============================================================
// Error Handling
// ============================================================
app.use(errorHandler);

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
    console.log(`[Server] KisanAI backend running on http://localhost:${PORT}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
