// Theme Toggle Functionality
// This script handles dark/light theme switching across all pages

(function() {
    'use strict';

    // Theme configuration
    const THEME_KEY = 'crs-theme-preference';
    const LIGHT_THEME = 'light';
    const DARK_THEME = 'dark';

    // Initialize theme on page load
    function initTheme() {
        // Check for saved theme preference or default to light
        const savedTheme = localStorage.getItem(THEME_KEY) || LIGHT_THEME;
        applyTheme(savedTheme);
        
        // Create theme toggle button
        createThemeToggleButton();
        
        // Update button icon based on current theme
        updateToggleButtonIcon(savedTheme);
    }

    // Apply theme to document
    function applyTheme(theme) {
        if (theme === DARK_THEME) {
            document.documentElement.setAttribute('data-theme', DARK_THEME);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    // Toggle between light and dark themes
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || LIGHT_THEME;
        const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        
        // Apply new theme
        applyTheme(newTheme);
        
        // Save preference
        localStorage.setItem(THEME_KEY, newTheme);
        
        // Update toggle button icon
        updateToggleButtonIcon(newTheme);
        
        // Dispatch custom event for other scripts to listen to
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: newTheme } 
        }));
    }

    // Create the theme toggle button
    function createThemeToggleButton() {
        // Check if button already exists
        if (document.getElementById('themeToggleBtn')) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'themeToggleBtn';
        button.className = 'theme-toggle-btn';
        button.setAttribute('aria-label', 'Toggle dark/light theme');
        button.setAttribute('title', 'Toggle Theme');
        
        // Add click event
        button.addEventListener('click', toggleTheme);
        
        // Add to page
        document.body.appendChild(button);
    }

    // Update the toggle button icon based on current theme
    function updateToggleButtonIcon(theme) {
        const button = document.getElementById('themeToggleBtn');
        if (!button) return;

        if (theme === DARK_THEME) {
            button.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            button.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }

    // Expose toggle function globally for manual triggering if needed
    window.toggleTheme = toggleTheme;
    window.getTheme = () => localStorage.getItem(THEME_KEY) || LIGHT_THEME;
})();
