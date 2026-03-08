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

let _uid = 30;
let _absenceId = 10;
let _slotId = 5;

export const genId   = ()  => ++_uid;
export const genAbsId = () => ++_absenceId;
export const genSlotId = () => ++_slotId;

export const db = {
  session: { userId: null, sid: null },

  users: [
    // ── Admins (each runs a mess) ─────────────────────────────────────────
    {
      id: 1, name: 'Ramesh Sharma', username: 'sharma_admin', email: 'admin@mess.com',
      password: 'password', role: 'admin', phone: '9876543210',
      address: 'FC Road, Pune',
      messName: "Sharma's Mess", messAddress: 'Shop 4, FC Road, Pune – 411004',
      priceLunch: 1800, priceDinner: 1600, priceBoth: 3000,
      sessionId: null, slotId: 1,
      plan: null, startDate: null, endDate: null, extensionDays: 0,
      otp: null, otpExpiresAt: null, attended: [], pendingAbsences: [],
    },
    {
      id: 6, name: 'Raj Sharma', username: 'raj_sharma', email: 'raj@kitchen.com',
      password: 'password', role: 'admin', phone: '9876500001',
      address: 'MG Road, Pune',
      messName: "Sharma's Kitchen", messAddress: 'Near Vaishali, MG Road, Pune – 411001',
      priceLunch: 2000, priceDinner: 1800, priceBoth: 3400,
      sessionId: null, slotId: 3,
      plan: null, startDate: null, endDate: null, extensionDays: 0,
      otp: null, otpExpiresAt: null, attended: [], pendingAbsences: [],
    },
    {
      id: 7, name: 'Lakshmi Iyer', username: 'annapurna_admin', email: 'lakshmi@annapurna.com',
      password: 'password', role: 'admin', phone: '9876500002',
      address: 'Koregaon Park, Pune',
      messName: "Annapurna Mess", messAddress: 'Lane 5, Koregaon Park, Pune – 411036',
      priceLunch: 1500, priceDinner: 1400, priceBoth: 2600,
      sessionId: null, slotId: 4,
      plan: null, startDate: null, endDate: null, extensionDays: 0,
      otp: null, otpExpiresAt: null, attended: [], pendingAbsences: [],
    },
    {
      id: 8, name: 'Vikram Desai', username: 'mumbai_admin', email: 'vikram@tiffins.com',
      password: 'password', role: 'admin', phone: '9876500003',
      address: 'Andheri West, Mumbai',
      messName: "Mumbai Tiffins", messAddress: 'Oshiwara, Andheri West, Mumbai – 400053',
      priceLunch: 2200, priceDinner: 2000, priceBoth: 3800,
      sessionId: null, slotId: 5,
      plan: null, startDate: null, endDate: null, extensionDays: 0,
      otp: null, otpExpiresAt: null, attended: [], pendingAbsences: [],
    },

    // ── Members ───────────────────────────────────────────────────────────
    {
      id: 2, name: 'Arjun Sharma', username: 'arjun_sharma', email: 'arjun@example.com',
      password: 'password', role: 'member', phone: '9123456780', address: 'Kothrud, Pune',
      sessionId: null,
      plan: 'both', startDate: addDays(today(), -19), endDate: addDays(today(), 6),
      extensionDays: 5, otp: null, otpExpiresAt: null,
      attended: [addDays(today(), -1), addDays(today(), -2), addDays(today(), -3)],
      pendingAbsences: [],
    },
    {
      id: 3, name: 'Priya Menon', username: 'priya_menon', email: 'priya@example.com',
      password: 'password', role: 'member', phone: '9123456781', address: 'Viman Nagar, Pune',
      sessionId: null,
      plan: 'lunch', startDate: addDays(today(), -14), endDate: addDays(today(), 18),
      extensionDays: 2, otp: null, otpExpiresAt: null,
      attended: [addDays(today(), -1), addDays(today(), -2)],
      pendingAbsences: [
        { id: 1, from: addDays(today(), 1), to: addDays(today(), 2), days: 2, reason: 'Family trip', approved: false },
      ],
    },
    {
      id: 4, name: 'Rohan Verma', username: 'rohan_verma', email: 'rohan@example.com',
      password: 'password', role: 'member', phone: '9123456782', address: 'Hinjewadi, Pune',
      sessionId: null,
      plan: 'dinner', startDate: addDays(today(), -24), endDate: addDays(today(), 3),
      extensionDays: 0, otp: null, otpExpiresAt: null,
      attended: [addDays(today(), -1)], pendingAbsences: [],
    },
    {
      id: 5, name: 'Kavya Nair', username: 'kavya_nair', email: 'kavya@example.com',
      password: 'password', role: 'member', phone: '9123456783', address: 'Baner, Pune',
      sessionId: null,
      plan: null, startDate: null, endDate: null, extensionDays: 0,
      otp: null, otpExpiresAt: null, attended: [], pendingAbsences: [],
    },
  ],

  slots: [
    { id: 1, label: 'Slot 1 – Pune FC Road',     status: 'active', adminId: 1, createdAt: new Date().toISOString() },
    { id: 2, label: 'Slot 2 – Available',         status: 'empty',  adminId: null, createdAt: new Date().toISOString() },
    { id: 3, label: 'Slot 3 – Pune MG Road',      status: 'active', adminId: 6, createdAt: new Date().toISOString() },
    { id: 4, label: 'Slot 4 – Pune KP',           status: 'active', adminId: 7, createdAt: new Date().toISOString() },
    { id: 5, label: 'Slot 5 – Mumbai Andheri',    status: 'active', adminId: 8, createdAt: new Date().toISOString() },
  ],
};
