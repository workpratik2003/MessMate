import { useState, useEffect, useMemo } from 'react';
import { C } from '../../theme';
import { Card, Btn, Badge, Field, Toast } from '../../components/ui';

// ── OTP window config (mirrors OTP_CONFIG in flask.mock.js / config.py) ──────
const WINDOWS = {
  lunch:  { start: 11, end: 15, label: '11:00 AM – 3:00 PM' },
  dinner: { start: 19, end: 22, label: '7:00 PM – 10:00 PM' },
};
const OTP_TTL_SECONDS = 180; // 3 minutes
const ABSENCE_LEAD_HOURS = 2;

/** Returns which meal the current hour is in, or null if outside all windows. */
function getAllowedMeal(plan) {
  const h = new Date().getHours();
  if (plan === 'lunch')  return (h >= WINDOWS.lunch.start  && h < WINDOWS.lunch.end)  ? 'lunch'  : null;
  if (plan === 'dinner') return (h >= WINDOWS.dinner.start && h < WINDOWS.dinner.end) ? 'dinner' : null;
  if (plan === 'both') {
    if (h >= WINDOWS.lunch.start  && h < WINDOWS.lunch.end)  return 'lunch';
    if (h >= WINDOWS.dinner.start && h < WINDOWS.dinner.end) return 'dinner';
  }
  return null;
}

/** Returns hours remaining until the next meal window. */
function hoursUntilNextWindow(plan) {
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  const starts = [];
  if (plan === 'lunch'  || plan === 'both') starts.push(WINDOWS.lunch.start);
  if (plan === 'dinner' || plan === 'both') starts.push(WINDOWS.dinner.start);
  for (const s of starts.sort((a, b) => a - b)) { if (h < s) return s - h; }
  return 24 - h + Math.min(...starts);
}

/** Friendly description of next available window. */
function nextWindowDesc(plan) {
  const h = new Date().getHours();
  if ((plan === 'lunch' || plan === 'both') && h < WINDOWS.lunch.start)
    return `Lunch window opens at ${WINDOWS.lunch.start}:00 AM`;
  if ((plan === 'lunch' || plan === 'both') && h < WINDOWS.dinner.start)
    return `Dinner window opens at ${WINDOWS.dinner.start}:00 (7 PM)`;
  return "No more OTP windows today — come back tomorrow!";
}

/** Tomorrow's date string YYYY-MM-DD */
const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export default function AttendanceTab({ user, onRefresh, addLog }) {
  const [section,   setSection]   = useState('otp');
  const [otp,       setOtp]       = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [mealType,  setMealType]  = useState(() => getAllowedMeal(user.plan) || 'lunch');
  const [copied,    setCopied]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [from,      setFrom]      = useState('');
  const [to,        setTo]        = useState('');
  const [reason,    setReason]    = useState('');
  const [absMsg,    setAbsMsg]    = useState(null);

  // Re-check current window every minute so the UI stays in sync
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(iv);
  }, []);

  const allowedMeal = useMemo(() => getAllowedMeal(user.plan), [tick, user.plan]);
  const inWindow    = allowedMeal !== null;

  // Countdown timer for active OTP
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
    setLoading(true);
    addLog('POST', '/api/otp/generate');
    try {
      const { flask } = await import('../../mock/flask');
      const res = await flask.generateOtp();
      addLog('POST', '/api/otp/generate', 200);
      setOtp(res.otp);
      setExpiresAt(res.otpExpiresAt);
      setCountdown(res.ttlSeconds);
      if (res.mealType) setMealType(res.mealType);
    } catch (e) {
      addLog('POST', '/api/otp/generate', 400);
      setAbsMsg({ type: 'error', text: e.message });
      // Switch to absence section if out of window (helpful UX hint)
    }
    setLoading(false);
  };

  const submitAbsence = async () => {
    if (!from || !to) { setAbsMsg({ type: 'error', text: 'Please select both dates.' }); return; }
    setLoading(true);
    addLog('POST', '/api/absences');
    try {
      const { flask } = await import('../../mock/flask');
      await flask.submitAbsence(from, to, reason);
      addLog('POST', '/api/absences', 201);
      setAbsMsg({ type: 'success', text: 'Absence submitted for admin approval.' });
      setFrom(''); setTo(''); setReason('');
      onRefresh();
    } catch (e) {
      addLog('POST', '/api/absences', 400);
      setAbsMsg({ type: 'error', text: e.message });
    }
    setLoading(false);
  };

  // Dynamic max extension days (use slot's limit if available, fall back to 15)
  const maxExt   = user.maxExtensionDays ?? 15;
  const remaining = maxExt - (user.extensionDays || 0);
  // Progress bar percentage: countdown relative to OTP_TTL_SECONDS
  const pct = countdown > 0 ? (countdown / OTP_TTL_SECONDS) * 100 : 0;

  // Warn if submitting an absence for tomorrow and within lead-time window
  const tomorrowLeadWarning = useMemo(() => {
    if (!from || from !== tomorrowStr()) return null;
    const hrsLeft = hoursUntilNextWindow(user.plan);
    if (hrsLeft < ABSENCE_LEAD_HOURS)
      return `Only ${hrsLeft.toFixed(1)} hour(s) until the next meal window. You must submit at least ${ABSENCE_LEAD_HOURS} hours in advance.`;
    return null;
  }, [from, user.plan, tick]);

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
          <div style={{ color: C.gray, fontSize: 14, marginBottom: 12 }}>
            Show this OTP to the mess admin to mark your attendance.
          </div>

          {/* Time-window information banner */}
          <Card style={{ marginBottom: 14, padding: '10px 14px', background: C.lightAmber }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7A5C00', marginBottom: 4 }}>
              🕐 OTP Generation Windows
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {(user.plan === 'lunch' || user.plan === 'both') && (
                <div style={{ fontSize: 12, color: '#7A5C00' }}>
                  🌞 <strong>Lunch:</strong> {WINDOWS.lunch.label}
                </div>
              )}
              {(user.plan === 'dinner' || user.plan === 'both') && (
                <div style={{ fontSize: 12, color: '#7A5C00' }}>
                  🌙 <strong>Dinner:</strong> {WINDOWS.dinner.label}
                </div>
              )}
            </div>
          </Card>

          {/* Meal selector — only for 'both' plan when multiple windows could apply */}
          {user.plan === 'both' && (
            <Card style={{ marginBottom: 14, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Current Meal</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['lunch', 'dinner'].map((m) => {
                  const inThisWindow = getAllowedMeal('both') === m || (m === 'lunch' && isInWindow('lunch')) || (m === 'dinner' && isInWindow('dinner'));
                  return (
                    <button key={m} onClick={() => setMealType(m)}
                      style={{ padding: '9px 0', borderRadius: 9,
                        border: `2px solid ${mealType === m ? C.saffron : C.border}`,
                        background: mealType === m ? '#FFF3E5' : '#fff',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        color: mealType === m ? C.saffron : C.gray }}>
                      {m === 'lunch' ? '🌞 Lunch' : '🌙 Dinner'}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Out-of-window state */}
          {!inWindow && !otp && (
            <Card style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>⏳</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: C.brown }}>
                Not Available Yet
              </div>
              <div style={{ color: C.gray, fontSize: 14, marginBottom: 4 }}>
                {nextWindowDesc(user.plan)}
              </div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 8 }}>
                OTP will be enabled automatically when the window opens.
              </div>
            </Card>
          )}

          {/* Active OTP display */}
          {otp ? (
            <Card style={{ textAlign: 'center', padding: 26 }}>
              <div style={{ fontSize: 12, color: C.gray, marginBottom: 6 }}>
                OTP for {mealType} · @{user.username}
              </div>
              {/* 4-digit OTP — wider letter-spacing, large font */}
              <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: 14,
                color: C.saffron, margin: '6px 0 14px', fontFamily: 'monospace' }}>
                {otp}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: countdown < 40 ? C.red : C.gray,
                  fontWeight: 600, marginBottom: 6 }}>
                  ⏱ {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')} remaining
                </div>
                <div style={{ height: 6, background: C.lightGray, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, transition: 'width 1s linear',
                    width: `${pct}%`, background: countdown < 40 ? C.red : C.saffron }} />
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
          ) : inWindow && (
            <Card style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>🔑</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Ready to attend?</div>
              <div style={{ color: C.gray, fontSize: 14, marginBottom: 18 }}>
                Tap below to get a one-time password for the admin to verify.
              </div>
              <Btn onClick={generate} loading={loading} full>
                Generate OTP for {mealType === 'lunch' ? 'Lunch 🌞' : 'Dinner 🌙'}
              </Btn>
            </Card>
          )}

          {absMsg && (
            <div style={{ marginTop: 12 }}>
              <Toast type={absMsg.type} onClose={() => setAbsMsg(null)}>{absMsg.text}</Toast>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <Toast type="info">OTP is valid for 3 minutes. You can regenerate anytime if it expires.</Toast>
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

          {/* Extension allowance bar */}
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Extension Allowance</span>
              <Badge color={remaining > 5 ? C.softGreen : C.red} bg={remaining > 5 ? C.lightGreen : C.lightRed}>
                {remaining} of {maxExt} days left
              </Badge>
            </div>
            <div style={{ height: 7, background: C.lightGray, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, transition: 'width .4s',
                width: `${((user.extensionDays || 0) / maxExt) * 100}%`, background: C.saffron }} />
            </div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 5 }}>
              {user.extensionDays || 0} of {maxExt} days used
            </div>
          </Card>

          {/* Rules info box */}
          <Card style={{ marginBottom: 14, padding: '10px 14px', background: C.lightAmber }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7A5C00', marginBottom: 4 }}>
              📋 Absence Rules
            </div>
            <div style={{ fontSize: 12, color: '#7A5C00', lineHeight: 1.6 }}>
              • Absence dates must be <strong>tomorrow or later</strong><br />
              • For tomorrow's absence, submit at least <strong>{ABSENCE_LEAD_HOURS} hours</strong> before the meal window<br />
              • Approved absences automatically extend your subscription
            </div>
          </Card>

          {absMsg && <Toast type={absMsg.type} onClose={() => setAbsMsg(null)}>{absMsg.text}</Toast>}

          <Card style={{ marginBottom: 14 }}>
            {/* min is tomorrow so users cannot pick today or past dates */}
            <Field label="Absent From" value={from} onChange={setFrom} type="date"
              min={tomorrowStr()} max={user.endDate || undefined} />
            <Field label="Absent To"   value={to}   onChange={setTo}   type="date"
              min={from || tomorrowStr()} max={user.endDate || undefined} />
            <Field label="Reason (optional)" value={reason} onChange={setReason}
              placeholder="Travel, illness, festival…" />

            {/* Lead-time warning for tomorrow's absence */}
            {tomorrowLeadWarning && (
              <div style={{ background: C.lightRed, borderRadius: 8, padding: '8px 12px',
                fontSize: 12, color: C.red, fontWeight: 600, marginBottom: 12 }}>
                ⚠️ {tomorrowLeadWarning}
              </div>
            )}

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

// helper used inline for meal selector disabling logic
function isInWindow(meal) {
  const h = new Date().getHours();
  return meal === 'lunch'
    ? h >= WINDOWS.lunch.start  && h < WINDOWS.lunch.end
    : h >= WINDOWS.dinner.start && h < WINDOWS.dinner.end;
}
