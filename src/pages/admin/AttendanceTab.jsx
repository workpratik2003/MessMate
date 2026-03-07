import { useState, useEffect } from 'react';
import { C } from '../../theme';
import { Card, Btn, Badge, Field, Toast } from '../../components/ui';

export default function AttendanceTab({ user, onRefresh, addLog }) {
  const [section,   setSection]   = useState('otp');
  const [otp,       setOtp]       = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [mealType,  setMealType]  = useState('lunch');
  const [copied,    setCopied]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [from,      setFrom]      = useState('');
  const [to,        setTo]        = useState('');
  const [reason,    setReason]    = useState('');
  const [absMsg,    setAbsMsg]    = useState(null);

  // Countdown timer
  useEffect(() => {
    if (!otp || !expiresAt) return;
    const iv = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setCountdown(left);
      if (left === 0) { setOtp(null); setExpiresAt(null); }
    }, 1000);
    return () => clearInterval(iv);
  }, [otp, expiresAt]);

  const generate = async () => {
    setLoading(true); addLog('POST', '/api/otp/generate');
    try {
      const { flask } = await import('../../mock/flask');
      const res = await flask.generateOtp();
      addLog('POST', '/api/otp/generate', 200);
      setOtp(res.otp); setExpiresAt(res.otpExpiresAt); setCountdown(res.ttlSeconds);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const submitAbsence = async () => {
    if (!from || !to) { setAbsMsg({ type: 'error', text: 'Please select both dates.' }); return; }
    setLoading(true); addLog('POST', '/api/absences');
    try {
      const { flask } = await import('../../mock/flask');
      await flask.submitAbsence(from, to, reason);
      addLog('POST', '/api/absences', 201);
      setAbsMsg({ type: 'success', text: 'Absence submitted for admin approval.' });
      setFrom(''); setTo(''); setReason(''); onRefresh();
    } catch (e) { addLog('POST', '/api/absences', 400); setAbsMsg({ type: 'error', text: e.message }); }
    finally { setLoading(false); }
  };

  const remaining = 15 - (user.extensionDays || 0);
  const pct = countdown > 0 ? (countdown / 300) * 100 : 0;

  return (
    <div>
      {/* Section switcher */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
        background: C.lightGray, borderRadius: 12, padding: 5, marginBottom: 20 }}>
        {[{ id: 'otp', label: '🔐 Generate OTP' }, { id: 'absence', label: '📅 Report Absence' }].map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)}
            style={{ padding: '10px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, transition: 'all .15s',
              background: section === s.id ? '#fff' : 'transparent',
              color: section === s.id ? C.saffron : C.gray,
              boxShadow: section === s.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── OTP section ── */}
      {section === 'otp' && (
        <>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Attendance OTP</div>
          <div style={{ color: C.gray, fontSize: 14, marginBottom: 16 }}>
            Show this OTP to the mess admin to mark your attendance.
          </div>

          {user.plan === 'both' && (
            <Card style={{ marginBottom: 14, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Select Meal</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['lunch', 'dinner'].map((m) => (
                  <button key={m} onClick={() => setMealType(m)}
                    style={{ padding: '9px 0', borderRadius: 9,
                      border: `2px solid ${mealType === m ? C.saffron : C.border}`,
                      background: mealType === m ? '#FFF3E5' : '#fff',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      color: mealType === m ? C.saffron : C.gray }}>
                    {m === 'lunch' ? '🌞 Lunch' : '🌙 Dinner'}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {otp ? (
            <Card style={{ textAlign: 'center', padding: 26 }}>
              <div style={{ fontSize: 12, color: C.gray, marginBottom: 6 }}>
                OTP for {mealType} · @{user.username}
              </div>
              <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: 10,
                color: C.saffron, margin: '6px 0 14px', fontFamily: 'monospace' }}>
                {otp}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: countdown < 60 ? C.red : C.gray,
                  fontWeight: 600, marginBottom: 6 }}>
                  ⏱ {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')} remaining
                </div>
                <div style={{ height: 6, background: C.lightGray, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, transition: 'width 1s linear',
                    width: `${pct}%`, background: countdown < 60 ? C.red : C.saffron }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="ghost" small style={{ flex: 1 }}
                  onClick={() => { navigator.clipboard?.writeText(otp); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                  {copied ? 'Copied ✓' : 'Copy'}
                </Btn>
                <Btn variant="outline" small style={{ flex: 1 }} onClick={generate} loading={loading}>
                  Regenerate
                </Btn>
              </div>
            </Card>
          ) : (
            <Card style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>🔑</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Ready to attend?</div>
              <div style={{ color: C.gray, fontSize: 14, marginBottom: 18 }}>
                Tap below to get a one-time password for the admin to scan.
              </div>
              <Btn onClick={generate} loading={loading} full>
                Generate OTP for {mealType === 'lunch' ? 'Lunch 🌞' : 'Dinner 🌙'}
              </Btn>
            </Card>
          )}

          <div style={{ marginTop: 12 }}>
            <Toast type="info">OTP is valid for 5 minutes. One OTP per meal session.</Toast>
          </div>
        </>
      )}

      {/* ── Absence section ── */}
      {section === 'absence' && (
        <>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Report Absence</div>
          <div style={{ color: C.gray, fontSize: 14, marginBottom: 14 }}>
            Notify the mess of planned absences. Approved days extend your subscription.
          </div>

          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Extension Allowance</span>
              <Badge color={remaining > 5 ? C.softGreen : C.red} bg={remaining > 5 ? C.lightGreen : C.lightRed}>
                {remaining} days left
              </Badge>
            </div>
            <div style={{ height: 7, background: C.lightGray, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, transition: 'width .4s',
                width: `${((user.extensionDays || 0) / 15) * 100}%`, background: C.saffron }} />
            </div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 5 }}>
              {user.extensionDays || 0} of 15 days used
            </div>
          </Card>

          {absMsg && <Toast type={absMsg.type} onClose={() => setAbsMsg(null)}>{absMsg.text}</Toast>}

          <Card style={{ marginBottom: 14 }}>
            <Field label="Absent From" value={from} onChange={setFrom} type="date" />
            <Field label="Absent To"   value={to}   onChange={setTo}   type="date" />
            <Field label="Reason (optional)" value={reason} onChange={setReason} placeholder="Travel, illness, festival…" />
            <Btn onClick={submitAbsence} loading={loading} full>Submit Absence Request</Btn>
          </Card>

          {(user.pendingAbsences || []).length > 0 && (
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>📬 My Requests</div>
              {user.pendingAbsences.map((a) => (
                <div key={a.id} style={{ padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{a.from} → {a.to}</span>
                    <Badge color={a.approved ? C.softGreen : '#7A5C00'} bg={a.approved ? C.lightGreen : C.lightAmber}>
                      {a.approved ? 'Approved ✓' : 'Pending'}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 13, color: C.gray }}>
                    {a.days} day(s) · {a.reason || 'No reason'}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
