/**
 * BarterWave Design System
 * 
 * Centralized design tokens for consistent styling across the application.
 * Based on 8-point grid system and professional design principles.
 */

export const colors = {
    // Primary Brand Colors (from BarterWave brand)
    primary: {
        main: '#4AA6E3',      // BarterWave Blue - main brand color
        light: '#8DCAF3',     // Light Blue - highlights, hover states
        pale: '#E1F5FE',      // Pale Blue - backgrounds, cards
        dark: '#2563EB',      // Deep Blue - text on light backgrounds
    },

    // Supporting Colors
    success: '#10B981',     // Green
    warning: '#F59E0B',     // Amber
    error: '#EF4444',       // Red

    // Neutral Grays
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    },

    // Text
    text: {
        primary: '#111827',    // Gray 900
        secondary: '#4B5563',  // Gray 600
        tertiary: '#9CA3AF',   // Gray 400
        inverse: '#FFFFFF',
    },

    // Backgrounds
    background: {
        primary: '#FFFFFF',
        secondary: '#F9FAFB',  // Gray 50
        tertiary: '#E1F5FE',   // Pale Blue
    },
} as const;

export const typography = {
    // Font Families
    fontFamily: {
        primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },

    // Type Scale (8-point grid aligned)
    fontSize: {
        hero: '2.5rem',      // 40px - Page titles
        h1: '2rem',          // 32px - Section headers
        h2: '1.5rem',        // 24px - Card headings
        subtitle: '1.25rem', // 20px - Subtitles
        body: '1rem',        // 16px - Main content
        small: '0.875rem',   // 14px - Secondary text
        tiny: '0.75rem',     // 12px - Labels, badges
    },

    // Font Weights
    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },

    // Line Heights
    lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
    },
} as const;

export const spacing = {
    // 8-point grid system
    xs: '0.5rem',    // 8px
    sm: '1rem',      // 16px
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '2.5rem',    // 40px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '5rem',   // 80px
    '5xl': '6rem',   // 96px
} as const;

export const borderRadius = {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',  // Fully rounded
} as const;

export const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const;

export const transitions = {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
} as const;

// Export as default for easy import
export default {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    transitions,
};
