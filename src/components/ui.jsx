/**
 * components/ui.jsx
 * All shared, reusable UI primitives for MessMate.
 */
import { C } from '../theme';

export const Badge = ({ color, bg, children, style = {} }) => (
  <span style={{ background: bg || C.lightAmber, color: color || C.brown, borderRadius: 20,
    padding: '2px 10px', fontSize: 12, fontWeight: 700, ...style }}>
    {children}
  </span>
);

export const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick}
    onMouseEnter={onClick ? (e) => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)') : undefined}
    onMouseLeave={onClick ? (e) => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)') : undefined}
    style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: '18px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'box-shadow .2s',
      cursor: onClick ? 'pointer' : undefined, ...style }}>
    {children}
  </div>
);

const VARIANTS = {
  primary: { background: C.saffron,   color: '#fff', boxShadow: '0 3px 10px rgba(232,112,26,0.3)' },
  outline: { background: 'transparent', color: C.saffron, border: `2px solid ${C.saffron}` },
  green:   { background: C.green,     color: '#fff' },
  red:     { background: C.red,       color: '#fff' },
  ghost:   { background: C.lightGray, color: C.charcoal },
  purple:  { background: C.midPurple, color: '#fff', boxShadow: '0 3px 10px rgba(109,40,217,0.3)' },
  indigo:  { background: C.indigo,    color: '#fff', boxShadow: '0 3px 10px rgba(55,48,163,0.3)' },
  danger:  { background: 'transparent', color: C.red, border: `2px solid ${C.red}` },
};

export const Btn = ({ children, onClick, variant = 'primary', style = {}, disabled, small, loading, full }) => {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ border: 'none', borderRadius: 10, fontWeight: 700,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontSize: small ? 13 : 15, padding: small ? '7px 14px' : '12px 24px',
        transition: 'all .18s', width: full ? '100%' : undefined,
        ...v, opacity: disabled || loading ? 0.5 : 1, ...style }}>
      {loading ? '⏳ Please wait…' : children}
    </button>
  );
};

export const Field = ({ label, value, onChange, type = 'text', placeholder, error, required, hint, rows }) => {
  const bc = error ? C.red : C.border;
  const fc = error ? C.red : C.saffron;
  const base = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: `1.5px solid ${bc}`, fontSize: 14, background: C.warmWhite,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color .15s',
  };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <div style={{ fontSize: 13, fontWeight: 600, color: C.lightBrown, marginBottom: 6 }}>
          {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
        </div>
      )}
      {rows
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
            style={{ ...base, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={(e) => (e.target.style.borderColor = fc)} onBlur={(e) => (e.target.style.borderColor = bc)} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            style={base} onFocus={(e) => (e.target.style.borderColor = fc)} onBlur={(e) => (e.target.style.borderColor = bc)} />
      }
      {hint && !error && <div style={{ fontSize: 11, color: C.gray, marginTop: 3 }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: C.red, marginTop: 4, fontWeight: 500 }}>⚠ {error}</div>}
    </div>
  );
};

const TOAST_STYLES = {
  success: { bg: C.lightGreen,  color: C.softGreen, icon: '✅' },
  error:   { bg: C.lightRed,    color: C.red,        icon: '❌' },
  warn:    { bg: C.lightAmber,  color: '#7A5C00',    icon: '⚠️' },
  info:    { bg: '#EAF2FF',     color: '#1A3C6E',    icon: 'ℹ️' },
  kicked:  { bg: C.charcoal,    color: '#fff',       icon: '🔐' },
};

export const Toast = ({ type, children, onClose }) => {
  const m = TOAST_STYLES[type] || { bg: C.lightGray, color: C.charcoal, icon: '📢' };
  return (
    <div style={{ background: m.bg, color: m.color, borderRadius: 12, padding: '11px 14px',
      marginBottom: 12, fontSize: 13, fontWeight: 500, display: 'flex',
      justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span>{m.icon} {children}</span>
      {onClose && (
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.color,
            fontWeight: 800, fontSize: 16, lineHeight: 1, marginLeft: 10, padding: 0, flexShrink: 0 }}>
          ×
        </button>
      )}
    </div>
  );
};

export const Divider = ({ icon, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 14px',
    color: C.gray, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
    <div style={{ flex: 1, height: 1, background: C.border }} />
    {icon} {label}
    <div style={{ flex: 1, height: 1, background: C.border }} />
  </div>
);

export const StepBar = ({ steps, current, accent = C.saffron }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
    {steps.map((s, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 800, fontSize: 12, transition: 'all .3s',
            background: i < current ? C.green : i === current ? accent : C.lightGray,
            color: i <= current ? '#fff' : C.gray,
            boxShadow: i === current ? `0 0 0 4px ${accent}33` : 'none' }}>
            {i < current ? '✓' : i + 1}
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
            color: i === current ? accent : i < current ? C.green : C.gray }}>{s}</span>
        </div>
        {i < steps.length - 1 && (
          <div style={{ width: 34, height: 2, margin: '0 6px', marginBottom: 16,
            background: i < current ? C.green : C.lightGray, transition: 'background .3s' }} />
        )}
      </div>
    ))}
  </div>
);

export const ApiLog = ({ logs }) => !logs.length ? null : (
  <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, pointerEvents: 'none' }}>
    {logs.map((l, i) => (
      <div key={l.id} style={{ background: '#111', color: '#fff', padding: '7px 16px', fontSize: 11,
        fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 10,
        opacity: Math.max(0, 1 - i * 0.35), borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ background: l.method === 'GET' ? '#2563EB' : l.method === 'DELETE' ? C.red : '#E8701A',
          color: '#fff', borderRadius: 4, padding: '1px 6px', fontWeight: 700, fontSize: 10 }}>{l.method}</span>
        <span style={{ color: '#FBBF24' }}>{l.route}</span>
        <span style={{ color: '#6B7280' }}>← Flask / SQLite</span>
        {l.status && <span style={{ marginLeft: 'auto', fontWeight: 700,
          color: l.status < 300 ? '#34D399' : '#F87171' }}>{l.status}</span>}
      </div>
    ))}
  </div>
);

export const BottomNav = ({ tabs, active, onSelect, bg = C.charcoal, activeColor = C.turmeric }) => (
  <nav style={{ background: bg, borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'grid', gridTemplateColumns: `repeat(${tabs.length},1fr)`,
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
    {tabs.map((t) => (
      <button key={t.id} onClick={() => onSelect(t.id)}
        style={{ padding: '11px 0', border: 'none', background: 'none', cursor: 'pointer',
          color: active === t.id ? activeColor : 'rgba(255,255,255,0.45)',
          fontWeight: 600, fontSize: 10,
          borderTop: active === t.id ? `2.5px solid ${activeColor}` : '2.5px solid transparent',
          transition: 'color .15s' }}>
        <div style={{ fontSize: 18 }}>{t.icon}</div>
        {t.label}
      </button>
    ))}
  </nav>
);

export const AppHeader = ({ icon, title, subtitle, bg = C.charcoal, right }) => (
  <header style={{ background: bg, padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{subtitle}</div>}
      </div>
    </div>
    {right}
  </header>
);
