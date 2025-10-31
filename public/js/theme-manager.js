/**
 * Theme Manager
 * Handles dark/light mode theme switching for PixelNest
 */

(function() {
  'use strict';

  // Theme Manager Class
  const ThemeManager = {
    // Storage key for theme preference
    STORAGE_KEY: 'pixelnest-theme',
    
    // Current theme (default: 'dark')
    currentTheme: 'dark',
    
    /**
     * Initialize theme manager
     * Loads saved theme preference or defaults to dark mode
     */
    init: function() {
      // Get saved theme from localStorage or default to dark
      const savedTheme = localStorage.getItem(this.STORAGE_KEY);
      
      if (savedTheme === 'light' || savedTheme === 'dark') {
        this.currentTheme = savedTheme;
      } else {
        // Check if system preference is available
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          this.currentTheme = 'light';
        } else {
          this.currentTheme = 'dark';
        }
      }
      
      // Apply theme immediately
      this.applyTheme(this.currentTheme);
      
      // Listen for system theme changes
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          if (!localStorage.getItem(this.STORAGE_KEY)) {
            // Only auto-switch if user hasn't manually set a preference
            this.setTheme(e.matches ? 'dark' : 'light', false);
          }
        });
      }
    },
    
    /**
     * Apply theme to HTML element
     * @param {string} theme - 'dark' or 'light'
     */
    applyTheme: function(theme) {
      const html = document.documentElement;
      
      if (theme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
      } else {
        html.classList.add('light');
        html.classList.remove('dark');
      }
      
      // Dispatch custom event for theme change
      const event = new CustomEvent('themechange', {
        detail: { theme: theme }
      });
      window.dispatchEvent(event);
    },
    
    /**
     * Set theme
     * @param {string} theme - 'dark' or 'light'
     * @param {boolean} save - Whether to save to localStorage (default: true)
     */
    setTheme: function(theme, save = true) {
      if (theme !== 'dark' && theme !== 'light') {
        console.warn('ThemeManager: Invalid theme, must be "dark" or "light"');
        return;
      }
      
      this.currentTheme = theme;
      this.applyTheme(theme);
      
      if (save) {
        localStorage.setItem(this.STORAGE_KEY, theme);
      }
    },
    
    /**
     * Toggle between dark and light themes
     */
    toggle: function() {
      const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(newTheme);
      return newTheme;
    },
    
    /**
     * Get current theme
     * @returns {string} - Current theme ('dark' or 'light')
     */
    getTheme: function() {
      return this.currentTheme;
    },
    
    /**
     * Check if dark mode is active
     * @returns {boolean}
     */
    isDark: function() {
      return this.currentTheme === 'dark';
    },
    
    /**
     * Check if light mode is active
     * @returns {boolean}
     */
    isLight: function() {
      return this.currentTheme === 'light';
    },
    
    /**
     * Reset to system preference
     */
    reset: function() {
      localStorage.removeItem(this.STORAGE_KEY);
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        this.setTheme('light', false);
      } else {
        this.setTheme('dark', false);
      }
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ThemeManager.init();
    });
  } else {
    // DOM is already ready
    ThemeManager.init();
  }
  
  // Expose ThemeManager to global scope
  window.ThemeManager = ThemeManager;
  
  // Legacy support - expose as themeManager (camelCase)
  window.themeManager = ThemeManager;
  
})();

