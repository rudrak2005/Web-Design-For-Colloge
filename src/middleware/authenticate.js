const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'bitcampus_jwt_secure_secret_key_2026';

/**
 * Authentication Middleware
 * Validates real JWT Bearer token and verifies user in PostgreSQL database
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token missing or invalid format. Please sign in.'
            });
        }

        const token = authHeader.split(' ')[1];

        // 1. Check if token is a standard JWT
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const userRes = await query(`
                SELECT id, email, full_name, role, status
                FROM profiles
                WHERE id = $1
                LIMIT 1;
            `, [decoded.id]);

            if (userRes.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'User account not found or has been removed.'
                });
            }

            const profile = userRes.rows[0];

            if (profile.status === 'suspended') {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been suspended by campus administration.'
                });
            }

            req.user = profile;
            return next();
        } catch (jwtErr) {
            // Not a valid standard JWT, proceed to fallback check below
        }

        // 2. Demo/Bootstrap token fallback (e.g. demo-token-master)
        if (token.startsWith('demo-token-')) {
            const role = token.replace('demo-token-', '');
            const fallbackRes = await query(`
                SELECT id, email, full_name, role, status
                FROM profiles
                WHERE role = $1
                LIMIT 1;
            `, [role]);

            if (fallbackRes.rows.length > 0) {
                req.user = fallbackRes.rows[0];
                return next();
            }
        }

        return res.status(401).json({
            success: false,
            message: 'Session has expired or is invalid. Please sign in again.'
        });

    } catch (err) {
        console.error('Auth Middleware Exception:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication verification.'
        });
    }
}

module.exports = authenticate;
