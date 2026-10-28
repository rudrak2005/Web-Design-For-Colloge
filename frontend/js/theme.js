/* ============================================================================
   BITCAMPUS UNIVERSAL THEME CONTROLLER (js/theme.js)
   Supports full Dark and Light themes across all pages with localStorage sync
============================================================================ */

(function () {
    const THEME_KEY = 'bitcampus_theme';
    const THEME_DARK = 'dark';
    const THEME_LIGHT = 'light';

    // 1. Detect initial theme
    function getStoredTheme() {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === THEME_DARK || stored === THEME_LIGHT) {
            return stored;
        }
        // If system prefers dark, default to dark, otherwise light
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return THEME_DARK;
        }
        return THEME_LIGHT;
    }

    // 2. Apply Theme to DOM
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if (document.body) {
            document.body.setAttribute('data-theme', theme);
            if (theme === THEME_DARK) {
                document.body.classList.add('dark-theme');
                document.body.classList.remove('light-theme');
            } else {
                document.body.classList.add('light-theme');
                document.body.classList.remove('dark-theme');
            }
        }

        // Update all theme toggle buttons on page
        const themeButtons = document.querySelectorAll('#themeBtn, .theme-toggle-btn, [data-action="toggle-theme"]');
        themeButtons.forEach(btn => {
            if (theme === THEME_DARK) {
                btn.innerHTML = '☀️';
                btn.setAttribute('title', 'Switch to Warm Academic Light Theme');
                btn.setAttribute('aria-label', 'Switch to Light Theme');
            } else {
                btn.innerHTML = '🌙';
                btn.setAttribute('title', 'Switch to Obsidian Dark Theme');
                btn.setAttribute('aria-label', 'Switch to Dark Theme');
            }
        });

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('bitcampus-theme-changed', { detail: { theme } }));
    }

    // 3. Toggle Theme
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || THEME_LIGHT;
        const nextTheme = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
        localStorage.setItem(THEME_KEY, nextTheme);
        applyTheme(nextTheme);
    }

    // Expose globally
    window.BitCampusTheme = {
        getTheme: () => document.documentElement.getAttribute('data-theme') || THEME_LIGHT,
        setTheme: (theme) => {
            localStorage.setItem(THEME_KEY, theme);
            applyTheme(theme);
        },
        toggleTheme
    };

    // Apply immediately to prevent white flash
    const initialTheme = getStoredTheme();
    document.documentElement.setAttribute('data-theme', initialTheme);

    // Setup on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(getStoredTheme());

        // Attach listeners to all theme buttons
        const attachListeners = () => {
            const themeButtons = document.querySelectorAll('#themeBtn, .theme-toggle-btn, [data-action="toggle-theme"]');
            themeButtons.forEach(btn => {
                // Avoid multiple listeners
                if (!btn.dataset.themeBound) {
                    btn.dataset.themeBound = 'true';
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        toggleTheme();
                    });
                }
            });
        };

        attachListeners();

        // If topbar exists on a subpage without a theme toggle, inject a subtle one into header
        const topActions = document.querySelector('.top-actions, .page-header-actions, .header-right');
        if (topActions && !document.getElementById('themeBtn')) {
            const autoBtn = document.createElement('button');
            autoBtn.id = 'themeBtn';
            autoBtn.className = 'top-icon theme-toggle-btn';
            autoBtn.innerHTML = initialTheme === THEME_DARK ? '☀️' : '🌙';
            autoBtn.title = 'Toggle Dark / Light Theme';
            autoBtn.style.marginLeft = '8px';
            topActions.appendChild(autoBtn);
            autoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTheme();
            });
        }
    });
})();
