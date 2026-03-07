import { useState } from 'react';
import { C } from '../../theme';
import { Card, Btn, Field, Toast, Badge } from '../../components/ui';

export default function AdminPricing({ user, onRefresh, addLog }) {
  const p = user.pricing || {};
  const [lunch,   setLunch]   = useState(String(p.lunch  || ''));
  const [dinner,  setDinner]  = useState(String(p.dinner || ''));
  const [both,    setBoth]    = useState(String(p.both   || ''));
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState(null);

  const handle = async () => {
    const l = parseInt(lunch), d = parseInt(dinner), b = parseInt(both);
    if (!l || !d || !b || l <= 0 || d <= 0 || b <= 0) {
      setMsg({ type: 'error', text: 'All prices must be positive whole numbers.' });
      return;
    }
    setLoading(true); addLog('POST', '/api/admin/pricing');
    try {
      const { flask } = await import('../../mock/flask');
      await flask.setPricing({ lunch: l, dinner: d, both: b });
      addLog('POST', '/api/admin/pricing', 200);
      setMsg({ type: 'success', text: 'Pricing saved successfully!' });
      onRefresh();
    } catch (e) { addLog('POST', '/api/admin/pricing', 400); setMsg({ type: 'error', text: e.message }); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>💰 Subscription Pricing</div>
      <div style={{ color: C.gray, fontSize: 14, marginBottom: 18 }}>
        Set monthly prices for your mess. Members see these when purchasing a plan.
      </div>

      {!p.lunch && (
        <div style={{ background: '#FFF3CD', borderRadius: 12, padding: '10px 14px', marginBottom: 14,
          fontSize: 13, fontWeight: 600, color: '#7A5C00' }}>
          ⚠️ Pricing not set yet — members cannot purchase plans until you save prices.
        </div>
      )}

      {msg && <Toast type={msg.type} onClose={() => setMsg(null)}>{msg.text}</Toast>}

      <Card style={{ marginBottom: 16 }}>
        <Field label="🌞 Lunch Only (₹ / month)"     value={lunch}  onChange={(v) => setLunch(v.replace(/\D/g, ''))}  type="tel" placeholder="e.g. 1800" required />
        <Field label="🌙 Dinner Only (₹ / month)"    value={dinner} onChange={(v) => setDinner(v.replace(/\D/g, ''))} type="tel" placeholder="e.g. 1600" required />
        <Field label="🍱 Lunch + Dinner (₹ / month)" value={both}   onChange={(v) => setBoth(v.replace(/\D/g, ''))}   type="tel" placeholder="e.g. 3000" required />
        <Btn onClick={handle} loading={loading} variant="purple" full>Save Pricing</Btn>
      </Card>

      {p.lunch && (
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Current Pricing</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[['🌞', 'Lunch',  p.lunch], ['🌙', 'Dinner', p.dinner], ['🍱', 'Both', p.both]].map(([icon, label, val]) => (
              <div key={label} style={{ background: C.lightGreen, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontWeight: 900, fontSize: 20, color: C.softGreen }}>₹{val}</div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
