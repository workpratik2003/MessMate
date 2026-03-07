import { C, daysLeft, planLabel } from '../../theme';
import { Card, Badge, AppHeader, BottomNav } from '../../components/ui';
import PlanPurchase    from './PlanPurchase';
import AttendanceTab   from './AttendanceTab';
import SubscriptionTab from './SubscriptionTab';
import { useState } from 'react';

// ── Home tab ─────────────────────────────────────────────────────────────────
function MemberHome({ user }) {
  const dl = daysLeft(user.endDate);
  const stats = [
    { label: 'Days Left',        value: dl,                          icon: '📆', color: dl <= 5 ? C.red : C.green },
    { label: 'Meals Attended',   value: (user.attended || []).length, icon: '✅', color: C.saffron },
    { label: 'Extension Used',   value: `${user.extensionDays || 0}/15d`, icon: '⏳', color: C.turmeric },
    { label: 'Pending Absences', value: (user.pendingAbsences || []).length, icon: '🔔', color: C.lightBrown },
  ];

  return (
    <div>
      {/* Hero card */}
      <div style={{ background: `linear-gradient(135deg, ${C.saffron}, ${C.deepSaffron})`, borderRadius: 20,
        padding: 22, marginBottom: 18, color: '#fff', boxShadow: '0 6px 24px rgba(232,112,26,0.35)' }}>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 3 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'} 👋
        </div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>@{user.username}</div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge color="#fff" bg="rgba(255,255,255,0.2)">{planLabel(user.plan)}</Badge>
          {user.endDate && (
            <Badge color="#fff" bg="rgba(255,255,255,0.2)">Expires {user.endDate}</Badge>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        {stats.map((s) => (
          <Card key={s.label} style={{ padding: 14 }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, margin: '3px 0' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.gray, fontWeight: 600 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Recent attendance */}
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>📋 Recent Attendance</div>
        {(user.attended || []).length === 0
          ? <div style={{ color: C.gray, fontSize: 14 }}>No attendance recorded yet.</div>
          : [...user.attended].reverse().slice(0, 5).map((d) => (
            <div key={d} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 14 }}>📅 {d}</span>
              <Badge color={C.softGreen} bg={C.lightGreen}>Present</Badge>
            </div>
          ))
        }
      </Card>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function MemberDashboard({ user, onLogout, onRefresh, addLog }) {
  const [tab, setTab] = useState('home');

  // If no plan, show plan purchase flow
  if (!user.plan) {
    return <PlanPurchase user={user} onPurchased={onRefresh} addLog={addLog} />;
  }

  const dl = daysLeft(user.endDate);

  const TABS = [
    { id: 'home',  icon: '🏠', label: 'Home' },
    { id: 'otp',   icon: '🔐', label: 'Attendance' },
    { id: 'plan',  icon: '📋', label: 'My Plan' },
  ];

  return (
    <div style={{ background: C.cream, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader
        icon="🍱"
        title="MessMate"
        subtitle={planLabel(user.plan)}
        bg="#fff"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.saffron,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 14 }}>
              {user.username[0].toUpperCase()}
            </div>
            <button onClick={onLogout} title="Logout"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.gray }}>
              ↩
            </button>
          </div>
        }
      />

      {/* Expiry warning banner */}
      {dl <= 5 && dl > 0 && (
        <div style={{ background: C.lightAmber, padding: '9px 18px', fontSize: 13,
          fontWeight: 600, color: '#7A5C00' }}>
          ⚠️ Subscription expires in <strong>{dl} day{dl !== 1 ? 's' : ''}</strong> — renew soon!
        </div>
      )}

      <main style={{ flex: 1, padding: '18px 14px', maxWidth: 520, margin: '0 auto', width: '100%', paddingBottom: 80 }}>
        {tab === 'home' && <MemberHome user={user} />}
        {tab === 'otp'  && <AttendanceTab user={user} onRefresh={onRefresh} addLog={addLog} />}
        {tab === 'plan' && <SubscriptionTab user={user} onRefresh={onRefresh} addLog={addLog} />}
      </main>

      <BottomNav tabs={TABS} active={tab} onSelect={setTab} bg="#fff"
        activeColor={C.saffron}
        // Override so member nav has white bg with saffron text (not dark bg)
      />
    </div>
  );
}
