/**
 * mock/flask.js
 * Proxy to real backend API endpoints.
 * All frontend components previously imported 'flask' from here.
 * Now, 'flask' simply delegates to the real `api.js` client.
 */

import * as api from './api';

export const flask = {
  // Shared
  me: api.getMe,
  logout: api.logout,
  
  // Public
  listMesses: api.listMesses,
  
  // Owner
  ownerRegister: api.ownerRegister,
  ownerLogin: api.ownerLogin,
  listSlots: api.listSlots,
  createSlot: api.createSlot,
  deleteSlot: api.deleteSlot,
  assignAdmin: (id, data) => api.assignAdmin(id, data),
  removeAdmin: api.removeAdmin,
  
  // Admin
  adminLogin: api.adminLogin,
  setPricing: api.setPricing,
  getAllUsers: api.getAllUsers,
  verifyOtp: api.verifyOtp,
  getActiveOtps: api.getActiveOtps,
  approveAbsence: api.approveAbsence,
  rejectAbsence: api.rejectAbsence,
  
  // Member
  memberRegister: api.memberRegister,
  memberLogin: api.memberLogin,
  purchasePlan: api.purchasePlan,
  renewPlan: api.renewPlan,
  generateOtp: api.generateOtp,
  submitAbsence: api.submitAbsence,
};
