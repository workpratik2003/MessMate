import { useState } from 'react';
import { C, daysLeft } from '../../theme';
import { Card, Badge, Field } from '../../components/ui';

export default function MembersPanel({ users }) {
  const [search, setSearch] = useState('');

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Field value={search} onChange={setSearch} placeholder="Search by username or email…" />

      {filtered.length === 0 && (
        <div style={{ color: C.gray, fontSize: 14, textAlign: 'center', padding: 24 }}>
          No members found.
        </div>
      )}

      {filtered.map((u) => {
        const dl = daysLeft(u.endDate);
        return (
          <Card key={u.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%',
                  background: u.plan ? C.saffron : C.lightGray,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: u.plan ? '#fff' : C.gray, fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                  {u.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>@{u.username}</div>
                  <div style={{ fontSize: 12, color: C.gray }}>{u.email}</div>
                </div>
              </div>

              {u.plan
                ? <Badge color={dl <= 5 ? C.red : C.softGreen} bg={dl <= 5 ? C.lightRed : C.lightGreen}>
                    {dl}d left
                  </Badge>
                : <Badge color={C.gray} bg={C.lightGray}>No Plan</Badge>
              }
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'Plan',      value: u.plan ? { lunch: 'Lunch', dinner: 'Dinner', both: 'L+D' }[u.plan] : '—' },
                { label: 'Attended',  value: (u.attended || []).length },
                { label: 'Extension', value: `${u.extensionDays || 0}/15d` },
              ].map((s) => (
                <div key={s.label} style={{ background: C.lightGray, borderRadius: 8,
                  padding: '7px 10px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: C.gray }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
