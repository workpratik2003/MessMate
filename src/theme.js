// ─── Colour palette ────────────────────────────────────────────────────────
export const C = {
  saffron:     '#E8701A',
  deepSaffron: '#C45A0A',
  turmeric:    '#F5A623',
  cream:       '#FDF6EC',
  warmWhite:   '#FFFAF4',
  charcoal:    '#1C1410',
  brown:       '#4A2C0A',
  lightBrown:  '#7A4F2A',
  green:       '#40916C',
  softGreen:   '#2D6A4F',
  lightGreen:  '#D8F3DC',
  red:         '#C1121F',
  lightRed:    '#FFE5E7',
  lightAmber:  '#FFF3CC',
  gray:        '#6B7280',
  lightGray:   '#F3F0EB',
  border:      '#E8D5B7',
  purple:      '#6D28D9',
  midPurple:   '#7C3AED',
  lightPurple: '#EDE9FE',
  indigo:      '#3730A3',
  lightIndigo: '#E0E7FF',
};

// ─── Shared helpers ────────────────────────────────────────────────────────
export const daysLeft = (d) =>
  d ? Math.max(0, Math.ceil((new Date(d) - new Date()) / 86_400_000)) : 0;

export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const validPhone = (p) => /^[6-9]\d{9}$/.test(p);

export const planLabel = (plan) =>
  ({ lunch: 'Lunch Only', dinner: 'Dinner Only', both: 'Lunch + Dinner' }[plan] || '—');
