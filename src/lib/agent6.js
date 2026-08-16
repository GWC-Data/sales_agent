import { http } from "./api";

// Agent 6 (AM Cross-Sell/Upsell) is mounted under /agent6 in the unified
// backend app (see Hackathon-Sales-Channels-Operations-Agent/main.py), so its
// routes live at /agent6/api/... rather than at the API root.
const AGENT6_BASE = "/agent6";

export function fetchOpportunities() {
  return http.get(`${AGENT6_BASE}/api/opportunities`);
}
export function fetchProductCatalog() {
  return http.get(`${AGENT6_BASE}/api/product-catalog`);
}
export function fetchAccounts() {
  return http.get(`${AGENT6_BASE}/api/accounts`);
}
export function fetchTickets() {
  return http.get(`${AGENT6_BASE}/api/tickets`);
}
export function fetchAccountSignals(accountId) {
  return http.get(`${AGENT6_BASE}/api/accounts/${encodeURIComponent(accountId)}/signals`);
}
export function fetchAccountOpportunities(accountId) {
  return http.get(`${AGENT6_BASE}/api/accounts/${encodeURIComponent(accountId)}/opportunities`);
}
export function generateOpportunity(accountId) {
  return http.post(`${AGENT6_BASE}/api/accounts/${encodeURIComponent(accountId)}/generate-opportunity`);
}
export function submitOpportunityAction(accountId, body) {
  return http.post(`${AGENT6_BASE}/api/accounts/${encodeURIComponent(accountId)}/actions`, body);
}
