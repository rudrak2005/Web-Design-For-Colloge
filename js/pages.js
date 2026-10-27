/* ============================================================================
   BITCAMPUS PAGES CONTROLLER (js/pages.js)
   Universal loader, mobile sidebar drawer, theme toggle, and session sync across pages
============================================================================ */

const pageLoader = document.getElementById("pageLoader");

function showPageLoader(message) {
    if (!pageLoader) return;
    const loaderText = pageLoader.querySelector("[data-loader-text], .loader-text");
    if (loaderText) {
        loaderText.textContent = message || "Loading page...";
    }
    pageLoader.classList.remove("hidden");
}

function hidePageLoader() {
    if (!pageLoader) return;
    pageLoader.classList.add("hidden");
    pageLoader.style.display = "none";
}

// Auto-hide page loader
setTimeout(hidePageLoader, 400);

// ============================================================================
// UNIVERSAL MOBILE SIDEBAR TOGGLE & BACKDROP FOR ALL PAGES
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar") || document.getElementById("sidebar");
    
    // Ensure mobile toggle button exists in header if missing
    let menuBtn = document.getElementById("pageMenuBtn") || 
                  document.getElementById("menuBtn") || 
                  document.querySelector(".mobile-menu-toggle") || 
                  document.querySelector(".menu-btn");

    const pageHeader = document.querySelector(".page-header") || document.querySelector(".top-bar");
    if (!menuBtn && pageHeader && sidebar) {
        menuBtn = document.createElement("button");
        menuBtn.id = "pageMenuBtn";
        menuBtn.className = "mobile-menu-toggle";
        menuBtn.setAttribute("aria-label", "Toggle Menu");
        menuBtn.innerHTML = "☰";
        menuBtn.style.cssText = "display: none; align-items: center; justify-content: center; width: 42px; height: 42px; font-size: 20px; cursor: pointer; background: var(--paper-dark, #cebd93); border: 2px solid var(--border, #28231f); box-shadow: 2px 2px 0 var(--border, #28231f); margin-right: 12px; color: var(--ink, #28231f);";
        pageHeader.prepend(menuBtn);
    }

    // Create backdrop
    let backdrop = document.getElementById("pagesSidebarBackdrop");
    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = "pagesSidebarBackdrop";
        backdrop.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.65); z-index: 998; display: none; backdrop-filter: blur(2px);";
        document.body.appendChild(backdrop);
    }

    if (menuBtn && sidebar) {
        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = sidebar.classList.contains("open");
            if (isOpen) {
                sidebar.classList.remove("open");
                backdrop.style.display = "none";
                document.body.style.overflow = "";
            } else {
                sidebar.classList.add("open");
                backdrop.style.display = "block";
                document.body.style.overflow = "hidden";
            }
        });

        backdrop.addEventListener("click", () => {
            sidebar.classList.remove("open");
            backdrop.style.display = "none";
            document.body.style.overflow = "";
        });

        const navLinks = sidebar.querySelectorAll("a, button");
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                if (window.innerWidth <= 900) {
                    sidebar.classList.remove("open");
                    backdrop.style.display = "none";
                    document.body.style.overflow = "";
                }
            });
        });
    }

    // Ensure theme toggle button exists in page header
    const currentTheme = localStorage.getItem('bitcampus_theme') || 'light';
    const headerActions = document.querySelector(".page-actions, .header-actions, .top-actions, .page-header");
    if (headerActions && !document.getElementById("themeBtn")) {
        const themeBtn = document.createElement("button");
        themeBtn.id = "themeBtn";
        themeBtn.className = "top-icon theme-toggle-btn";
        themeBtn.title = "Toggle Dark / Light Theme";
        themeBtn.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
        themeBtn.style.cssText = "padding: 6px 12px; font-size: 16px; background: var(--paper-light); border: 2px solid var(--border); box-shadow: 2px 2px 0 var(--border); cursor: pointer; margin-left: auto; align-self: center;";
        headerActions.appendChild(themeBtn);
        
        themeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (window.BitCampusTheme) {
                window.BitCampusTheme.toggleTheme();
            } else {
                const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('bitcampus_theme', next);
                themeBtn.innerHTML = next === 'dark' ? '☀️' : '🌙';
            }
        });
    }

    // Sync authenticated student name across pages
    try {
        const raw = localStorage.getItem("bitCampusSession") || sessionStorage.getItem("bitCampusSession");
        if (raw) {
            const s = JSON.parse(raw);
            const user = s.user || s;
            const nameElems = document.querySelectorAll("[data-student-name], .student-name");
            nameElems.forEach(el => {
                el.textContent = user.full_name || user.name || "Student";
            });
        }
    } catch (e) {}
});
