import { useState } from 'react';
import { C, daysLeft } from '../../theme';
import { Card, Btn, Badge, Toast } from '../../components/ui';

const PLANS = [
  { id: 'lunch',  label: 'Lunch Only',     icon: '🌞', price: 1800, desc: 'Every day lunch · 30 days' },
  { id: 'dinner', label: 'Dinner Only',    icon: '🌙', price: 1600, desc: 'Every day dinner · 30 days' },
  { id: 'both',   label: 'Lunch + Dinner', icon: '🍱', price: 3000, desc: 'Full day meals · 30 days', popular: true },
];

export default function SubscriptionTab({ user, onRefresh, addLog }) {
  const [sel,     setSel]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState(null);

  const renew = async () => {
    if (!sel) return;
    setLoading(true); addLog('POST', '/api/plan/renew');
    try {
      const { flask } = await import('../../mock/flask');
      await flask.renewPlan(sel);
      addLog('POST', '/api/plan/renew', 200);
      setMsg({ type: 'success', text: 'Subscription renewed for 30 days! 🎉' });
      setSel(null); onRefresh();
    } catch (e) { addLog('POST', '/api/plan/renew', 400); setMsg({ type: 'error', text: e.message }); }
    finally { setLoading(false); }
  };

  const dl = daysLeft(user.endDate);

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>📋 My Subscription</div>
      <div style={{ color: C.gray, fontSize: 14, marginBottom: 18 }}>
        View your current plan or renew / switch to a different one.
      </div>

      {/* Current plan */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Current Plan</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.saffron }}>
              {{ lunch: '🌞 Lunch Only', dinner: '🌙 Dinner Only', both: '🍱 Lunch + Dinner' }[user.plan]}
            </div>
            <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>
              Expires: {user.endDate || '—'}
            </div>
          </div>
          <Badge color={dl <= 5 ? C.red : C.softGreen} bg={dl <= 5 ? C.lightRed : C.lightGreen}>
            {dl} days left
          </Badge>
        </div>

        {dl <= 5 && (
          <div style={{ marginTop: 12, background: C.lightRed, borderRadius: 10, padding: '8px 12px',
            fontSize: 13, color: C.red, fontWeight: 600 }}>
            ⚠️ Expiring soon — renew below to avoid interruption!
          </div>
        )}
      </Card>

      {msg && <Toast type={msg.type} onClose={() => setMsg(null)}>{msg.text}</Toast>}

      {/* Plan picker */}
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Renew / Switch Plan</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {PLANS.map((p) => (
          <div key={p.id} onClick={() => setSel(p.id)}
            style={{ background: sel === p.id ? '#FFF3E5' : '#fff',
              border: `2px solid ${sel === p.id ? C.saffron : C.border}`,
              borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'relative', transition: 'all .15s' }}>
            {p.popular && (
              <div style={{ position: 'absolute', top: -10, right: 16, background: C.saffron,
                color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 10px' }}>
                POPULAR
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>{p.icon}</span>
              <div>
                <div style={{ fontWeight: 700 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: C.gray }}>{p.desc}</div>
              </div>
            </div>
            <div style={{ fontWeight: 900, color: C.saffron, fontSize: 17 }}>₹{p.price}</div>
          </div>
        ))}
      </div>

      <Btn onClick={renew} disabled={!sel} loading={loading} full>
        {sel ? `Renew ${PLANS.find((p) => p.id === sel)?.label} for 30 Days →` : 'Select a Plan to Renew'}
      </Btn>
    </div>
  );
}
