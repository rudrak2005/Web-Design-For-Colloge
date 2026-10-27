/**
 * BitCampus Central API Helper & Session Manager
 * Handles Bearer token, role guards, error alerts, and unified fetch calls
 */

const API_CONFIG = {
    baseURL: (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'http://localhost:3000'
};

// Handle local live servers, file preview, or explicit backend URL
if (typeof window !== 'undefined') {
    if (window.BITCAMPUS_API_URL) {
        API_CONFIG.baseURL = window.BITCAMPUS_API_URL.replace(/\/$/, '');
    } else if (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501') {
        API_CONFIG.baseURL = 'http://localhost:3000';
    } else {
        // Same-origin relative host (works on Render, localhost:3000, and custom domains)
        API_CONFIG.baseURL = window.location.origin;
    }
}

const BitCampusAuth = {
    STORAGE_KEY: 'bitCampusSession',

    getSession() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY) || sessionStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Session read error:', e);
            return null;
        }
    },

    setSession(token, user, remember = true) {
        const session = {
            token,
            user,
            loggedIn: true,
            loginTime: new Date().toISOString()
        };
        const storage = remember ? localStorage : sessionStorage;
        localStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem(this.STORAGE_KEY);
        storage.setItem(this.STORAGE_KEY, JSON.stringify(session));
        return session;
    },

    clearSession() {
        localStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem(this.STORAGE_KEY);
        window.location.href = '/login.html';
    },

    getToken() {
        const session = this.getSession();
        return session ? session.token : null;
    },

    getUser() {
        const session = this.getSession();
        return session ? session.user : null;
    },

    /**
     * Enforce role authorization on protected pages
     * @param {'student'|'faculty'|'master'} requiredRole 
     */
    requireRole(requiredRole) {
        const session = this.getSession();
        if (!session || !session.token || !session.user) {
            console.warn('No active session, redirecting to login...');
            window.location.replace('/login.html');
            return false;
        }

        const role = session.user.role || 'student';

        // Master has access to all pages
        if (role === 'master') {
            return true;
        }

        if (role !== requiredRole) {
            console.warn(`Unauthorized role: ${role}. Required: ${requiredRole}`);
            alert(`Access Restricted: Your role '${role}' cannot access this portal.`);
            
            // Redirect to appropriate portal
            if (role === 'faculty') {
                window.location.replace('/pages/faculty-dashboard.html');
            } else {
                window.location.replace('/pages/dashboard.html');
            }
            return false;
        }

        return true;
    }
};

/**
 * Standard fetch wrapper with automatic Authorization header
 */
async function bitFetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') 
        ? endpoint 
        : `${API_CONFIG.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    const token = BitCampusAuth.getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            console.warn('Session expired or unauthorized');
            // If on a protected page, redirect to login
            if (!window.location.pathname.includes('login.html')) {
                BitCampusAuth.clearSession();
            }
        }

        if (!response.ok) {
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        return data;
    } catch (err) {
        console.error(`API Error [${endpoint}]:`, err.message);
        throw err;
    }
}

// Bind universal logout buttons
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtns = document.querySelectorAll('#logoutBtn, [data-logout-btn]');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await bitFetch('/api/auth/logout', { method: 'POST' });
            } catch (err) {
                // Ignore logout network errors and proceed
            }
            BitCampusAuth.clearSession();
        });
    });
});
