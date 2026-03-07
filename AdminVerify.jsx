import { useState, useEffect, useCallback } from 'react';
import { C } from '../../theme';
import { Card, Btn, Badge, Toast } from '../../components/ui';

export default function AdminVerify({ onVerified, addLog }) {
  const [input,      setInput]      = useState('');
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [activeOtps, setActiveOtps] = useState([]);

  const fetchOtps = useCallback(async () => {
    try {
      const { flask } = await import('../../mock/flask');
      const data = await flask.getActiveOtps();
      setActiveOtps(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchOtps();
    const iv = setInterval(fetchOtps, 5000);
    return () => clearInterval(iv);
  }, [fetchOtps]);

  const verify = async () => {
    if (input.length !== 6) { setResult({ type: 'error', text: 'Enter a valid 6-digit OTP.' }); return; }
    setLoading(true); addLog('POST', '/api/otp/verify');
    try {
      const { flask } = await import('../../mock/flask');
      const res = await flask.verifyOtp(input);
      addLog('POST', '/api/otp/verify', 200);
      setResult({ type: 'success', text: `✅ Attendance marked for @${res.memberName}!` });
      setInput(''); fetchOtps(); onVerified();
    } catch (e) { addLog('POST', '/api/otp/verify', 400); setResult({ type: 'error', text: e.message }); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>✅ Verify OTP</div>
      <div style={{ color: C.gray, fontSize: 14, marginBottom: 18 }}>
        Enter the 6-digit OTP shown on the member's phone to mark their attendance.
      </div>

      {result && <Toast type={result.type} onClose={() => setResult(null)}>{result.text}</Toast>}

      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.lightBrown, marginBottom: 8 }}>Enter 6-Digit OTP</div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={(e) => e.key === 'Enter' && verify()}
          placeholder="_ _ _ _ _ _"
          style={{ width: '100%', padding: '15px 14px', borderRadius: 12,
            border: `2px solid ${C.border}`, fontSize: 32, fontWeight: 900,
            letterSpacing: 12, textAlign: 'center', background: C.warmWhite,
            outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
        <Btn onClick={verify} loading={loading} full style={{ marginTop: 14 }}>
          Verify & Mark Attendance
        </Btn>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          🔴 Live Active OTPs
          <span style={{ fontWeight: 400, fontSize: 12, color: C.gray }}> — refreshes every 5s</span>
        </div>
        {activeOtps.length === 0
          ? <div style={{ color: C.gray, fontSize: 14 }}>No active OTPs right now.</div>
          : activeOtps.map((u) => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>@{u.name}</span>
              <Badge color={C.deepSaffron} bg="#FFF0E0"
                style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: 3 }}>
                {u.otp}
              </Badge>
            </div>
          ))
        }
      </Card>
    </div>
  );
}
