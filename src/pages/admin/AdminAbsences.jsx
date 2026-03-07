import { useState } from 'react';
import { C } from '../../theme';
import { Card, Btn, Badge, Toast } from '../../components/ui';

export default function AdminAbsences({ users, onRefresh, addLog }) {
  const [loading, setLoading] = useState(null);

  const pending = users.flatMap((u) =>
    (u.pendingAbsences || [])
      .filter((a) => !a.approved)
      .map((a) => ({ ...a, userName: u.username, extensionDays: u.extensionDays || 0 }))
  );

  const approved = users.flatMap((u) =>
    (u.pendingAbsences || [])
      .filter((a) => a.approved)
      .map((a) => ({ ...a, userName: u.username }))
  );

  const approve = async (a) => {
    setLoading(a.id); addLog('POST', `/api/absences/${a.id}/approve`);
    try {
      const { flask } = await import('../../mock/flask');
      await flask.approveAbsence(a.id);
      addLog('POST', `/api/absences/${a.id}/approve`, 200);
      onRefresh();
    } catch (e) { alert(e.message); }
    finally { setLoading(null); }
  };

  const reject = async (a) => {
    setLoading(a.id); addLog('POST', `/api/absences/${a.id}/reject`);
    try {
      const { flask } = await import('../../mock/flask');
      await flask.rejectAbsence(a.id);
      addLog('POST', `/api/absences/${a.id}/reject`, 200);
      onRefresh();
    } catch (e) { alert(e.message); }
    finally { setLoading(null); }
  };

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>📬 Absence Requests</div>
      <div style={{ color: C.gray, fontSize: 14, marginBottom: 18 }}>
        Approving extends the member's subscription by the number of absent days.
      </div>

      {pending.length === 0
        ? <Toast type="success">No pending absence requests!</Toast>
        : pending.map((a) => {
          const remaining  = 15 - a.extensionDays;
          const canApprove = remaining >= a.days;
          return (
            <Card key={a.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>@{a.userName}</div>
                  <div style={{ fontSize: 13, color: C.gray }}>
                    {a.from} → {a.to} · {a.days} day(s)
                  </div>
                  {a.reason && (
                    <div style={{ fontSize: 13, color: C.lightBrown, marginTop: 2 }}>"{a.reason}"</div>
                  )}
                </div>
                <Badge color={C.brown} bg={C.lightAmber}>Pending</Badge>
              </div>

              {!canApprove && (
                <Toast type="warn">Only {remaining} extension day(s) remaining for this member.</Toast>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="green" small onClick={() => approve(a)}
                  disabled={!canApprove} loading={loading === a.id} style={{ flex: 1 }}>
                  ✅ Approve (+{Math.min(a.days, remaining)}d)
                </Btn>
                <Btn variant="red" small onClick={() => reject(a)}
                  loading={loading === a.id} style={{ flex: 1 }}>
                  ✗ Reject
                </Btn>
              </div>
            </Card>
          );
        })
      }

      {approved.length > 0 && (
        <Card style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>✅ Approved History</div>
          {approved.map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>@{a.userName}</div>
                <div style={{ fontSize: 12, color: C.gray }}>{a.from} → {a.to}</div>
              </div>
              <Badge color={C.softGreen} bg={C.lightGreen}>+{a.days}d extended</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
