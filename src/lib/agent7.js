import { http } from "./api";

// Agent 7 (Sales Rep Performance & Coaching Trigger) is mounted under /agent7
// in the unified backend app (see Hackathon-Sales-Channels-Operations-Agent/main.py).
const AGENT7_BASE = "/agent7";

export function fetchDashboard() {
  return http.get(`${AGENT7_BASE}/api/dashboard`);
}
export function fetchReps() {
  return http.get(`${AGENT7_BASE}/api/reps`);
}
export function fetchRepGapAnalysis(repId) {
  return http.get(`${AGENT7_BASE}/api/reps/${encodeURIComponent(repId)}/gap-analysis`);
}
export function fetchRepDetail(repId) {
  return http.get(`${AGENT7_BASE}/api/reps/${encodeURIComponent(repId)}/detail`);
}
export function createCoachingTask(repId, note) {
  return http.post(`${AGENT7_BASE}/api/reps/${encodeURIComponent(repId)}/coaching-task`, { note });
}
export function createRecognitionNomination(repId, note) {
  return http.post(`${AGENT7_BASE}/api/reps/${encodeURIComponent(repId)}/recognition-nomination`, { note });
}
export function fetchCoachingTasks() {
  return http.get(`${AGENT7_BASE}/api/coaching-tasks`);
}
export function fetchRecognitionNominations() {
  return http.get(`${AGENT7_BASE}/api/recognition-nominations`);
}
export function decideRecognitionNomination(nominationId, approved) {
  return http.post(`${AGENT7_BASE}/api/recognition-nominations/${encodeURIComponent(nominationId)}/decide`, { approved });
}
