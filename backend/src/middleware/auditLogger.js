const { supabaseAdminClient, isConfigured, memoryStore } = require('../config/supabase');

/**
 * Log administrative or sensitive actions for auditing
 */
async function logAuditAction({ actorId, actorName, action, entity, entityId, details, req }) {
    const timestamp = new Date().toISOString();
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';

    const logEntry = {
        actor: actorName || 'System Admin',
        actor_id: actorId,
        action,
        entity,
        entity_id: entityId ? String(entityId) : null,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        ip_address: ipAddress,
        timestamp
    };

    // Store in memory for instant query
    memoryStore.auditLogs.unshift(logEntry);

    // If Supabase is connected and admin client is available, record to database table
    if (isConfigured && supabaseAdminClient) {
        try {
            await supabaseAdminClient.from('audit_logs').insert([{
                actor_id: actorId,
                action,
                entity,
                entity_id: entityId ? String(entityId) : null,
                details: typeof details === 'object' ? details : { message: details },
                ip_address: ipAddress
            }]);
        } catch (err) {
            console.error('Failed to persist audit log in Supabase:', err.message);
        }
    }
}

module.exports = { logAuditAction };
