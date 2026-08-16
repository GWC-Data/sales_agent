import { http } from "./api";

// Agent 4 (Renewal Opportunity Auto-Creation & Backlog) is mounted under
// /agent4 in the unified backend app (see Hackathon-Sales-Channels-Operations-Agent/main.py).
const AGENT4_BASE = "/agent4";

export function fetchRenewalQueue(amOwner) {
  return http.get(`${AGENT4_BASE}/api/renewals/queue`, amOwner ? { am_owner: amOwner } : undefined);
}
export function fetchTriggerLog() {
  return http.get(`${AGENT4_BASE}/api/renewals/trigger-log`);
}
export function fetchRenewalDetail(renewalId) {
  return http.get(`${AGENT4_BASE}/api/renewals/${encodeURIComponent(renewalId)}/detail`);
}
export function logRenewalActivity(renewalId, body) {
  return http.post(`${AGENT4_BASE}/api/renewals/${encodeURIComponent(renewalId)}/activity`, body);
}
export function adjustRenewal(renewalId, body) {
  return http.post(`${AGENT4_BASE}/api/renewals/${encodeURIComponent(renewalId)}/adjust`, body);
}
export function notifyRenewal(renewalId, body) {
  return http.post(`${AGENT4_BASE}/api/renewals/${encodeURIComponent(renewalId)}/notify`, body);
}
