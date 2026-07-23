// Central design tokens for Techzu Social Media.
// Keeping colors/spacing/radii here means every screen stays visually
// consistent and the whole app's look can be re-themed from one place.

export const colors = {
  // Brand gradient (matches the app icon / logo mark)
  primary: '#6366F1', // indigo-500
  primaryDark: '#4F46E5', // indigo-600
  accent: '#A855F7', // violet-500
  gradient: ['#6366F1', '#A855F7'],

  // Surfaces
  background: '#F5F5FC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F1FA',
  border: '#E7E7F3',

  // Text
  textPrimary: '#161329',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Feedback
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  success: '#10B981',
  like: '#F43F5E',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#312E81',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  floating: {
    shadowColor: '#4F46E5',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
};

export default { colors, spacing, radii, shadow };
