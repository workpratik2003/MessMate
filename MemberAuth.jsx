import { useState } from 'react';
import { C, validEmail } from '../../theme';
import { Btn, Field, Toast } from '../../components/ui';
import AuthShell, { ModeSwitcher } from './AuthShell';

const DEMO = [
  { label: 'arjun@example.com — Lunch+Dinner plan',  value: 'arjun@example.com' },
  { label: 'priya@example.com — Lunch plan',          value: 'priya@example.com' },
  { label: 'rohan@example.com — Dinner plan',         value: 'rohan@example.com' },
  { label: 'kavya@example.com — No plan yet',         value: 'kavya@example.com' },
];

export default function MemberAuth({ onLogin, addLog, onBack }) {
  const [mode,      setMode]      = useState('login');
  const [demoEmail, setDemoEmail] = useState(DEMO[0].value);
  const [f,         setF]         = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors,    setErrors]    = useState({});
  const [apiErr,    setApiErr]    = useState('');
  const [loading,   setLoading]   = useState(false);

  const upd = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: '' })); };

  const handleRegister = async () => {
    const e = {};
    if (f.username.trim().length < 3) e.username = 'Min. 3 characters.';
    if (!validEmail(f.email))         e.email    = 'Enter a valid email.';
    if (f.password.length < 6)        e.password = 'Min. 6 characters.';
    if (f.password !== f.confirm)     e.confirm  = 'Passwords do not match.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setApiErr(''); setLoading(true);
    addLog('POST', '/api/register/member');
    try {
      const { flask } = await import('../../mock/flask');
      const user = await flask.memberRegister(f);
      addLog('POST', '/api/register/member', 201);
      onLogin(user);
    } catch (err) { addLog('POST', '/api/register/member', 400); setApiErr(err.message); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    setApiErr(''); setLoading(true);
    addLog('POST', '/api/login');
    try {
      const { flask } = await import('../../mock/flask');
      const user = await flask.memberLogin({ email: demoEmail, password: 'password' });
      addLog('POST', '/api/login', 200);
      onLogin(user);
    } catch (err) { addLog('POST', '/api/login', 401); setApiErr(err.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Member Portal" icon="👤" accent={C.saffron} accentShadow="rgba(232,112,26,0.35)" onBack={onBack}>
      <ModeSwitcher mode={mode} setMode={setMode} accent={C.saffron} />
      {apiErr && <Toast type="error" onClose={() => setApiErr('')}>{apiErr}</Toast>}

      {mode === 'register' ? (
        <>
          <Toast type="info">After registering you'll choose a meal plan to get started.</Toast>
          <Field label="Username"         value={f.username} onChange={(v) => upd('username', v)} placeholder="your_username" required error={errors.username} hint="Min. 3 characters, unique" />
          <Field label="Email"            value={f.email}    onChange={(v) => upd('email', v)}    type="email"    placeholder="you@example.com"   required error={errors.email} />
          <Field label="Password"         value={f.password} onChange={(v) => upd('password', v)} type="password" placeholder="Min. 6 characters" required error={errors.password} />
          <Field label="Confirm Password" value={f.confirm}  onChange={(v) => upd('confirm', v)}  type="password" placeholder="Re-enter password"  required error={errors.confirm} />
          <Btn onClick={handleRegister} loading={loading} full>Create Account →</Btn>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.lightBrown, marginBottom: 6 }}>Demo Account</div>
            <select value={demoEmail} onChange={(e) => setDemoEmail(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10,
                border: `1.5px solid ${C.border}`, fontSize: 14, background: C.warmWhite,
                outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}>
              {DEMO.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <Btn onClick={handleLogin} loading={loading} full>Sign In →</Btn>
          <p style={{ fontSize: 12, color: C.gray, textAlign: 'center', marginTop: 10 }}>
            All demo passwords: <code>password</code>
          </p>
        </>
      )}
    </AuthShell>
  );
}
