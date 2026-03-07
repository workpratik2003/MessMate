import { useState, useEffect, useCallback } from 'react';
import { C, daysLeft } from '../../theme';
import { Card, Badge, AppHeader, BottomNav } from '../../components/ui';
import AdminPricing  from './AdminPricing';
import AdminVerify   from './AdminVerify';
import AdminAbsences from './AdminAbsences';
import MembersPanel  from './MembersPanel';

// ── Home tab ─────────────────────────────────────────────────────────────────
function AdminHome({ users, pending, expiring, admin, onViewMembers }) {
  const active = users.filter((u) => u.plan);
  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 2 }}>Good day, @{admin.username}! 👋</div>
      <div style={{ color: C.gray, fontSize: 14, marginBottom: 12 }}>Your mess overview.</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {admin.phone     && <Badge color={C.midPurple} bg={C.lightPurple}>📞 {admin.phone}</Badge>}
        {admin.messName  && <Badge color={C.softGreen}  bg={C.lightGreen}>🍱 {admin.messName}</Badge>}
        {admin.pricing?.lunch && (
          <>
            <Badge color={C.brown} bg={C.lightAmber}>Lunch ₹{admin.pricing.lunch}</Badge>
            <Badge color={C.brown} bg={C.lightAmber}>Dinner ₹{admin.pricing.dinner}</Badge>
            <Badge color={C.brown} bg={C.lightAmber}>Both ₹{admin.pricing.both}</Badge>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'Total Members', value: active.length, icon: '👥', color: C.saffron, tap: true, action: onViewMembers },
          { label: 'Meals Today',   value: users.reduce((s, u) => s + (u.attended?.length || 0), 0), icon: '🍽️', color: C.green },
          { label: 'Expiring Soon', value: expiring.length, icon: '⚠️', color: C.red },
          { label: 'Pending Abs.',  value: pending.length,  icon: '📬', color: C.turmeric },
        ].map((s) => (
          <Card key={s.label} style={{ padding: 14 }} onClick={s.tap ? s.action : undefined}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, margin: '3px 0' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.gray, fontWeight: 600 }}>{s.label}</div>
            {s.tap && <div style={{ fontSize: 11, color: C.saffron, marginTop: 3, fontWeight: 700 }}>Tap to view all →</div>}
          </Card>
        ))}
      </div>

      {expiring.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10, color: C.red }}>🔴 Expiring This Week</div>
          {expiring.map((u) => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>@{u.username}</span>
              <Badge color={C.red} bg={C.lightRed}>{daysLeft(u.endDate)} days</Badge>
            </div>
          ))}
        </Card>
      )}

      {pending.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>📬 Pending Absence Requests</div>
          {pending.map((a, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>@{a.userName}</div>
              <div style={{ fontSize: 12, color: C.gray }}>{a.from} → {a.to} · {a.days}d · "{a.reason || 'No reason'}"</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── Members bottom sheet ─────────────────────────────────────────────────────
function MembersSheet({ users, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%',
        maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', padding: '20px 16px 36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>
            👥 Members ({users.filter((u) => u.plan).length} active)
          </div>
          <button onClick={onClose}
            style={{ background: C.lightGray, border: 'none', borderRadius: '50%',
              width: 32, height: 32, cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>✕</button>
        </div>
        <MembersPanel users={users} />
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function AdminDashboard({ user, onLogout, onRefresh, addLog }) {
  const [tab,         setTab]         = useState(!user.pricing?.lunch ? 'pricing' : 'home');
  const [users,       setUsers]       = useState([]);
  const [showMembers, setShowMembers] = useState(false);

  const fetchUsers = useCallback(async () => {
    addLog('GET', '/api/users');
    try {
      const { flask } = await import('../../mock/flask');
      const data = await flask.getAllUsers();
      addLog('GET', '/api/users', 200);
      setUsers(data);
    } catch {}
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const pending  = users.flatMap((u) =>
    (u.pendingAbsences || []).filter((a) => !a.approved).map((a) => ({ ...a, userName: u.username, extensionDays: u.extensionDays || 0 }))
  );
  const expiring = users.filter((u) => u.plan && daysLeft(u.endDate) <= 5);

  const TABS = [
    { id: 'home',     icon: '📊', label: 'Dashboard' },
    { id: 'pricing',  icon: '💰', label: 'Pricing' },
    { id: 'verify',   icon: '✅', label: 'Verify OTP' },
    { id: 'absences', icon: '📬', label: pending.length ? `(${pending.length})` : 'Absences' },
  ];

  return (
    <div style={{ background: C.cream, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader
        icon="🍱"
        title={user.messName || 'MessMate Admin'}
        subtitle={`@${user.username}`}
        bg={C.charcoal}
        right={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {pending.length > 0 && (
              <div style={{ background: C.red, color: '#fff', borderRadius: '50%', width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                {pending.length}
              </div>
            )}
            <button onClick={onLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>
              ↩
            </button>
          </div>
        }
      />

      {!user.pricing?.lunch && tab !== 'pricing' && (
        <div onClick={() => setTab('pricing')}
          style={{ background: '#FFF3CD', padding: '9px 18px', fontSize: 13, fontWeight: 600,
            color: '#7A5C00', cursor: 'pointer' }}>
          ⚠️ Set your subscription pricing to let members purchase plans → tap here
        </div>
      )}

      {showMembers && <MembersSheet users={users} onClose={() => setShowMembers(false)} />}

      <main style={{ flex: 1, padding: '18px 14px', maxWidth: 640, margin: '0 auto', width: '100%', paddingBottom: 80 }}>
        {tab === 'home'     && <AdminHome users={users} pending={pending} expiring={expiring} admin={user} onViewMembers={() => setShowMembers(true)} />}
        {tab === 'pricing'  && <AdminPricing  user={user} onRefresh={onRefresh} addLog={addLog} />}
        {tab === 'verify'   && <AdminVerify   onVerified={fetchUsers} addLog={addLog} />}
        {tab === 'absences' && <AdminAbsences users={users} onRefresh={fetchUsers} addLog={addLog} />}
      </main>

      <BottomNav tabs={TABS} active={tab} onSelect={setTab} />
    </div>
  );
}
