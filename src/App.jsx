/**
 * App.jsx  —  Root component
 *
 * Responsibilities
 * ─────────────────
 * 1. Role selection → Auth → Dashboard routing
 * 2. API log bar (bottom strip showing Flask calls)
 * 3. Session-kick detection: polls every 8s; if the server reports
 *    the session is invalid (another device logged in), shows a
 *    "Logged out — another device signed in" banner and returns
 *    the user to the landing page.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { C } from './theme';
import { ApiLog, Toast } from './components/ui';

import Landing        from './pages/Landing';
import OwnerAuth      from './pages/auth/OwnerAuth';
import AdminAuth      from './pages/auth/AdminAuth';
import MemberAuth     from './pages/auth/MemberAuth';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import MemberDashboard from './pages/member/MemberDashboard';

export default function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [role,       setRole]       = useState(null);   // null | 'owner' | 'admin' | 'member'
  const [user,       setUser]       = useState(null);   // serialised user dict from Flask
  const [booting,   setBooting]   = useState(true);
  const [kickedMsg,  setKickedMsg]  = useState('');     // non-empty = show kick banner
  const [apiLogs,    setApiLogs]    = useState([]);
  const logId = useRef(0);

  // ── API log helper ─────────────────────────────────────────────────────────
  const addLog = useCallback((method, route, status = null) => {
    const id = ++logId.current;
    setApiLogs((prev) => [{ id, method, route, status }, ...prev].slice(0, 3));
    if (status) {
      setTimeout(() => setApiLogs((prev) => prev.filter((l) => l.id !== id)), 3500);
    }
  }, []);

  // ── Boot: check existing session ───────────────────────────────────────────
  useEffect(() => {
    addLog('GET', '/api/me');
    import('./mock/flask').then(({ flask }) =>
      flask.me()
        .then((u) => { addLog('GET', '/api/me', 200); setUser(u); setRole(u.role); })
        .catch(() => addLog('GET', '/api/me', 401))
        .finally(() => setBooting(false))
    );
  }, []);

  // ── Single-session kick poller ─────────────────────────────────────────────
  // Every 8 seconds check /api/me. If it returns 401 while we think we're
  // logged in, another device has taken over the session.
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(() => {
      import('./mock/flask').then(({ flask }) =>
        flask.me().catch(() => {
          // Session invalidated — someone else logged in on another device
          setUser(null);
          setRole(null);
          setKickedMsg('You were signed out because your account was logged in on another device.');
        })
      );
    }, 8000);
    return () => clearInterval(iv);
  }, [user]);

  // ── Auth handlers ──────────────────────────────────────────────────────────
  const handleLogin = useCallback((u) => {
    setKickedMsg('');
    setUser(u);
    setRole(u.role);
  }, []);

  const handleLogout = useCallback(async () => {
    addLog('POST', '/api/logout');
    const { flask } = await import('./mock/flask');
    await flask.logout();
    addLog('POST', '/api/logout', 200);
    setUser(null);
    setRole(null);
  }, [addLog]);

  // Called after any mutation that should re-sync user data (plan purchase, etc.)
  const refreshUser = useCallback(async (updatedUser) => {
    if (updatedUser) { setUser(updatedUser); return; }
    addLog('GET', '/api/me');
    try {
      const { flask } = await import('./mock/flask');
      const u = await flask.me();
      addLog('GET', '/api/me', 200);
      setUser(u);
    } catch {}
  }, [addLog]);

  // ── Boot screen ────────────────────────────────────────────────────────────
  if (booting) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: C.cream }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🍱</div>
          <div style={{ color: C.gray, fontSize: 15 }}>Connecting to Flask API…</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.lightBrown, marginTop: 6 }}>
            GET /api/me
          </div>
        </div>
      </div>
    );
  }

  // ── Routing ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Kicked-out banner — shown above whatever page is current */}
      {kickedMsg && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: C.charcoal, color: '#fff', padding: '12px 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          <span>🔐 {kickedMsg}</span>
          <button onClick={() => setKickedMsg('')}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
              fontSize: 18, lineHeight: 1, padding: 0, marginLeft: 12 }}>×</button>
        </div>
      )}

      {/* Landing / role picker */}
      {!user && !role && (
        <Landing onSelect={(r) => setRole(r)} />
      )}

      {/* Auth pages */}
      {!user && role === 'owner'  && <OwnerAuth  onLogin={handleLogin} addLog={addLog} onBack={() => setRole(null)} />}
      {!user && role === 'admin'  && <AdminAuth  onLogin={handleLogin} addLog={addLog} onBack={() => setRole(null)} />}
      {!user && role === 'member' && <MemberAuth onLogin={handleLogin} addLog={addLog} onBack={() => setRole(null)} />}

      {/* Dashboards */}
      {user?.role === 'owner'  && (
        <OwnerDashboard  user={user} onLogout={handleLogout} addLog={addLog} />
      )}
      {user?.role === 'admin'  && (
        <AdminDashboard  user={user} onLogout={handleLogout} onRefresh={refreshUser} addLog={addLog} />
      )}
      {user?.role === 'member' && (
        <MemberDashboard user={user} onLogout={handleLogout} onRefresh={refreshUser} addLog={addLog} />
      )}

      {/* Flask API log strip */}
      <ApiLog logs={apiLogs} />
    </>
  );
}
