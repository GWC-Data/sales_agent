import { http } from "./api";

// Agent 2 (NCA Lead-to-Order) is mounted under /agent2 in the unified
// backend app (see Hackathon-Sales-Channels-Operations-Agent/main.py).
const AGENT2_BASE = "/agent2";

export function fetchOpportunities() {
  return http.get(`${AGENT2_BASE}/api/opportunities`);
}
export function fetchOpportunity(oppId) {
  return http.get(`${AGENT2_BASE}/api/opportunities/${encodeURIComponent(oppId)}`);
}
export function fetchTimeline(oppId) {
  return http.get(`${AGENT2_BASE}/api/opportunities/${encodeURIComponent(oppId)}/timeline`);
}
export function suggestNextStep(oppId) {
  return http.post(`${AGENT2_BASE}/api/opportunities/${encodeURIComponent(oppId)}/suggest`);
}
export function confirmField(oppId, field) {
  return http.post(`${AGENT2_BASE}/api/opportunities/${encodeURIComponent(oppId)}/fields/${encodeURIComponent(field)}/confirm`);
}
export function previewProposal(oppId) {
  return http.post(`${AGENT2_BASE}/api/opportunities/${encodeURIComponent(oppId)}/proposal/preview`);
}
export function sendProposal(oppId, editedDocument) {
  return http.post(`${AGENT2_BASE}/api/opportunities/${encodeURIComponent(oppId)}/proposal/send`, editedDocument || null);
}
export function markClosedLost(oppId, reason) {
  return http.post(`${AGENT2_BASE}/api/opportunities/${encodeURIComponent(oppId)}/closed-lost`, { reason });
}
export function advanceStage(oppId) {
  return http.post(`${AGENT2_BASE}/api/opportunities/${encodeURIComponent(oppId)}/advance`);
}
export function fetchOpenCommitments(oppId) {
  return http.get(`${AGENT2_BASE}/api/opportunities/${encodeURIComponent(oppId)}/commitments`);
}
export function fulfillCommitment(oppId, activityId) {
  return http.post(`${AGENT2_BASE}/api/opportunities/${encodeURIComponent(oppId)}/commitments/${encodeURIComponent(activityId)}/fulfill`);
}
export function fetchReps() {
  return http.get(`${AGENT2_BASE}/api/reps`);
}
export function fetchDailyPriorities(repName) {
  return http.get(`${AGENT2_BASE}/api/reps/${encodeURIComponent(repName)}/daily-priorities`);
}
export function analyzeMeetingNote(oppId, noteText) {
  return http.post(`${AGENT2_BASE}/api/opportunities/${encodeURIComponent(oppId)}/meeting-note/analyze`, { note_text: noteText });
}
export function applyMeetingNote(oppId, summary, confirmedFields, commitment) {
  return http.post(`${AGENT2_BASE}/api/opportunities/${encodeURIComponent(oppId)}/meeting-note/apply`, {
    summary, confirmed_fields: confirmedFields, commitment,
  });
}
