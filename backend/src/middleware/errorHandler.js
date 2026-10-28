/**
 * Central Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
    console.error('Unhandled Error:', err);

    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(isProduction ? {} : { stack: err.stack })
    });
}

module.exports = errorHandler;
