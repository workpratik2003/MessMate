import { useState } from 'react';
import { C } from '../../theme';
import { Btn, Field, Toast } from '../../components/ui';
import AuthShell from './AuthShell';

const DEMO_ACCOUNTS = [
  { label: 'admin@mess.com — Sharma\'s Mess (demo)', value: 'admin@mess.com' },
];

export default function AdminAuth({ onLogin, addLog, onBack }) {
  const [email,   setEmail]   = useState(DEMO_ACCOUNTS[0].value);
  const [pass,    setPass]    = useState('password');
  const [err,     setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    addLog('POST', '/api/admin/login');
    try {
      const { flask } = await import('../../mock/flask');
      const user = await flask.adminLogin({ email, password: pass });
      addLog('POST', '/api/admin/login', 200);
      onLogin(user);
    } catch (e) { addLog('POST', '/api/admin/login', 401); setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Admin Login" icon="👨‍🍳" accent={C.midPurple} accentShadow="rgba(109,40,217,0.35)" onBack={onBack}>
      {err && <Toast type="error" onClose={() => setErr('')}>{err}</Toast>}
      <Toast type="info">Admin credentials are created by the Owner when a slot is assigned.</Toast>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.lightBrown, marginBottom: 6 }}>Account</div>
        <select value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '11px 14px', borderRadius: 10,
            border: `1.5px solid ${C.border}`, fontSize: 14, background: C.warmWhite,
            outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}>
          {DEMO_ACCOUNTS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>

      <Field label="Password" value={pass} onChange={setPass} type="password" placeholder="••••••••" />
      <Btn onClick={handle} loading={loading} full variant="purple">Sign In as Admin →</Btn>

      <p style={{ fontSize: 12, color: C.gray, textAlign: 'center', marginTop: 10 }}>
        Demo password: <code>password</code>
      </p>
    </AuthShell>
  );
}
