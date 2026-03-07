/**
 * pages/auth/AuthShell.jsx
 * Shared authentication page layout wrapper used by OwnerAuth, AdminAuth, MemberAuth.
 */
import { C } from '../../theme';

export default function AuthShell({ title, icon, accent, accentShadow, onBack, children }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, #FDF1E0, #FFF8EE 55%, #F0EAD6)`,
      padding: 24,
    }}>
      {/* Back button */}
      {onBack && (
        <button onClick={onBack}
          style={{
            position: 'absolute', top: 18, left: 18,
            background: C.lightGray, border: 'none', borderRadius: 10,
            padding: '8px 16px', cursor: 'pointer',
            fontWeight: 700, fontSize: 13, color: C.charcoal,
          }}>
          ← Back
        </button>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: accent || C.saffron,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, margin: '0 auto 12px',
          boxShadow: `0 8px 28px ${accentShadow || 'rgba(0,0,0,0.2)'}`,
        }}>
          {icon}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.charcoal, margin: 0 }}>
          {title}
        </h1>
      </div>

      {/* Form content */}
      <div style={{ width: '100%', maxWidth: 400 }}>
        {children}
      </div>
    </div>
  );
}

export function ModeSwitcher({ mode, setMode, accent }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 6, background: C.lightGray, borderRadius: 12,
      padding: 5, marginBottom: 20,
    }}>
      {[
        { id: 'login', label: 'Sign In' },
        { id: 'register', label: 'Register' },
      ].map((s) => (
        <button key={s.id} onClick={() => setMode(s.id)}
          style={{
            padding: '10px 0', borderRadius: 9, border: 'none',
            cursor: 'pointer', fontWeight: 700, fontSize: 13,
            transition: 'all .15s',
            background: mode === s.id ? '#fff' : 'transparent',
            color: mode === s.id ? (accent || C.saffron) : C.gray,
            boxShadow: mode === s.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
          }}>
          {s.label}
        </button>
      ))}
    </div>
  );
}
