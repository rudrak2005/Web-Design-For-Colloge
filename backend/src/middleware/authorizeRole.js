/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles - e.g. 'student', 'faculty', 'master'
 */
function authorizeRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No active user session identified.'
            });
        }

        const userRole = req.user.role;

        // 'master' (HOD / Super Admin) has unrestricted permission to access any resource
        if (userRole === 'master') {
            return next();
        }

        if (allowedRoles.includes(userRole)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Access Denied: Your role '${userRole}' is not authorized to access this resource. Required: ${allowedRoles.join(' or ')}.`
        });
    };
}

module.exports = authorizeRole;
