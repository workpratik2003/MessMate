import { C } from '../theme';

export default function Landing({ onSelect }) {
  const roles = [
    { role: 'owner',  icon: '👑', label: 'Owner Portal',  desc: 'Manage admin slots & the whole platform',       bg: C.indigo,    shadow: 'rgba(55,48,163,0.3)' },
    { role: 'admin',  icon: '👨‍🍳', label: 'Admin / Mess',  desc: 'Manage members, verify OTP, set pricing',       bg: C.midPurple, shadow: 'rgba(109,40,217,0.3)' },
    { role: 'member', icon: '👤', label: 'Member',         desc: 'Book meals, mark attendance, report absences',  bg: C.saffron,   shadow: 'rgba(232,112,26,0.3)' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#FDF1E0,#FFF8EE 55%,#F0EAD6)', padding: 24 }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ width: 72, height: 72, background: C.saffron, borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 14px', boxShadow: '0 8px 28px rgba(232,112,26,0.35)' }}>
          🍱
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.charcoal, margin: 0 }}>MessMate</h1>
        <p style={{ color: C.lightBrown, marginTop: 6, fontSize: 15 }}>Smart mess management for India</p>
        <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#1C1410', borderRadius: 20, padding: '4px 14px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399',
            display: 'inline-block', boxShadow: '0 0 6px #34D399' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
            Flask · SQLite · bcrypt · Single-session enforcement
          </span>
        </div>
      </div>

      {/* Role cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 380 }}>
        {roles.map((r) => (
          <button key={r.role} onClick={() => onSelect(r.role)}
            style={{ background: '#fff', border: `2px solid ${C.border}`, borderRadius: 16,
              padding: '16px 20px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 16, textAlign: 'left', transition: 'all .2s' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = `2px solid ${r.bg}`;
              e.currentTarget.style.boxShadow = `0 4px 16px ${r.shadow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = `2px solid ${C.border}`;
              e.currentTarget.style.boxShadow = 'none';
            }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: r.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {r.icon}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: C.charcoal }}>{r.label}</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{r.desc}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: C.gray, fontSize: 18 }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
