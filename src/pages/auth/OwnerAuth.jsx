import { useState } from 'react';
import { C, validEmail, validPhone } from '../../theme';
import { Btn, Field, Toast } from '../../components/ui';
import AuthShell, { ModeSwitcher } from './AuthShell';

export default function OwnerAuth({ onLogin, addLog, onBack }) {
  const [mode,    setMode]    = useState('login');
  const [f,       setF]       = useState({ username: '', email: '', phone: '', password: '', confirm: '' });
  const [errors,  setErrors]  = useState({});
  const [apiErr,  setApiErr]  = useState('');
  const [loading, setLoading] = useState(false);

  const upd = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: '' })); };

  const handleRegister = async () => {
    const e = {};
    if (f.username.trim().length < 3) e.username = 'Min. 3 characters.';
    if (!validEmail(f.email))         e.email    = 'Enter a valid email.';
    if (!validPhone(f.phone))         e.phone    = '10-digit Indian number.';
    if (f.password.length < 6)        e.password = 'Min. 6 characters.';
    if (f.password !== f.confirm)     e.confirm  = 'Passwords do not match.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setApiErr(''); setLoading(true);
    addLog('POST', '/api/owner/register');
    try {
      const { flask } = await import('../../mock/flask');
      const user = await flask.ownerRegister(f);
      addLog('POST', '/api/owner/register', 201);
      onLogin(user);
    } catch (err) { addLog('POST', '/api/owner/register', 400); setApiErr(err.message); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    setApiErr(''); setLoading(true);
    addLog('POST', '/api/owner/login');
    try {
      const { flask } = await import('../../mock/flask');
      const user = await flask.ownerLogin({ email: f.email, password: f.password });
      addLog('POST', '/api/owner/login', 200);
      onLogin(user);
    } catch (err) { addLog('POST', '/api/owner/login', 401); setApiErr(err.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Owner Portal" icon="👑" accent={C.indigo} accentShadow="rgba(55,48,163,0.35)" onBack={onBack}>
      <ModeSwitcher mode={mode} setMode={setMode} accent={C.indigo} />
      {apiErr && <Toast type="error" onClose={() => setApiErr('')}>{apiErr}</Toast>}

      {mode === 'register' ? (
        <>
          <Toast type="info">One-time registration — only one owner account can exist.</Toast>
          <Field label="Username"         value={f.username} onChange={(v) => upd('username', v)} placeholder="your_username" required error={errors.username} hint="Min. 3 characters, unique" />
          <Field label="Email"            value={f.email}    onChange={(v) => upd('email', v)}    type="email"    placeholder="you@example.com"    required error={errors.email} />
          <Field label="Phone Number"     value={f.phone}    onChange={(v) => upd('phone', v.replace(/\D/g, '').slice(0, 10))} type="tel" placeholder="10-digit mobile" required error={errors.phone} hint="Indian mobile starting with 6–9" />
          <Field label="Password"         value={f.password} onChange={(v) => upd('password', v)} type="password" placeholder="Min. 6 characters"  required error={errors.password} />
          <Field label="Confirm Password" value={f.confirm}  onChange={(v) => upd('confirm', v)}  type="password" placeholder="Re-enter password"   required error={errors.confirm} />
          <Btn onClick={handleRegister} loading={loading} full variant="indigo">Register as Owner →</Btn>
        </>
      ) : (
        <>
          <Field label="Email"    value={f.email}    onChange={(v) => upd('email', v)}    type="email"    placeholder="owner@example.com" />
          <Field label="Password" value={f.password} onChange={(v) => upd('password', v)} type="password" placeholder="••••••••" />
          <Btn onClick={handleLogin} loading={loading} full variant="indigo">Sign In →</Btn>
          <p style={{ fontSize: 12, color: C.gray, textAlign: 'center', marginTop: 10 }}>
            No owner yet in the demo — register first.
          </p>
        </>
      )}
    </AuthShell>
  );
}
