import { useState } from 'react';
import { C } from '../../theme';
import { Card, Btn, Toast, StepBar } from '../../components/ui';

export default function PlanPurchase({ user, mess, onPurchased, onChangeMess, addLog }) {
  const [sel,    setSel]    = useState(null);
  const [paying, setPaying] = useState(false);
  const [done,   setDone]   = useState(false);
  const [err,    setErr]    = useState('');

  const PLANS = [
    { id: 'lunch',  label: 'Lunch Only',     icon: '🌞', price: mess?.pricing?.lunch  || 1800, desc: 'Every day lunch · 30 days' },
    { id: 'dinner', label: 'Dinner Only',    icon: '🌙', price: mess?.pricing?.dinner || 1600, desc: 'Every day dinner · 30 days' },
    { id: 'both',   label: 'Lunch + Dinner', icon: '🍱', price: mess?.pricing?.both   || 3000, desc: 'Full day meals · 30 days', popular: true },
  ];

  const pay = async () => {
    if (!sel) return;
    setErr(''); setPaying(true);
    addLog('POST', '/api/plan/purchase');
    try {
      const { flask } = await import('../../mock/flask');
      const updated = await flask.purchasePlan(sel);
      addLog('POST', '/api/plan/purchase', 200);
      setDone(true);
      setTimeout(() => onPurchased(updated), 1800);
    } catch (e) { addLog('POST', '/api/plan/purchase', 400); setErr(e.message); setPaying(false); }
  };

  const selected = PLANS.find((p) => p.id === sel);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '28px 16px',
      background: `linear-gradient(160deg, ${C.cream}, #FFF8EE)` }}>

      <StepBar steps={['Register', 'Find Mess', 'Choose Plan', 'Dashboard']} current={2} />

      {/* Selected mess info */}
      {mess && (
        <div style={{
          background: '#fff', borderRadius: 14, padding: '12px 16px', marginBottom: 18,
          width: '100%', maxWidth: 420, border: `1.5px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.charcoal }}>
              🍱 {mess.messName}
            </div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>
              👤 {mess.ownerName} · 📍 {mess.messAddress}
            </div>
          </div>
          {onChangeMess && (
            <button onClick={onChangeMess}
              style={{
                background: C.lightGray, border: 'none', borderRadius: 8,
                padding: '6px 12px', cursor: 'pointer', fontWeight: 700,
                fontSize: 12, color: C.saffron, whiteSpace: 'nowrap', flexShrink: 0,
              }}>
              ← Change
            </button>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 24, maxWidth: 380 }}>
        <div style={{ fontSize: 44 }}>🍽️</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.charcoal, margin: '8px 0 4px' }}>
          Welcome, {user.name || user.username}!
        </h2>
        <p style={{ color: C.lightBrown, fontSize: 14 }}>
          Pick a meal plan to activate your account.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {done ? (
          <Card style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 56 }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: C.softGreen, marginTop: 12 }}>
              Payment Successful!
            </div>
            <div style={{ color: C.gray, marginTop: 8, fontSize: 14 }}>
              Taking you to your dashboard…
            </div>
          </Card>
        ) : (
          <>
            {err && <Toast type="error" onClose={() => setErr('')}>{err}</Toast>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {PLANS.map((p) => (
                <div key={p.id} onClick={() => setSel(p.id)}
                  style={{ background: sel === p.id ? '#FFF3E5' : '#fff',
                    border: `2px solid ${sel === p.id ? C.saffron : C.border}`,
                    borderRadius: 16, padding: '14px 18px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'relative', transition: 'all .15s',
                    boxShadow: sel === p.id ? '0 4px 16px rgba(232,112,26,0.15)' : 'none' }}>
                  {p.popular && (
                    <div style={{ position: 'absolute', top: -11, right: 16, background: C.saffron,
                      color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 10px' }}>
                      POPULAR
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 28 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{p.desc}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, color: C.saffron, fontSize: 18 }}>₹{p.price}</div>
                </div>
              ))}
            </div>

            {selected && (
              <div style={{ background: C.lightAmber, borderRadius: 12, padding: '12px 16px',
                marginBottom: 16, fontSize: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Order Summary</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{selected.label} · 30 days</span>
                  <span style={{ fontWeight: 700 }}>₹{selected.price}</span>
                </div>
              </div>
            )}

            <Btn onClick={pay} disabled={!sel} loading={paying} full style={{ fontSize: 16 }}>
              {sel ? `Pay ₹${selected?.price} & Activate` : 'Select a Plan to Continue'}
            </Btn>
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: C.gray }}>
              🔒 Secure payment · 30-day subscription
            </div>
          </>
        )}
      </div>
    </div>
  );
}
