import { useState, useEffect, useCallback } from 'react';
import { C } from '../../theme';
import { Card, Btn, Field, Badge, Toast, AppHeader } from '../../components/ui';
import AssignAdminForm from './AssignAdminForm';

export default function OwnerDashboard({ user, onLogout, addLog }) {
  const [slots,      setSlots]      = useState([]);
  const [newLabel,   setNewLabel]   = useState('');
  const [creating,   setCreating]   = useState(false);
  const [assignSlot, setAssignSlot] = useState(null);
  const [msg,        setMsg]        = useState(null);
  const [creds,      setCreds]      = useState(null);

  const fetchSlots = useCallback(async () => {
    addLog('GET', '/api/owner/slots');
    try {
      const { flask } = await import('../../mock/flask');
      const d = await flask.listSlots();
      addLog('GET', '/api/owner/slots', 200);
      setSlots(d.slots);
    } catch {}
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const createSlot = async () => {
    if (!newLabel.trim()) return;
    setCreating(true); addLog('POST', '/api/owner/slots');
    try {
      const { flask } = await import('../../mock/flask');
      await flask.createSlot(newLabel);
      addLog('POST', '/api/owner/slots', 201);
      setNewLabel(''); fetchSlots(); setMsg({ type: 'success', text: 'Slot created.' });
    } catch (e) { addLog('POST', '/api/owner/slots', 400); setMsg({ type: 'error', text: e.message }); }
    finally { setCreating(false); }
  };

  const deleteSlot = async (id) => {
    if (!window.confirm('Delete this slot and its admin account?')) return;
    addLog('DELETE', `/api/owner/slots/${id}`);
    try {
      const { flask } = await import('../../mock/flask');
      await flask.deleteSlot(id);
      addLog('DELETE', `/api/owner/slots/${id}`, 200);
      fetchSlots(); setMsg({ type: 'success', text: 'Slot deleted.' });
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
  };

  const removeAdmin = async (id) => {
    if (!window.confirm('Remove this admin? Their account will be deleted.')) return;
    addLog('POST', `/api/owner/slots/${id}/remove`);
    try {
      const { flask } = await import('../../mock/flask');
      await flask.removeAdmin(id);
      addLog('POST', `/api/owner/slots/${id}/remove`, 200);
      fetchSlots(); setMsg({ type: 'success', text: 'Admin removed.' });
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
  };

  const onAssigned = (result) => { setCreds(result.credentials); setAssignSlot(null); fetchSlots(); };
  const totalActive = slots.filter((s) => s.status === 'active').length;

  return (
    <div style={{ background: C.cream, minHeight: '100vh' }}>
      <AppHeader icon="👑" title="Owner Dashboard" subtitle={`@${user.username} · ${user.email}`} bg={C.indigo}
        right={<button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>↩</button>} />

      <div style={{ padding: '20px 16px', maxWidth: 620, margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Slots', value: slots.length,           icon: '🗂️', color: C.indigo },
            { label: 'Active',      value: totalActive,            icon: '✅', color: C.green },
            { label: 'Empty',       value: slots.length-totalActive, icon: '⭕', color: C.gray },
          ].map((s) => (
            <Card key={s.label} style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.gray, fontWeight: 600 }}>{s.label}</div>
            </Card>
          ))}
        </div>

        {msg && <Toast type={msg.type} onClose={() => setMsg(null)}>{msg.text}</Toast>}

        {/* Credentials popup */}
        {creds && (
          <div style={{ background: C.charcoal, borderRadius: 16, padding: '18px 20px', marginBottom: 18, color: '#fff' }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>🎉 Admin account created — share these credentials securely</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>Username: <span style={{ color: C.turmeric }}>{creds.username}</span></div>
              <div>Email: <span style={{ color: C.turmeric }}>{creds.email}</span></div>
              <div>Password: <span style={{ color: C.turmeric }}>{creds.password}</span></div>
            </div>
            <Btn small variant="ghost" onClick={() => setCreds(null)} style={{ marginTop: 12 }}>Dismiss</Btn>
          </div>
        )}

        {/* Create slot */}
        <Card style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>➕ Create New Admin Slot</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Slot 3 – Delhi"
              onKeyDown={(e) => e.key === 'Enter' && createSlot()}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                fontSize: 14, background: C.warmWhite, outline: 'none', fontFamily: 'inherit' }} />
            <Btn onClick={createSlot} loading={creating} variant="indigo" small>Create</Btn>
          </div>
        </Card>

        {/* Assign modal */}
        {assignSlot && (
          <AssignAdminForm slot={assignSlot} onDone={onAssigned} onCancel={() => setAssignSlot(null)} addLog={addLog} />
        )}

        {/* Slot list */}
        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>🗂️ Admin Slots ({slots.length})</div>
        {slots.length === 0 && <Toast type="info">No slots yet — create your first one above.</Toast>}
        {slots.map((slot) => (
          <Card key={slot.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{slot.label}</div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>ID #{slot.id} · {slot.createdAt.split('T')[0]}</div>
              </div>
              <Badge color={slot.status==='active'?C.softGreen:C.gray} bg={slot.status==='active'?C.lightGreen:C.lightGray}>
                {slot.status === 'active' ? 'Active' : 'Empty'}
              </Badge>
            </div>

            {slot.admin && (
              <div style={{ background: C.lightGray, borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>👨‍🍳 @{slot.admin.username}</div>
                <div style={{ fontSize: 12, color: C.gray }}>✉ {slot.admin.email} · 📞 {slot.admin.phone}</div>
                <div style={{ fontSize: 12, color: C.gray }}>🍱 {slot.admin.messName}</div>
                <div style={{ fontSize: 12, color: C.gray }}>📍 {slot.admin.messAddress}</div>
                {slot.admin.pricing?.lunch && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge color={C.softGreen} bg={C.lightGreen}>Lunch ₹{slot.admin.pricing.lunch}</Badge>
                    <Badge color={C.softGreen} bg={C.lightGreen}>Dinner ₹{slot.admin.pricing.dinner}</Badge>
                    <Badge color={C.softGreen} bg={C.lightGreen}>Both ₹{slot.admin.pricing.both}</Badge>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {slot.status === 'empty'  && <Btn small variant="purple" onClick={() => setAssignSlot(slot)}>Assign Admin</Btn>}
              {slot.status === 'active' && <Btn small variant="danger" onClick={() => removeAdmin(slot.id)}>Remove Admin</Btn>}
              <Btn small variant="red" onClick={() => deleteSlot(slot.id)}>Delete Slot</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
