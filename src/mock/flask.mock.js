/**
 * mock/flask.js
 * Simulates Flask REST API routes with artificial network delay.
 * Mirrors app.py v3 behaviour exactly, including single-session enforcement.
 */

import { db, genId, genAbsId, genSlotId } from './db';
import { validEmail, validPhone } from '../theme';

// ── Configurable constants (mirror config.py) ──────────────────────────────────
const OTP_CONFIG = {
  length:           4,    // digits
  ttlMs:       180_000,   // 3 minutes in milliseconds
  ttlSeconds:     180,
  lunchStart:      11,   // 11:00 AM
  lunchEnd:        15,   // 3:00 PM
  dinnerStart:     19,   // 7:00 PM
  dinnerEnd:       22,   // 10:00 PM
  absenceLeadHours: 2,   // hours before meal window
  defaultMaxExtDays: 15, // fallback if slot has no limit
};

const pause   = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const uuid    = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0]; };
const today   = () => new Date().toISOString().split('T')[0];
const tomorrow = () => addDays(today(), 1);

// ── Meal-window helpers ─────────────────────────────────────────────────────────
const currentHour = () => new Date().getHours();
const isLunchWindow  = () => { const h = currentHour(); return h >= OTP_CONFIG.lunchStart  && h < OTP_CONFIG.lunchEnd;  };
const isDinnerWindow = () => { const h = currentHour(); return h >= OTP_CONFIG.dinnerStart && h < OTP_CONFIG.dinnerEnd; };
const getAllowedMeal = (plan) => {
  if (plan === 'lunch')  return isLunchWindow()  ? 'lunch'  : null;
  if (plan === 'dinner') return isDinnerWindow() ? 'dinner' : null;
  if (plan === 'both')   { if (isLunchWindow()) return 'lunch'; if (isDinnerWindow()) return 'dinner'; }
  return null;
};
const nextWindowDesc = (plan) => {
  const h = currentHour();
  if ((plan === 'lunch' || plan === 'both') && h < OTP_CONFIG.lunchStart)
    return `Lunch window opens at ${OTP_CONFIG.lunchStart}:00 AM`;
  if ((plan === 'lunch' || plan === 'both') && h < OTP_CONFIG.dinnerStart)
    return `Dinner window opens at ${OTP_CONFIG.dinnerStart}:00 (7 PM)`;
  return "No more OTP windows today. Come back tomorrow!";
};
const hoursUntilNextWindow = (plan) => {
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  const candidates = [];
  if (plan === 'lunch'  || plan === 'both') candidates.push(OTP_CONFIG.lunchStart);
  if (plan === 'dinner' || plan === 'both') candidates.push(OTP_CONFIG.dinnerStart);
  for (const start of candidates.sort((a, b) => a - b)) { if (h < start) return start - h; }
  return 24 - h + Math.min(...candidates); // wrap to next day
};
// Get the slot for the currently logged-in admin (or any active slot for member checks)
const getAdminSlot = (adminId) => db.slots.find((s) => s.adminId === adminId) || null;
const getAnyActiveSlot = ()    => db.slots.find((s) => s.status === 'active')  || null;

// ── Serialisers ──────────────────────────────────────────────────────────────
const toUser = (u) => {
  const base = { id: u.id, name: u.name, username: u.username, email: u.email, phone: u.phone, role: u.role };
  if (u.role === 'owner') return base;
  if (u.role === 'admin') return {
    ...base, messName: u.messName, messAddress: u.messAddress,
    pricing: { lunch: u.priceLunch, dinner: u.priceDinner, both: u.priceBoth },
  };
  return {
    ...base, address: u.address, plan: u.plan, startDate: u.startDate, endDate: u.endDate,
    extensionDays: u.extensionDays, otpActive: !!u.otp,
    attended: [...u.attended],
    pendingAbsences: u.pendingAbsences.map((a) => ({ ...a })),
  };
};

const toSlot = (s) => {
  const admin = s.adminId ? db.users.find((u) => u.id === s.adminId) : null;
  return { id: s.id, label: s.label, status: s.status, createdAt: s.createdAt, maxExtensionDays: s.maxExtensionDays ?? 15, admin: admin ? toUser(admin) : null };
};

// ── Session helpers ──────────────────────────────────────────────────────────
const doLogin = (u) => {
  const sid = uuid();
  u.sessionId = sid;
  db.session = { userId: u.id, sid };
  return toUser(u);
};

const currentUser = () => {
  const { userId, sid } = db.session;
  if (!userId || !sid) return null;
  const u = db.users.find((u) => u.id === userId);
  if (!u || u.sessionId !== sid) { db.session = { userId: null, sid: null }; return null; }
  return u;
};

// ── Validation ───────────────────────────────────────────────────────────────
const baseValidation = ({ username, email, password, name }) => {
  // For owner/admin that still use username
  if (username !== undefined) {
    if (!username?.trim() || username.trim().length < 3) throw new Error('Username must be at least 3 characters.');
    if (db.users.find((u) => u.username === username.trim())) throw new Error('Username is already taken.');
  }
  // For members that use name
  if (name !== undefined) {
    if (!name?.trim() || name.trim().length < 2) throw new Error('Name must be at least 2 characters.');
  }
  if (!validEmail(email)) throw new Error('A valid email address is required.');
  if (db.users.find((u) => u.email === email.toLowerCase())) throw new Error('An account with this email already exists.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
};

// ── Exported route handlers ──────────────────────────────────────────────────
export const flask = {
  // shared
  async me()     { await pause(200); const u = currentUser(); if (!u) throw new Error('Not authenticated.'); return toUser(u); },
  async logout() { await pause(200); const u = currentUser(); if (u) u.sessionId = null; db.session = { userId: null, sid: null }; return { ok: true }; },

  // public — list all active messes (no auth required)
  async listMesses() {
    await pause(300);
    return db.users
      .filter((u) => u.role === 'admin' && u.priceLunch)
      .map((u) => ({
        id: u.id,
        messName: u.messName,
        ownerName: u.name,
        messAddress: u.messAddress,
        pricing: { lunch: u.priceLunch, dinner: u.priceDinner, both: u.priceBoth },
      }));
  },

  // owner
  async ownerRegister(data) {
    await pause(700);
    if (db.users.find((u) => u.role === 'owner')) throw new Error('Owner account already exists.');
    if (!validPhone(data.phone?.trim())) throw new Error('A valid 10-digit Indian mobile number is required.');
    baseValidation(data);
    const owner = { id: genId(), username: data.username.trim(), email: data.email.toLowerCase(),
      phone: data.phone.trim(), password: data.password, role: 'owner', sessionId: null };
    db.users.push(owner);
    return doLogin(owner);
  },
  async ownerLogin({ email, password }) {
    await pause(600);
    const u = db.users.find((u) => u.email === email?.toLowerCase() && u.role === 'owner');
    if (!u || u.password !== password) throw new Error('Invalid credentials.');
    return doLogin(u);
  },

  // slots
  async listSlots() {
    await pause(300);
    const u = currentUser(); if (!u || u.role !== 'owner') throw new Error('Owner access required.');
    return { slots: db.slots.map(toSlot) };
  },
  async createSlot(label) {
    await pause(400);
    const u = currentUser(); if (!u || u.role !== 'owner') throw new Error('Owner access required.');
    if (!label?.trim()) throw new Error('Slot label is required.');
    const slot = { id: genSlotId(), label: label.trim(), status: 'empty', adminId: null, createdAt: new Date().toISOString() };
    db.slots.push(slot);
    return toSlot(slot);
  },
  async deleteSlot(id) {
    await pause(500);
    const u = currentUser(); if (!u || u.role !== 'owner') throw new Error('Owner access required.');
    const idx = db.slots.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error('Slot not found.');
    const slot = db.slots[idx];
    if (slot.adminId) { const ai = db.users.findIndex((u) => u.id === slot.adminId); if (ai >= 0) db.users.splice(ai, 1); }
    db.slots.splice(idx, 1);
    return { ok: true };
  },
  async assignAdmin(slotId, data) {
    await pause(800);
    const u = currentUser(); if (!u || u.role !== 'owner') throw new Error('Owner access required.');
    const slot = db.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error('Slot not found.');
    if (slot.status === 'active') throw new Error('Slot already has an admin.');
    if (!validPhone(data.phone?.trim())) throw new Error('A valid 10-digit Indian mobile number is required.');
    baseValidation(data);
    if (!data.mess_name?.trim()) throw new Error('Mess name is required.');
    if (!data.mess_address?.trim()) throw new Error('Mess address is required.');
    const admin = {
      id: genId(), username: data.username.trim(), email: data.email.toLowerCase(),
      phone: data.phone.trim(), password: data.password, role: 'admin', sessionId: null,
      slotId, messName: data.mess_name.trim(), messAddress: data.mess_address.trim(),
      priceLunch: null, priceDinner: null, priceBoth: null,
      plan: null, startDate: null, endDate: null, extensionDays: 0,
      otp: null, otpExpiresAt: null, attended: [], pendingAbsences: [],
    };
    db.users.push(admin);
    slot.adminId = admin.id; slot.status = 'active';
    return { slot: toSlot(slot), admin: toUser(admin), credentials: { username: admin.username, email: admin.email, password: data.password } };
  },
  async removeAdmin(slotId) {
    await pause(500);
    const u = currentUser(); if (!u || u.role !== 'owner') throw new Error('Owner access required.');
    const slot = db.slots.find((s) => s.id === slotId);
    if (!slot || !slot.adminId) throw new Error('No admin in this slot.');
    const ai = db.users.findIndex((u) => u.id === slot.adminId);
    if (ai >= 0) db.users.splice(ai, 1);
    slot.adminId = null; slot.status = 'empty';
    return toSlot(slot);
  },

  // admin
  async adminLogin({ email, password }) {
    await pause(600);
    const admin = db.users.find((u) => u.email === email?.toLowerCase() && u.role === 'admin');
    if (!admin || admin.password !== password) throw new Error('Invalid credentials.');
    return doLogin(admin);
  },
  async setPricing({ lunch, dinner, both }) {
    await pause(500);
    const u = currentUser(); if (!u || u.role !== 'admin') throw new Error('Admin access required.');
    if (!Number.isInteger(lunch) || lunch <= 0) throw new Error('Lunch price must be a positive number.');
    if (!Number.isInteger(dinner) || dinner <= 0) throw new Error('Dinner price must be a positive number.');
    if (!Number.isInteger(both) || both <= 0) throw new Error('Both price must be a positive number.');
    u.priceLunch = lunch; u.priceDinner = dinner; u.priceBoth = both;
    return { lunch, dinner, both };
  },
  async getAllUsers() {
    await pause(400);
    const u = currentUser(); if (!u || u.role !== 'admin') throw new Error('Admin access required.');
    return db.users.filter((u) => u.role === 'member').map(toUser);
  },
  async verifyOtp(otp) {
    await pause(500);
    const admin = currentUser(); if (!admin || admin.role !== 'admin') throw new Error('Admin access required.');
    // Feature 1: 4-digit OTP
    if (String(otp).length !== OTP_CONFIG.length) throw new Error(`Enter a valid ${OTP_CONFIG.length}-digit OTP.`);
    const member = db.users.find((u) => u.otp === String(otp));
    if (!member) throw new Error('Invalid OTP — no matching member found.');
    if (Date.now() > member.otpExpiresAt) { member.otp = null; member.otpExpiresAt = null; throw new Error(`OTP expired (${OTP_CONFIG.ttlSeconds / 60} min limit).`); }
    const t = today();
    if (member.attended.includes(t)) { member.otp = null; throw new Error(`${member.username}'s attendance already marked today.`); }
    member.attended.push(t); member.otp = null; member.otpExpiresAt = null;
    return { success: true, memberName: member.username };
  },
  async getActiveOtps() {
    await pause(200);
    const now = Date.now();
    return db.users.filter((u) => u.otp && u.otpExpiresAt > now).map((u) => ({ id: u.id, name: u.username, otp: u.otp }));
  },
  async approveAbsence(id) {
    await pause(500);
    const admin = currentUser(); if (!admin || admin.role !== 'admin') throw new Error('Admin access required.');
    // Feature 7: per-slot max extension limit
    const slot = getAdminSlot(admin.id);
    const maxExt = slot ? (slot.maxExtensionDays ?? OTP_CONFIG.defaultMaxExtDays) : OTP_CONFIG.defaultMaxExtDays;
    for (const u of db.users) {
      const abs = u.pendingAbsences.find((a) => a.id === id);
      if (abs) {
        const extra = Math.min(abs.days, maxExt - u.extensionDays);
        if (extra <= 0) throw new Error(`Member has reached the extension limit of ${maxExt} days.`);
        abs.approved = true; u.extensionDays += extra;
        u.endDate = addDays(u.endDate || today(), extra);
        return { ok: true, daysExtended: extra };
      }
    }
    throw new Error('Absence not found.');
  },
  async rejectAbsence(id) {
    await pause(400);
    for (const u of db.users) {
      const idx = u.pendingAbsences.findIndex((a) => a.id === id);
      if (idx >= 0) { u.pendingAbsences.splice(idx, 1); return { ok: true }; }
    }
    throw new Error('Absence not found.');
  },

  // member
  async memberRegister(data) {
    await pause(700);
    if (!data.name?.trim() || data.name.trim().length < 2) throw new Error('Full name is required (min. 2 characters).');
    if (!validPhone(data.phone?.trim())) throw new Error('A valid 10-digit Indian mobile number is required.');
    if (db.users.find((u) => u.phone === data.phone.trim())) throw new Error('An account with this phone number already exists.');
    baseValidation(data);
    const member = {
      id: genId(), name: data.name.trim(), username: data.name.trim().toLowerCase().replace(/\s+/g, '_'),
      email: data.email.toLowerCase(), phone: data.phone.trim(),
      address: data.address?.trim() || '', password: data.password,
      role: 'member', sessionId: null,
      plan: null, startDate: null, endDate: null, extensionDays: 0,
      otp: null, otpExpiresAt: null, attended: [], pendingAbsences: [],
    };
    db.users.push(member);
    return doLogin(member);
  },
  async memberLogin({ email, password }) {
    await pause(600);
    const u = db.users.find((u) => u.email === email?.toLowerCase() && u.role === 'member');
    if (!u || u.password !== password) throw new Error('Invalid email or password.');
    return doLogin(u);
  },
  async purchasePlan(plan) {
    await pause(1500);
    const u = currentUser(); if (!u) throw new Error('Not logged in.');
    u.plan = plan; u.startDate = today(); u.endDate = addDays(today(), 30);
    return toUser(u);
  },
  async renewPlan(plan) {
    await pause(800);
    const u = currentUser(); if (!u) throw new Error('Not logged in.');
    const base = u.endDate && u.endDate > today() ? u.endDate : today();
    u.plan = plan; u.endDate = addDays(base, 30);
    return toUser(u);
  },
  async generateOtp() {
    await pause(400);
    const u = currentUser(); if (!u) throw new Error('Not logged in.');
    if (!u.plan) throw new Error('You need an active plan to generate an OTP.');
    // Feature 3: time-gated OTP generation
    const allowedMeal = getAllowedMeal(u.plan);
    if (!allowedMeal) throw new Error(`OTP generation is not available right now. ${nextWindowDesc(u.plan)}`);
    // Feature 1 & 2: 4-digit OTP, 3-min TTL, unlimited regeneration
    const min = 10 ** (OTP_CONFIG.length - 1);
    const max = 10 ** OTP_CONFIG.length - 1;
    u.otp = String(Math.floor(min + Math.random() * (max - min + 1)));
    u.otpExpiresAt = Date.now() + OTP_CONFIG.ttlMs;
    return { otp: u.otp, otpExpiresAt: u.otpExpiresAt, ttlSeconds: OTP_CONFIG.ttlSeconds, mealType: allowedMeal };
  },
  async submitAbsence(from, to, reason) {
    await pause(500);
    const u = currentUser(); if (!u) throw new Error('Not logged in.');
    const days = Math.ceil((new Date(to) - new Date(from)) / 86_400_000) + 1;
    if (days <= 0) throw new Error('End date must be on or after start date.');
    // Feature 6: future-only dates (from must be tomorrow or later)
    if (from <= today()) throw new Error('Absence must start from tomorrow or a future date.');
    // Feature 5: 2-hour lead time if the absence starts tomorrow
    if (from === tomorrow()) {
      const hrsLeft = hoursUntilNextWindow(u.plan);
      if (hrsLeft < OTP_CONFIG.absenceLeadHours)
        throw new Error(
          `Absences for tomorrow must be submitted at least ${OTP_CONFIG.absenceLeadHours} hours before the meal window. Only ${hrsLeft.toFixed(1)} hour(s) remaining.`
        );
    }
    // Feature 7: per-slot max extension limit
    const slot = getAnyActiveSlot();
    const maxExt = slot ? (slot.maxExtensionDays ?? OTP_CONFIG.defaultMaxExtDays) : OTP_CONFIG.defaultMaxExtDays;
    const remaining = maxExt - u.extensionDays;
    if (days > remaining) throw new Error(`Only ${remaining} extension day(s) remaining (max ${maxExt}).`);
    const abs = { id: genAbsId(), from, to, days, reason: reason || '', approved: false };
    u.pendingAbsences.push(abs);
    return abs;
  },
  // Feature 7: slot settings (owner only)
  async getSlotSettings(slotId) {
    await pause(200);
    const u = currentUser(); if (!u || u.role !== 'owner') throw new Error('Owner access required.');
    const slot = db.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error('Slot not found.');
    return { slotId: slot.id, maxExtensionDays: slot.maxExtensionDays ?? OTP_CONFIG.defaultMaxExtDays };
  },
  async updateSlotSettings(slotId, { maxExtensionDays }) {
    await pause(300);
    const u = currentUser(); if (!u || u.role !== 'owner') throw new Error('Owner access required.');
    const slot = db.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error('Slot not found.');
    if (!Number.isInteger(maxExtensionDays) || maxExtensionDays < 0)
      throw new Error('maxExtensionDays must be a non-negative integer.');
    slot.maxExtensionDays = maxExtensionDays;
    return toSlot(slot);
  },
};
