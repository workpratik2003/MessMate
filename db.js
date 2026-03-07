/**
 * mock/db.js
 * In-memory database that mirrors the Flask/SQLite schema.
 * Used in development when the Flask server is not running.
 */

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().split('T')[0];
};
const today = () => new Date().toISOString().split('T')[0];

let _uid = 20;
let _absenceId = 10;
let _slotId = 3;

export const genId   = ()  => ++_uid;
export const genAbsId = () => ++_absenceId;
export const genSlotId = () => ++_slotId;

export const db = {
  session: { userId: null, sid: null },

  users: [
    {
      id: 1, username: 'sharma_admin', email: 'admin@mess.com',
      password: 'password', role: 'admin', phone: '9876543210',
      messName: "Sharma's Mess", messAddress: 'FC Road, Pune – 411004',
      priceLunch: 1800, priceDinner: 1600, priceBoth: 3000,
      sessionId: null, slotId: 1,
      plan: null, startDate: null, endDate: null, extensionDays: 0,
      otp: null, otpExpiresAt: null, attended: [], pendingAbsences: [],
    },
    {
      id: 2, username: 'arjun_sharma', email: 'arjun@example.com',
      password: 'password', role: 'member', phone: null, sessionId: null,
      plan: 'both', startDate: addDays(today(), -19), endDate: addDays(today(), 6),
      extensionDays: 5, otp: null, otpExpiresAt: null,
      attended: [addDays(today(), -1), addDays(today(), -2), addDays(today(), -3)],
      pendingAbsences: [],
    },
    {
      id: 3, username: 'priya_menon', email: 'priya@example.com',
      password: 'password', role: 'member', phone: null, sessionId: null,
      plan: 'lunch', startDate: addDays(today(), -14), endDate: addDays(today(), 18),
      extensionDays: 2, otp: null, otpExpiresAt: null,
      attended: [addDays(today(), -1), addDays(today(), -2)],
      pendingAbsences: [
        { id: 1, from: addDays(today(), 1), to: addDays(today(), 2), days: 2, reason: 'Family trip', approved: false },
      ],
    },
    {
      id: 4, username: 'rohan_verma', email: 'rohan@example.com',
      password: 'password', role: 'member', phone: null, sessionId: null,
      plan: 'dinner', startDate: addDays(today(), -24), endDate: addDays(today(), 3),
      extensionDays: 0, otp: null, otpExpiresAt: null,
      attended: [addDays(today(), -1)], pendingAbsences: [],
    },
    {
      id: 5, username: 'kavya_nair', email: 'kavya@example.com',
      password: 'password', role: 'member', phone: null, sessionId: null,
      plan: null, startDate: null, endDate: null, extensionDays: 0,
      otp: null, otpExpiresAt: null, attended: [], pendingAbsences: [],
    },
  ],

  slots: [
    { id: 1, label: 'Slot 1 – Pune Demo', status: 'active', adminId: 1, createdAt: new Date().toISOString() },
    { id: 2, label: 'Slot 2 – Mumbai',    status: 'empty',  adminId: null, createdAt: new Date().toISOString() },
  ],
};
