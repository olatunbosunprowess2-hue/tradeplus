import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // ── Brand blues ──────────────────────────────────────────────────
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        // ── Ink (text) ────────────────────────────────────────────────────
        ink: {
          DEFAULT: '#0F172A',
          secondary: '#334155',
          muted: '#64748B',
          faint: '#94A3B8',
        },
        // ── Surfaces ─────────────────────────────────────────────────────
        surface: {
          DEFAULT: '#FFFFFF',
          raised: '#F8FAFC',
          inset: '#F1F5F9',
        },
        // ── Borders ──────────────────────────────────────────────────────
        border: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
          focus: '#2563EB',
        },
        // ── Semantic ─────────────────────────────────────────────────────
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
          vivid: '#22C55E',
          dark: '#15803D',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
          vivid: '#F59E0B',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          vivid: '#EF4444',
        },
        // ── Keep legacy primary alias ─────────────────────────────────────
        primary: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
          pale: '#DBEAFE',
          dark: '#1D4ED8',
          darker: '#1E3A8A',
        },
      },
      borderRadius: {
        xs:   '3px',
        sm:   '6px',
        DEFAULT: '8px',
        md:   '10px',
        lg:   '12px',
        xl:   '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        xs:        '0 1px 2px rgba(15,23,42,0.05)',
        sm:        '0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
        md:        '0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
        lg:        '0 8px 24px rgba(15,23,42,0.10), 0 4px 8px rgba(15,23,42,0.06)',
        xl:        '0 16px 48px rgba(15,23,42,0.12), 0 8px 16px rgba(15,23,42,0.06)',
        '2xl':     '0 24px 64px rgba(15,23,42,0.14)',
        brand:     '0 4px 14px rgba(37,99,235,0.30)',
        'brand-sm':'0 2px 8px rgba(37,99,235,0.20)',
        success:   '0 4px 14px rgba(22,163,74,0.28)',
        inset:     'inset 0 1px 2px rgba(15,23,42,0.06)',
        none:      'none',
      },
      transitionTimingFunction: {
        'bounce-sm':   'cubic-bezier(0.34, 1.36, 0.64, 1)',
        'out-quart':   'cubic-bezier(0.25, 1, 0.5, 1)',
        'in-out-quart':'cubic-bezier(0.76, 0, 0.24, 1)',
      },
      animation: {
        'fade-in':   'bwFadeIn 180ms ease-out both',
        'slide-up':  'bwSlideUp 240ms cubic-bezier(0.25, 1, 0.5, 1) both',
        'scale-in':  'bwScaleIn 200ms cubic-bezier(0.34, 1.36, 0.64, 1) both',
        'shimmer':   'bwShimmer 1.8s infinite linear',
      },
      keyframes: {
        bwFadeIn:  { from: { opacity: '0' },                                      to: { opacity: '1' } },
        bwSlideUp: { from: { opacity: '0', transform: 'translateY(10px)' },       to: { opacity: '1', transform: 'translateY(0)' } },
        bwScaleIn: { from: { opacity: '0', transform: 'scale(0.96)' },            to: { opacity: '1', transform: 'scale(1)' } },
        bwShimmer: { from: { backgroundPosition: '200% 0' },                      to: { backgroundPosition: '-200% 0' } },
      },
    },
  },
  plugins: [],
};

export default config;
