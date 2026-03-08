/**
 * MessMate API client
 * All requests include credentials (session cookie) automatically.
 * Throws an Error with .message set to the server's error string on non-2xx.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong'), { status: res.status });
  return data;
}

// ── Shared ────────────────────────────────────────────────────────────────────
export const getMe     = ()                  => req('/api/me');
export const logout    = ()                  => req('/api/logout', { method: 'POST' });

// ── Owner ─────────────────────────────────────────────────────────────────────
export const ownerRegister = (body) => req('/api/owner/register', { method: 'POST', body });
export const ownerLogin    = (body) => req('/api/owner/login',    { method: 'POST', body });
export const ownerMe       = ()     => req('/api/owner/me');

// Slots
export const listSlots    = ()           => req('/api/owner/slots');
export const createSlot   = (label)      => req('/api/owner/slots', { method: 'POST', body: { label } });
export const deleteSlot   = (id)         => req(`/api/owner/slots/${id}`,        { method: 'DELETE' });
export const assignAdmin  = (id, body)   => req(`/api/owner/slots/${id}/assign`, { method: 'POST', body });
export const removeAdmin  = (id)         => req(`/api/owner/slots/${id}/remove`, { method: 'POST' });

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminLogin  = (body) => req('/api/admin/login',   { method: 'POST', body });
export const adminMe     = ()     => req('/api/admin/me');
export const getPricing  = ()     => req('/api/admin/pricing');
export const setPricing  = (body) => req('/api/admin/pricing', { method: 'POST', body });
export const getAllUsers  = ()     => req('/api/users');

// OTP
export const verifyOtp   = (otp)  => req('/api/otp/verify', { method: 'POST', body: { otp } });
export const getActiveOtps = ()   => req('/api/otp/active');

// Absences
export const approveAbsence = (id) => req(`/api/absences/${id}/approve`, { method: 'POST' });
export const rejectAbsence  = (id) => req(`/api/absences/${id}/reject`,  { method: 'POST' });

// ── Member ────────────────────────────────────────────────────────────────────
export const memberRegister  = (body)           => req('/api/register/member', { method: 'POST', body });
export const memberLogin     = (body)           => req('/api/login',           { method: 'POST', body });
export const purchasePlan    = (plan)           => req('/api/plan/purchase',   { method: 'POST', body: { plan } });
export const renewPlan       = (plan)           => req('/api/plan/renew',      { method: 'POST', body: { plan } });
export const generateOtp     = ()               => req('/api/otp/generate',    { method: 'POST' });
export const submitAbsence   = (from, to, reason) => req('/api/absences',      { method: 'POST', body: { from, to, reason } });

// ── Public ────────────────────────────────────────────────────────────────────
export const listMesses      = ()               => req('/api/messes');
