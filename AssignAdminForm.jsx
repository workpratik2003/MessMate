import { useState } from 'react';
import { C, validEmail, validPhone } from '../../theme';
import { Card, Btn, Field, Toast, Divider } from '../../components/ui';

export default function AssignAdminForm({ slot, onDone, onCancel, addLog }) {
  const defaultMessName = slot.label.replace(/^Slot \d+\s*[–-]\s*/, '');
  const [f, setF] = useState({
    username: '', email: '', phone: '', password: '', confirm: '',
    mess_name: defaultMessName, mess_address: '',
  });
  const [errors,  setErrors]  = useState({});
  const [apiErr,  setApiErr]  = useState('');
  const [loading, setLoading] = useState(false);

  const upd = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: '' })); };

  const handle = async () => {
    const e = {};
    if (f.username.trim().length < 3) e.username     = 'Min. 3 characters.';
    if (!validEmail(f.email))         e.email         = 'Valid email required.';
    if (!validPhone(f.phone))         e.phone         = '10-digit Indian number.';
    if (f.password.length < 6)        e.password      = 'Min. 6 characters.';
    if (f.password !== f.confirm)     e.confirm       = "Passwords don't match.";
    if (!f.mess_name.trim())          e.mess_name     = 'Mess name required.';
    if (!f.mess_address.trim())       e.mess_address  = 'Address required.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setApiErr(''); setLoading(true);
    addLog('POST', `/api/owner/slots/${slot.id}/assign`);
    try {
      const { flask } = await import('../../mock/flask');
      const res = await flask.assignAdmin(slot.id, f);
      addLog('POST', `/api/owner/slots/${slot.id}/assign`, 201);
      onDone(res);
    } catch (err) {
      addLog('POST', `/api/owner/slots/${slot.id}/assign`, 400);
      setApiErr(err.message);
    } finally { setLoading(false); }
  };

  return (
    <Card style={{ marginBottom: 18, border: `2px solid ${C.midPurple}` }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: C.midPurple, marginBottom: 14 }}>
        👨‍🍳 Assign Admin to "{slot.label}"
      </div>

      {apiErr && <Toast type="error" onClose={() => setApiErr('')}>{apiErr}</Toast>}

      <Divider icon="👤" label="Admin Credentials" />
      <Field label="Username"         value={f.username}  onChange={(v) => upd('username', v)}  placeholder="admin_username"     required error={errors.username} />
      <Field label="Email"            value={f.email}     onChange={(v) => upd('email', v)}     type="email"    placeholder="admin@mess.com"       required error={errors.email} />
      <Field label="Phone"            value={f.phone}     onChange={(v) => upd('phone', v.replace(/\D/g, '').slice(0, 10))} type="tel" placeholder="10-digit mobile" required error={errors.phone} />
      <Field label="Password"         value={f.password}  onChange={(v) => upd('password', v)}  type="password" placeholder="Set admin's password"  required error={errors.password} hint="You'll share this with the admin securely" />
      <Field label="Confirm Password" value={f.confirm}   onChange={(v) => upd('confirm', v)}   type="password" placeholder="Re-enter password"     required error={errors.confirm} />

      <Divider icon="🍱" label="Mess Details" />
      <Field label="Mess Name"    value={f.mess_name}    onChange={(v) => upd('mess_name', v)}    placeholder="e.g. Sharma's Mess"            required error={errors.mess_name} />
      <Field label="Mess Address" value={f.mess_address} onChange={(v) => upd('mess_address', v)} placeholder="Street, City, State, PIN Code" required error={errors.mess_address} rows={2} />

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <Btn onClick={handle} loading={loading} variant="purple" style={{ flex: 1 }}>Create Admin Account</Btn>
        <Btn onClick={onCancel} variant="ghost" style={{ flex: 1 }}>Cancel</Btn>
      </div>
    </Card>
  );
}
