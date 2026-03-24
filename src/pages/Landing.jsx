import { C } from '../../theme';

/* ── Indian Veg Thali Logo (side-tilted upward view, circle) ─────── */
function MessMateLogo() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgG" cx="42%" cy="38%">
          <stop offset="0%" stopColor="#F5A623"/>
          <stop offset="100%" stopColor="#B84F08"/>
        </radialGradient>
        {/* Steel thali gradient */}
        <linearGradient id="thaliG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8E8E8"/>
          <stop offset="40%" stopColor="#C8C8C8"/>
          <stop offset="100%" stopColor="#A8A8A8"/>
        </linearGradient>
        <linearGradient id="thaliRimG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D0D0D0"/>
          <stop offset="100%" stopColor="#909090"/>
        </linearGradient>
        {/* Rice */}
        <radialGradient id="riceG" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#FFFBE8"/>
          <stop offset="100%" stopColor="#EDE0B0"/>
        </radialGradient>
        {/* Dal */}
        <radialGradient id="dalG" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#F5C842"/>
          <stop offset="100%" stopColor="#D4960A"/>
        </radialGradient>
        {/* Sabzi green */}
        <radialGradient id="sabziG" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#6DBF67"/>
          <stop offset="100%" stopColor="#2E7D32"/>
        </radialGradient>
        {/* Curry red */}
        <radialGradient id="curryG" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#EF6C00"/>
          <stop offset="100%" stopColor="#B71C1C"/>
        </radialGradient>
        {/* Raita white */}
        <radialGradient id="raitaG" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#FFFFFF"/>
          <stop offset="100%" stopColor="#E0E0E0"/>
        </radialGradient>
      </defs>

      {/* ── Circular background ── */}
      <circle cx="48" cy="48" r="46" fill="url(#bgG)"/>
      <circle cx="48" cy="48" r="46" fill="none" stroke="rgba(255,230,160,0.3)" strokeWidth="1.5"/>

      {/* ── Thali plate — ellipse for tilted side view ── */}
      {/* Shadow beneath plate */}
      <ellipse cx="48" cy="70" rx="30" ry="6" fill="rgba(0,0,0,0.18)"/>
      {/* Plate body (tilted = taller ellipse, slightly off-center upward) */}
      <ellipse cx="48" cy="52" rx="29" ry="20" fill="url(#thaliG)"/>
      {/* Plate rim highlight */}
      <ellipse cx="48" cy="52" rx="29" ry="20" fill="none" stroke="url(#thaliRimG)" strokeWidth="3"/>
      {/* Inner plate surface */}
      <ellipse cx="48" cy="53" rx="24" ry="16" fill="#F2F2F2"/>
      {/* Rim shine */}
      <ellipse cx="43" cy="36" rx="8" ry="2" fill="rgba(255,255,255,0.55)" transform="rotate(-10,43,36)"/>

      {/* ── Small katoris (bowls) arranged on plate ── */}
      {/* Rice katori - top center */}
      <ellipse cx="48" cy="43" rx="6" ry="4" fill="#DCDCDC"/>
      <ellipse cx="48" cy="42" rx="5.5" ry="3.2" fill="url(#riceG)"/>
      <ellipse cx="48" cy="41.2" rx="3.5" ry="1.8" fill="#FFFEF0" opacity="0.8"/>

      {/* Dal katori - left */}
      <ellipse cx="36" cy="51" rx="5.5" ry="3.8" fill="#DCDCDC"/>
      <ellipse cx="36" cy="50" rx="5" ry="3" fill="url(#dalG)"/>
      <ellipse cx="36" cy="49.3" rx="3" ry="1.5" fill="#FFE082" opacity="0.7"/>

      {/* Sabzi katori - right */}
      <ellipse cx="60" cy="51" rx="5.5" ry="3.8" fill="#DCDCDC"/>
      <ellipse cx="60" cy="50" rx="5" ry="3" fill="url(#sabziG)"/>
      <ellipse cx="60" cy="49.3" rx="3" ry="1.5" fill="#A5D6A7" opacity="0.7"/>

      {/* Curry katori - bottom-left */}
      <ellipse cx="39" cy="60" rx="5" ry="3.5" fill="#DCDCDC"/>
      <ellipse cx="39" cy="59" rx="4.5" ry="2.8" fill="url(#curryG)"/>
      <ellipse cx="39" cy="58.3" rx="2.8" ry="1.3" fill="#FFAB40" opacity="0.7"/>

      {/* Raita katori - bottom-right */}
      <ellipse cx="57" cy="60" rx="5" ry="3.5" fill="#DCDCDC"/>
      <ellipse cx="57" cy="59" rx="4.5" ry="2.8" fill="url(#raitaG)"/>
      <ellipse cx="57" cy="58.3" rx="2.8" ry="1.3" fill="rgba(255,255,255,0.9)" opacity="0.7"/>

      {/* ── Roti (chapati) - bottom center, flat circle ── */}
      <ellipse cx="48" cy="63" rx="5.5" ry="3.5" fill="#D4A855"/>
      <ellipse cx="48" cy="62.5" rx="4.5" ry="2.8" fill="#E8C07A"/>
      {/* Roti char marks */}
      <ellipse cx="46.5" cy="62" rx="1.2" ry="0.7" fill="#B8860B" opacity="0.5" transform="rotate(-20,46.5,62)"/>
      <ellipse cx="50" cy="63" rx="1" ry="0.6" fill="#B8860B" opacity="0.5" transform="rotate(15,50,63)"/>

      {/* ── Garnish: green coriander leaves on plate ── */}
      <circle cx="48" cy="55" r="1.2" fill="#388E3C" opacity="0.85"/>
      <circle cx="45" cy="56" r="0.9" fill="#43A047" opacity="0.75"/>
      <circle cx="51" cy="55.5" r="0.9" fill="#43A047" opacity="0.75"/>

      {/* ── Steam from rice ── */}
      <path d="M46 37 Q45.2 33.5 46 30" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      <path d="M48.5 36 Q49.2 32 48.5 28.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M51 37 Q51.8 33.5 51 30" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

const cardStyle = (r) => ({
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `2px solid rgba(232,208,180,0.6)`,
  borderRadius: 22,
  padding: '24px 28px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 22,
  textAlign: 'left',
  transition: 'all .25s cubic-bezier(.4,0,.2,1)',
  boxShadow: '0 4px 20px rgba(180,100,20,0.07)',
});

export default function Landing({ onSelect }) {
  const roles = [
    {
      role: 'owner',
      icon: '👑',
      label: 'Owner Portal',
      desc: 'Manage admin slots & the whole platform',
      bg: C.indigo,
      shadow: 'rgba(55,48,163,0.28)',
      hoverBorder: C.indigo,
    },
    {
      role: 'admin',
      icon: '👨‍🍳',
      label: 'Admin / Mess',
      desc: 'Manage members, verify OTP, set pricing',
      bg: C.midPurple,
      shadow: 'rgba(109,40,217,0.28)',
      hoverBorder: C.midPurple,
    },
    {
      role: 'member',
      icon: '👤',
      label: 'Member',
      desc: 'Book meals, mark attendance, report absences',
      bg: C.saffron,
      shadow: 'rgba(232,112,26,0.28)',
      hoverBorder: C.saffron,
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(160deg, #FFF4E0 0%, #FFF8EE 30%, #FDE8CB 60%, #F5D9A8 100%)',
    }}>

      {/* Decorative background blobs */}
      <div style={{
        position: 'absolute', top: '-120px', left: '-120px',
        width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,166,35,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', right: '-100px',
        width: 380, height: 380, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,90,10,0.14) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '5%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(109,40,217,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '10%', right: '8%',
        width: 160, height: 160, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(55,48,163,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card container */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(232,208,180,0.7)',
        borderRadius: 32,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 460,
        boxShadow: '0 24px 80px rgba(180,100,20,0.13), 0 4px 16px rgba(180,100,20,0.07)',
      }}>

        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {/* SVG Logo */}
          <div style={{
            display: 'inline-block',
            filter: 'drop-shadow(0 10px 32px rgba(232,112,26,0.38))',
            marginBottom: 18,
            animation: 'float 3.5s ease-in-out infinite',
          }}>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
              }
              @keyframes shimmer {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
              }
            `}</style>
            <MessMateLogo />
          </div>

          {/* MessMate Title — doubled from 28px to 56px */}
          <h1 style={{
            fontSize: 56,
            fontWeight: 900,
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            background: 'linear-gradient(135deg, #C45A0A 0%, #E8701A 40%, #F5A623 70%, #C45A0A 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 4s linear infinite',
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
          }}>
            MessMate
          </h1>

          <p style={{
            color: C.lightBrown,
            marginTop: 8,
            fontSize: 16,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            letterSpacing: '0.3px',
          }}>
            Smart mess management for India
          </p>
        </div>

        {/* Role Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {roles.map((r) => (
            <button
              key={r.role}
              onClick={() => onSelect(r.role)}
              style={cardStyle(r)}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = `2px solid ${r.hoverBorder}`;
                e.currentTarget.style.boxShadow = `0 8px 32px ${r.shadow}`;
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.96)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '2px solid rgba(232,208,180,0.6)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(180,100,20,0.07)';
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.82)';
              }}
            >
              {/* Icon bubble */}
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                background: r.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                flexShrink: 0,
                boxShadow: `0 6px 18px ${r.shadow}`,
              }}>
                {r.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 800,
                  fontSize: 20,
                  color: C.charcoal,
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '-0.3px',
                }}>
                  {r.label}
                </div>
                <div style={{
                  fontSize: 14,
                  color: C.gray,
                  marginTop: 4,
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1.4,
                }}>
                  {r.desc}
                </div>
              </div>

              {/* Arrow */}
              <span style={{ color: C.lightBrown, fontSize: 22, flexShrink: 0 }}>→</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
