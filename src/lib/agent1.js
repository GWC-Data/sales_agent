import { http } from "./api";

// Agent 1 (Sales Deal Guardrail & Order Validation) is mounted under /agent1
// in the unified backend app (see Hackathon-Sales-Channels-Operations-Agent/main.py).
const AGENT1_BASE = "/agent1";

export function fetchDealQueue(rep) {
  return http.get(`${AGENT1_BASE}/api/deals/queue`, rep ? { rep } : undefined);
}
export function fetchDealDetail(dealId) {
  return http.get(`${AGENT1_BASE}/api/deals/${encodeURIComponent(dealId)}/detail`);
}
export function submitDealDecision(dealId, body) {
  return http.post(`${AGENT1_BASE}/api/deals/${encodeURIComponent(dealId)}/decision`, body);
}
export function escalateDealViaEmail(dealId, body) {
  return http.post(`${AGENT1_BASE}/api/deals/${encodeURIComponent(dealId)}/escalate-email`, body);
}
export function fetchDealAuditLog() {
  return http.get(`${AGENT1_BASE}/api/deals/audit-log`);
}
