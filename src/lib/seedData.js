import {
  ShieldCheck, MessageSquareText, PhoneCall, RefreshCw, Users, TrendingUp, Gauge,
} from "lucide-react";

/* =========================================================================
   SEED DATA
========================================================================= */
export const ACCOUNTS = {
  "Northstar Managed Services": { arr: 128000, since: 2022, products: ["Firebox M590", "Endpoint Security"], invoiceStatus: "2 invoices over 30 days", dso: 46, tickets: [{ id: "TCK-551", sev: "Sev-2", age: "5d", desc: "SIEM alert tuning" }], term: "36mo", renewal: "Mar 2027", owner: "Priya N." },
  "Apex Secure Networks":      { arr: 84500, since: 2021, products: ["Firebox M590", "Backup"], invoiceStatus: "Current", dso: 18, tickets: [], term: "12mo", renewal: "Sep 2026", owner: "Marcus T." },
  "BluePeak Technologies":     { arr: 52000, since: 2023, products: ["Firebox M590"], invoiceStatus: "Current", dso: 22, tickets: [{ id: "TCK-560", sev: "Sev-3", age: "1d", desc: "Firmware update question" }], term: "12mo", renewal: "Nov 2026", owner: "Daniel R." },
  "Meridian Health Systems":   { arr: 143000, since: 2020, products: ["Firebox M590", "Endpoint Security", "DNSWatch"], invoiceStatus: "Overdue — 42 days", dso: 55, tickets: [{ id: "TCK-570", sev: "Sev-2", age: "3d", desc: "Database performance issue" }, { id: "TCK-571", sev: "Sev-3", age: "1d", desc: "" }], term: "24mo", renewal: "Jan 2027", owner: "Ananya S.",
    sentiment: "Cautiously positive", recentInteraction: "Last QBR 34 days ago", expansion: "Endpoint utilization up 31% in 90 days", recentEmail: "Asked about licensing for a newly acquired subsidiary" },
};
export const FULL_CATALOG = ["Firebox M590", "Endpoint Security", "DNSWatch", "AuthPoint", "Backup", "Secure Wi-Fi"];
export const PRODUCT_INFO = {
  "Firebox M590": "Unified threat management appliance — the flagship hardware firewall for mid-size sites.",
  "Endpoint Security": "Device-level protection: anti-malware, ransomware rollback, and behavioral threat detection.",
  "DNSWatch": "DNS-layer filtering that blocks malicious domains before a connection is ever made.",
  "AuthPoint": "Multi-factor authentication for secure access to applications, VPNs and cloud services.",
  "Backup": "Cloud backup and recovery for critical business data, with configurable retention policies.",
  "Secure Wi-Fi": "Cloud-managed wireless access points with built-in threat protection and guest network isolation.",
};
export function repByName(reps, name) { return (reps || []).find((r) => r.name === name); }

export const INITIAL_DEALS = [
  { id: "WG-10482", account: "Northstar Managed Services", rep: "Priya N.", repRole: "AM",
    address: "1200 Harbor Blvd, Seattle, WA", country: "United States", startDate: "Sep 1, 2026", endDate: "Aug 31, 2028",
    product: "Endpoint Security", sku: "EPS-STD-100", qty: "10 licenses, stepping to 20 at month 5", licenseCount: 100,
    billing: "Recurring, monthly", discount: 18, term: "24mo", validationScore: 82, status: "review", age: "2h", analyzed: false,
    crmOk: true, erpOk: false, provisioningOk: true,
    failedRules: ["Billing quantity-ramp support"],
    gap: "CRM configuration is valid, but the downstream billing platform cannot support increasing licensed quantity mid-term after month 4 of the contract.",
    decision: "undecided" },
  { id: "WG-10488", account: "BluePeak Technologies", rep: "Daniel R.", repRole: "NCA",
    address: "88 Cascade Ave, Portland, OR", country: "United States", startDate: "Aug 1, 2026", endDate: "Jul 31, 2027",
    product: "Firebox M590", sku: "FBX-M590", qty: "15 licenses (flat)", licenseCount: 15,
    billing: "Recurring, monthly", discount: 10, term: "12mo", validationScore: 97, status: "cleared", age: "40m", analyzed: true,
    crmOk: true, erpOk: true, provisioningOk: true, failedRules: [], decision: "undecided" },
  { id: "WG-10499", account: "Meridian Health Systems", rep: "Ananya S.", repRole: "NCA",
    address: "410 Cypress Dr, Austin, TX", country: "United States", startDate: "Jul 15, 2026", endDate: "Jul 14, 2028",
    product: "Firebox M590 + DNSWatch + AuthPoint", sku: "BNDL-SEC-3", qty: "35 licenses (flat)", licenseCount: 35,
    billing: "Annual prepaid", discount: 15, term: "24mo", validationScore: 68, status: "escalated", age: "5h", analyzed: false,
    crmOk: true, erpOk: true, provisioningOk: false, failedRules: ["Product entitlement provisioning"],
    gap: "AuthPoint is not yet enabled in Meridian's product entitlement record — a provisioning mismatch that needs the Product team's input before this can post to billing.",
    decision: "undecided" },
  { id: "WG-10505", account: "Apex Secure Networks", rep: "Marcus T.", repRole: "AM",
    address: "77 Redwood Pkwy, San Jose, CA", country: "United States", startDate: "Aug 20, 2026", endDate: "Aug 19, 2027",
    product: "Backup", sku: "BKP-STD-8", qty: "8 licenses (flat)", licenseCount: 8,
    billing: "Annual prepaid", discount: 5, term: "12mo", validationScore: 95, status: "cleared", age: "12m", analyzed: true,
    crmOk: true, erpOk: true, provisioningOk: true, failedRules: [], decision: "undecided" },
];

export const INITIAL_OPPS = [
  { id: "OP-10492", account: "Meridian Health Systems", stage: "Negotiation", age: 17, lastResponse: "Still evaluating.", priority: "high",
    reason: "Opportunity has remained in Negotiation for 17 days. Proposal opened twice, no meeting scheduled in the last 10 days. Similar opportunities historically progress faster after an executive meeting.",
    recommendedAction: "Schedule executive meeting", decision: "undecided",
    fields: [{ label: "Proposal", ok: true }, { label: "Pricing", ok: true }, { label: "Product configuration", ok: true }, { label: "Decision-maker confirmation", ok: false }] },
  { id: "OP-10487", account: "Apex Secure Networks", stage: "Proposal", age: 5, lastResponse: "Reviewing internally.", priority: "medium",
    reason: "Proposal opened twice this week — engagement is active but no response yet.", recommendedAction: "Send updated pricing", decision: "undecided" },
  { id: "OP-20491", account: "BluePeak Technologies", stage: "Contract", age: 2, lastResponse: "Ready to sign.", priority: "medium",
    reason: "Signature page opened, no outstanding objections logged.", recommendedAction: "Generate order confirmation", decision: "undecided" },
  { id: "OP-10480", account: "Northstar Managed Services", stage: "Qualified", age: 9, lastResponse: "Requested case studies.", priority: "low",
    reason: "Early-stage — no urgent action, nurture with content.", recommendedAction: "Send case studies", decision: "undecided" },
];

export const INITIAL_RENEWALS = [
  { id: "REN-8831", account: "Apex Secure Networks", arr: 84500, closeDate: "Sep 14, 2026", term: "12mo", owner: "Marcus T.", window: "90-day",
    riskScore: 22, reasons: ["Meeting held 12 days ago", "No open tickets", "Usage stable"], lastMeeting: "12 days ago", openTickets: 0, payment: "Current", usage: "Stable", escalationStage: null, createdAt: "2026-06-10 09:14:02", decision: "undecided" },
  { id: "REN-8843", account: "Northstar Managed Services", arr: 128000, closeDate: "Mar 01, 2027", term: "36mo", owner: "Priya N.", window: "90-day",
    riskScore: 48, reasons: ["Two invoices over 30 days past due", "Sev-2 ticket open 5 days"], lastMeeting: "28 days ago", openTickets: 1, payment: "2 overdue", usage: "Growing", escalationStage: null, createdAt: "2026-03-01 15:02:11", decision: "undecided" },
  { id: "REN-8850", account: "BluePeak Technologies", arr: 52000, closeDate: "Nov 02, 2026", term: "12mo", owner: "Daniel R.", window: "60-day",
    riskScore: 72, reasons: ["No customer meeting in 63 days", "2 unresolved support tickets", "Low product utilization", "No renewal activity recorded"],
    lastMeeting: "63 days ago", openTickets: 2, payment: "Current", usage: "Low utilization", escalationStage: "am", createdAt: "2025-11-02 11:40:55", decision: "undecided" },
  { id: "REN-8790", account: "Meridian Health Systems", arr: 143000, closeDate: "Jan 20, 2027", term: "24mo", owner: "Ananya S.", window: "90-day",
    riskScore: 55, reasons: ["Overdue invoice 42 days", "Sev-2 ticket open"], lastMeeting: "34 days ago", openTickets: 2, payment: "Overdue", usage: "Growing", escalationStage: null, createdAt: "2025-12-01 08:10:00", decision: "undecided" },
];

export const INITIAL_APPLICATIONS = [
  { id: "APP-301", name: "Cascade IT Distribution", track: "Distributor", status: "cleared", confidence: 91, tier: "Gold", schedule: "Distributor-Gold-2026", conflict: false,
    fields: { "Geography": "Pacific Northwest", "Customer base": "Wholesale only, no end-customer sales", "Sales model": "Volume / price / distribution", "Expected volume": "Tier 2 (mid-volume)" },
    reasons: ["Wholesale-only sales model", "No direct end-customer relationships", "Distribution-scale volume expectations"], decision: "undecided" },
  { id: "APP-302", name: "Summit Managed Services", track: "Reseller / MSP", status: "exception", confidence: 94, tier: "Silver", schedule: "Reseller-Silver-2026", conflict: true,
    fields: { "Geography": "Texas, Oklahoma", "Customer base": "~40 SMB accounts", "Sales model": "Direct end-customer selling", "Services offered": "Managed services + technical support", "Expected volume": "Tier 3" },
    reasons: ["Direct end-customer selling", "Managed services capability", "Dedicated technical support team", "Customer-facing sales organization"],
    gap: "Potential existing relationship detected — a contact at Summit Managed Services already appears under an existing distributor's downstream account list.", decision: "undecided" },
  { id: "APP-303", name: "Ridgeline Networks", track: "Reseller / MSP", status: "pending", confidence: 77, tier: "Bronze", schedule: "Reseller-Bronze-2026", conflict: false,
    fields: { "Geography": "Colorado", "Customer base": "~12 SMB accounts", "Sales model": "Direct end-customer selling", "Services offered": "Resale only, no managed services" },
    reasons: ["Direct end-customer selling", "No managed services capability yet — lower confidence fit for Silver"], decision: "undecided" },
];

export const INITIAL_UPSELLS = [
  { id: "UP-501", account: "Northstar Managed Services", owned: ["Firebox M590", "Endpoint Security"], recommended: "Endpoint Security (expanded coverage)",
    signal: "Customer acquired another company (Vantage IT Group) — headcount up ~40%", gap: "Additional Endpoint Security licenses required for the expanded footprint",
    uplift: 32000, fitScore: 91, trend: [40, 44, 42, 55, 60, 58, 66], analyzed: false, status: "pending", decision: "undecided" },
  { id: "UP-502", account: "Meridian Health Systems", owned: ["Firebox M590", "Endpoint Security", "DNSWatch"], recommended: "Backup",
    signal: "Endpoint utilization increased 31% over the last 90 days", gap: "No Backup module attached despite growing endpoint footprint",
    uplift: 16400, fitScore: 74, trend: [30, 33, 38, 41, 47, 52, 58], analyzed: false, status: "pending", decision: "undecided" },
  { id: "UP-503", account: "Apex Secure Networks", owned: ["Firebox M590", "Backup"], recommended: "Secure Wi-Fi",
    signal: "New office location added this quarter", gap: "No wireless security coverage at the new site",
    uplift: 9200, fitScore: 61, trend: [20, 24, 22, 26, 28, 27, 30], analyzed: false, status: "pending", decision: "undecided" },
];

export const INITIAL_REPS = [
  { id: "REP-01", name: "Priya N.", role: "AM", pipeline: "$412K", conversion: 26, target: 25, dealValuePct: 96, gap: "cleared",
    trend: [24, 25, 25, 26, 26, 25, 26], diagnostics: ["Performance in line with target across all stages."], coachStatus: null, decision: "undecided" },
  { id: "REP-02", name: "Daniel R.", role: "NCA", pipeline: "$588K", conversion: 34, target: 27, dealValuePct: 124, gap: "cleared",
    trend: [26, 28, 30, 31, 32, 33, 34], diagnostics: ["Exceeded quota by 24% this quarter.", "Strong proposal-to-close conversion, above team average."],
    recognitionCandidate: true, coachStatus: null, decision: "undecided" },
  { id: "REP-03", name: "Marcus T.", role: "AM", pipeline: "$340K", conversion: 24, target: 25, dealValuePct: 101, gap: "cleared",
    trend: [24, 22, 21, 20, 23, 24, 24], diagnostics: ["Slightly below target but deal value on track."], coachStatus: null, decision: "undecided" },
  { id: "REP-04", name: "Ananya S.", role: "NCA", pipeline: "$298K", conversion: 18, target: 28, dealValuePct: 64, gap: "exception",
    trend: [24, 22, 21, 19, 18, 18, 18],
    diagnostics: ["Low proposal-to-negotiation conversion (34% vs. team average 58%)", "Opportunities aging 22 days longer than target", "Follow-up activity 40% below peer average", "Pipeline creation is strong — not a top-of-funnel problem"],
    coachingFocus: "Proposal-to-negotiation conversion", playbook: "Proposal Qualification Coaching", analyzed: false, coachStatus: null, decision: "undecided" },
];

export const INITIAL_APPROVALS = [
  { id: "APR-1", agent: "Deal Guardrail", recordId: "WG-10482", summary: "Validation score 82% — human review required, Northstar Managed Services", nav: { agent: 0, screen: 2 } },
  { id: "APR-2", agent: "Deal Guardrail", recordId: "WG-10499", summary: "Provisioning mismatch — Meridian Health Systems", nav: { agent: 0, screen: 2 } },
  { id: "APR-3", agent: "Partner Onboarding", recordId: "APP-302", summary: "Channel conflict flagged — Summit Managed Services", nav: { agent: 4, screen: 2 } },
  { id: "APR-4", agent: "Renewal Agent", recordId: "REN-8850", summary: "High risk of missed renewal — BluePeak Technologies", nav: { agent: 3, screen: 2 } },
  { id: "APR-5", agent: "Upsell Agent", recordId: "UP-501", summary: "Outreach draft ready — Northstar Managed Services", nav: { agent: 5, screen: 2 } },
  { id: "APR-6", agent: "Lead-to-Order Assistant", recordId: "OP-10492", summary: "Next-best-action ready — Meridian Health Systems", nav: { agent: 1, screen: 2 } },
];

export const INITIAL_AUDIT = [
  { ts: "13:42:18", agent: "Deal Guardrail", event: "Validation score 82% — human review", record: "WG-10482", action: "Approval Requested", actor: "Agent" },
  { ts: "13:41:52", agent: "Renewal Agent", event: "High risk detected", record: "REN-8850", action: "Escalation Path Opened", actor: "Agent" },
  { ts: "13:40:27", agent: "Upsell Agent", event: "Expansion signal detected", record: "UP-501", action: "Potential ARR $32,000", actor: "Agent" },
  { ts: "13:38:05", agent: "Deal Guardrail", event: "Auto-cleared — 97%", record: "WG-10488", action: "ERP/Billing Queue Updated", actor: "Agent" },
  { ts: "13:35:44", agent: "Partner Onboarding", event: "Channel conflict flagged", record: "APP-302", action: "Approval Requested", actor: "Agent" },
  { ts: "13:20:11", agent: "Lead-to-Order Assistant", event: "Next-best-action generated", record: "OP-10492", action: "Recommended: Schedule executive meeting", actor: "Agent" },
];

/* =========================================================================
   AGENT META
========================================================================= */
export const AGENT_META = [
  { key: "a1", icon: ShieldCheck, name: "Deal Guardrail & Order Validation", priority: "High", complexity: "Medium-High", hitl: true,
    trigger: "Triggers automatically on every closed-won deal — confidence ≥ 90% auto-approves, below that goes to Sales Ops.",
    systems: ["CRM", "Finance Rules", "Contract Rules", "Product Rules", "Provisioning", "ERP/Billing"] },
  { key: "a2", icon: MessageSquareText, name: "NCA Lead-to-Order Assistant", priority: "High", complexity: "Medium-High", hitl: true,
    trigger: "Goal isn't 'next CRM stage' — it's closing the deal faster, with reasoning behind every recommendation.",
    systems: ["CRM", "CPQ", "Historical Opportunity Data"] },
  { key: "a3", icon: PhoneCall, name: "AM Account Context & Post-Call Action", priority: "High", complexity: "High", hitl: false,
    trigger: "An AI Account Manager copilot — unifies ERP, usage, tickets, sentiment and signals before every call.",
    systems: ["ERP", "CRM", "Entitlement System", "Ticketing", "Calendar", "Email"] },
  { key: "a4", icon: RefreshCw, name: "Renewal Risk & Retention Agent", priority: "High", complexity: "Medium-High", hitl: true,
    trigger: "Creating the renewal record is plain automation — the intelligence is catching the ones about to fall through the cracks.",
    systems: ["CRM", "Contract/Billing System", "Ticketing", "Usage Telemetry"] },
  { key: "a5", icon: Users, name: "Distributor & Reseller Onboarding", priority: "Medium", complexity: "Medium", hitl: true,
    trigger: "Classifies distributor vs. reseller/MSP and checks for channel conflict before provisioning.",
    systems: ["PRM Portal", "CRM"] },
  { key: "a6", icon: TrendingUp, name: "AM Cross-Sell / Upsell Creation", priority: "Medium", complexity: "Medium", hitl: true,
    trigger: "Customer need → product gap → revenue opportunity — driven by a real signal, not a random suggestion.",
    systems: ["CRM", "Product Entitlement", "Email"] },
  { key: "a7", icon: Gauge, name: "Rep Performance & Coaching Trigger", priority: "Medium", complexity: "Medium", hitl: true,
    trigger: "Doesn't stop at 'below target' — diagnoses why, and recommends the specific coaching focus.",
    systems: ["CRM", "Activity Tracking", "HRIS"] },
];
export const AGENT_SCREEN_LABELS = [
  ["Deal Validation Queue", "Deal Detail", "Sales Ops Approval"],
  ["Opportunity Co-Pilot", "Opportunity Journey", "Next Best Action"],
  ["Customer 360 Brief", "Meeting / Call Capture", "Post-Call Action Center"],
  ["Renewal Command Center", "Renewal Risk Detail", "Escalation & Recovery"],
  ["Partner Application", "AI Partner Classification", "Partner Approval"],
  ["Expansion Opportunity Map", "Account Product Gap", "Opportunity + Outreach"],
  ["Rep Performance Command Center", "Rep Performance Diagnostic", "Coaching / Recognition"],
];
