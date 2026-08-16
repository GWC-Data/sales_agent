import { http } from "./api";

// Agent 5 (Distributor & Reseller/MSP Partner Onboarding) is mounted under
// /agent5 in the unified backend app (see
// Hackathon-Sales-Channels-Operations-Agent/main.py).
const AGENT5_BASE = "/agent5";

export function fetchApplications() {
  return http.get(`${AGENT5_BASE}/api/applications`);
}
export function fetchApplication(appId) {
  return http.get(`${AGENT5_BASE}/api/applications/${encodeURIComponent(appId)}`);
}
export function fetchApplicationsQueue() {
  return http.get(`${AGENT5_BASE}/api/applications-queue`);
}
export function submitApplication(body) {
  return http.post(`${AGENT5_BASE}/api/applications`, body);
}
export function reviewApplication(appId) {
  return http.get(`${AGENT5_BASE}/api/applications/${encodeURIComponent(appId)}/review`);
}
export function approveApplication(appId, body) {
  return http.post(`${AGENT5_BASE}/api/applications/${encodeURIComponent(appId)}/approve`, body);
}
export function rejectApplication(appId, reason) {
  return http.post(`${AGENT5_BASE}/api/applications/${encodeURIComponent(appId)}/reject`, { reason });
}
export function requestMoreInfo(appId, requestedInfo) {
  return http.post(`${AGENT5_BASE}/api/applications/${encodeURIComponent(appId)}/request-info`, { requested_info: requestedInfo });
}
export function fetchProgramCriteria() {
  return http.get(`${AGENT5_BASE}/api/program-criteria`);
}
