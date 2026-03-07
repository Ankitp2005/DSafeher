/**
 * SafeHer Design System — Centralized Theme
 * Pink / White / Navy light theme inspired by "I'M SAFE" mockup
 */

export const Colors = {
    // Backgrounds
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F5F0F8',
    bgCard: '#FFFFFF',
    bgCardHover: '#F8F4FB',
    bgInput: '#F8F4FB',

    // Borders
    borderCard: '#E8E0F0',
    borderInput: '#DDD5E5',
    borderFocus: 'rgba(214,36,110,0.45)',

    // Accent — Deep Pink / Magenta
    accentPrimary: '#D6246E',
    accentSecondary: '#3B2D8B',
    accentGradient: ['#D6246E', '#E84393'] as const,

    // Semantic
    safe: '#22C55E',
    safeBg: 'rgba(34,197,94,0.1)',
    warning: '#F59E0B',
    warningBg: 'rgba(245,158,11,0.1)',
    danger: '#EF4444',
    dangerBg: 'rgba(239,68,68,0.1)',
    info: '#3B82F6',
    infoBg: 'rgba(59,130,246,0.1)',

    // Text
    textPrimary: '#1A1A2E',
    textSecondary: '#666680',
    textMuted: '#9999AA',
    textOnAccent: '#FFFFFF',

    // Tab Bar
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#E8E0F0',
    tabActive: '#D6246E',
    tabInactive: '#9999AA',

    // SOS (kept red — safety critical)
    sosPrimary: '#FF2D55',
    sosGlow: 'rgba(255,45,85,0.4)',
    sosPulse: 'rgba(255,45,85,0.15)',
};

export const Typography = {
    hero: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
    h1: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.3 },
    h2: { fontSize: 20, fontWeight: '700' as const },
    h3: { fontSize: 17, fontWeight: '600' as const },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    bodyBold: { fontSize: 15, fontWeight: '600' as const },
    caption: { fontSize: 13, fontWeight: '500' as const },
    small: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.5 },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const Radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    pill: 100,
};

export const Shadows = {
    card: {
        shadowColor: '#1A1A2E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    glow: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    }),
    soft: {
        shadowColor: '#1A1A2E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
};

export const GlassCard = {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: Radius.xl,
    ...Shadows.card,
};
