const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { isDatabaseConfigured } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const facultyRoutes = require('./routes/faculty.routes');
const masterRoutes = require('./routes/master.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Headers (configured to allow local scripts, styles, and fonts)
app.use(
    helmet({
        contentSecurityPolicy: false, // Disabled for flexibility in static vanilla frontend with inline scripts/styles
        crossOriginEmbedderPolicy: false
    })
);

// CORS Configuration
const allowedOrigins = process.env.FRONTEND_ORIGINS 
    ? process.env.FRONTEND_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, same-origin static frontend)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        // Support common hosting platforms (Render, Vercel, Netlify) and localhost
        if (
            origin.includes('localhost') || 
            origin.includes('127.0.0.1') ||
            origin.endsWith('.onrender.com') ||
            origin.endsWith('.vercel.app') ||
            origin.endsWith('.netlify.app')
        ) {
            return callback(null, true);
        }
        return callback(null, true); // Fallback to permit request in case of custom cloud domains
    },
    credentials: true
}));

// Request Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('dev'));

// Rate Limiting for Auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 login attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
    }
});

// Health Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'BitCampus Academic Portal API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database: isDatabaseConfigured ? 'Supabase PostgreSQL configured' : 'DATABASE_URL not configured',
        rolesSupported: ['student', 'faculty', 'master']
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'BitCampus API',
        database: isDatabaseConfigured ? 'Supabase PostgreSQL configured' : 'DATABASE_URL not configured'
    });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/master', masterRoutes);

// Root Endpoint (Ideal for Render service health checks and status)
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'BitCampus Backend API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database: isDatabaseConfigured ? 'Supabase PostgreSQL configured' : 'DATABASE_URL not configured',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            student: '/api/student',
            faculty: '/api/faculty',
            master: '/api/master'
        }
    });
});

// Optionally serve Frontend Static Files if frontend folder is present locally
const fs = require('fs');
const siblingFrontendPath = path.join(__dirname, '../../frontend');
const localFrontendPath = path.join(__dirname, '../frontend');

if (fs.existsSync(siblingFrontendPath)) {
    app.use(express.static(siblingFrontendPath));
} else if (fs.existsSync(localFrontendPath)) {
    app.use(express.static(localFrontendPath));
}

// API 404 Fallback
app.all('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint '${req.originalUrl}' not found.`
    });
});

const { initDb } = require('./config/db');

// Central Error Handling
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, async () => {
        console.log(`=======================================================`);
        console.log(`🚀 BitCampus Server is running on http://localhost:${PORT}`);
        console.log(`📡 Database: ${isDatabaseConfigured ? 'PostgreSQL connection string configured' : 'DATABASE_URL is not configured'}`);
        console.log(`🎓 Student Portal: http://localhost:${PORT}/pages/dashboard.html`);
        console.log(`👨‍🏫 Faculty Portal: http://localhost:${PORT}/pages/faculty-dashboard.html`);
        console.log(`👑 Master / HOD Portal: http://localhost:${PORT}/pages/master-dashboard.html`);
        console.log(`=======================================================`);
        
        try {
            await initDb();
        } catch (dbErr) {
            console.error('Warning: DB auto-init skipped:', dbErr.message);
        }
    });
}

module.exports = app;
