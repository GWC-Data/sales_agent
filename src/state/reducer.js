import { nowTs } from "../lib/constants";
import {
  INITIAL_DEALS, INITIAL_OPPS, INITIAL_RENEWALS, INITIAL_APPLICATIONS,
  INITIAL_UPSELLS, INITIAL_REPS, INITIAL_APPROVALS, INITIAL_AUDIT,
} from "../lib/seedData";

export const initialState = {
  deals: INITIAL_DEALS, opps: INITIAL_OPPS, renewals: INITIAL_RENEWALS, applications: INITIAL_APPLICATIONS,
  upsells: INITIAL_UPSELLS, reps: INITIAL_REPS, approvals: INITIAL_APPROVALS, audit: INITIAL_AUDIT,
  analyzedAccounts: {},
  runTriggers: { a1: 0, a1fulfill: 0, a2: 0, a3: 0, a4: 0, a5: 0, a6: 0, a7: 0 },
};

/* Every human-in-the-loop agent's approval screen dispatches one of three
   decisions — approve / pending / reject — recorded uniformly on the record's
   `decision` field so <ApprovalPanel> can gate + render consistently. */
export function reducer(state, action) {
  switch (action.type) {
    case "TRIGGER_RUN":
      return { ...state, runTriggers: { ...state.runTriggers, [action.agent]: (state.runTriggers[action.agent] || 0) + 1 } };
    case "MARK_DEAL_ANALYZED":
      return { ...state, deals: state.deals.map((d) => (d.id === action.id ? { ...d, analyzed: true } : d)) };
    case "DEAL_ACTION": {
      const decisionMap = { approve: "approved", return: "pending", escalate: "rejected" };
      const label = action.kind === "approve" ? "approved" : action.kind === "return" ? "returned" : "escalated";
      const deals = state.deals.map((d) => (d.id === action.id ? { ...d, status: label, decision: decisionMap[action.kind] } : d));
      const approvals = state.approvals.filter((a) => a.recordId !== action.id);
      const audit = [{ ts: nowTs(), agent: "Deal Guardrail", record: action.id,
        event: action.kind === "approve" ? "Approved" : action.kind === "return" ? "Returned to Rep" : "Escalated to ERP/Product Team",
        action: action.kind === "approve" ? "Order Fulfillment Sequence Started" : action.kind === "return" ? "CRM Notification Sent to Rep" : "Escalation Ticket Created",
        actor: "You (Sales Ops)" }, ...state.audit];
      const runTriggers = action.kind === "approve" ? { ...state.runTriggers, a1fulfill: state.runTriggers.a1fulfill + 1 } : state.runTriggers;
      return { ...state, deals, approvals, audit, runTriggers };
    }
    case "OPP_ACTION": {
      const decisionMap = { approve: "approved", pending: "pending", reject: "rejected" };
      const eventMap = { approve: "Next-Best-Action Approved", pending: "Next-Best-Action Deferred", reject: "Next-Best-Action Rejected" };
      const opp = state.opps.find((o) => o.id === action.id);
      const opps = state.opps.map((o) => (o.id === action.id ? { ...o, decision: decisionMap[action.kind] } : o));
      const approvals = state.approvals.filter((a) => a.recordId !== action.id);
      const audit = [{ ts: nowTs(), agent: "Lead-to-Order Assistant", record: action.id, event: eventMap[action.kind],
        action: action.kind === "approve" ? opp.recommendedAction : action.kind === "reject" ? "No Action Taken" : "Awaiting Further Input",
        actor: "You (NCA)" }, ...state.audit];
      return { ...state, opps, approvals, audit };
    }
    case "MARK_ACCOUNT_ANALYZED":
      return { ...state, analyzedAccounts: { ...state.analyzedAccounts, [action.account]: true } };
    case "POST_CALL_APPROVE": {
      const audit = [
        { ts: nowTs(), agent: "Account Context Agent", record: action.account, event: "Task Created", action: "Escalate database performance issue → Solution Architect", actor: "You (AM)" },
        { ts: nowTs(), agent: "Account Context Agent", record: action.account, event: "Opportunity Created", action: "Additional licensing proposal → Account Manager", actor: "You (AM)" },
        { ts: nowTs(), agent: "Account Context Agent", record: action.account, event: "Meeting Scheduled", action: "Technical workshop → Solutions Engineering", actor: "You (AM)" },
        ...state.audit,
      ];
      return { ...state, audit };
    }
    case "MARK_APP_ANALYZED":
      return { ...state, applications: state.applications.map((a) => (a.id === action.id ? { ...a, analyzed: true } : a)) };
    case "PARTNER_ACTION": {
      const decisionMap = { approve: "approved", reject: "rejected", moreinfo: "pending" };
      const label = action.kind === "approve" ? "approved" : action.kind === "reject" ? "rejected" : "moreinfo";
      const applications = state.applications.map((a) => (a.id === action.id ? { ...a, status: label, decision: decisionMap[action.kind] } : a));
      const approvals = state.approvals.filter((a) => a.recordId !== action.id);
      const audit = [{ ts: nowTs(), agent: "Partner Onboarding", record: action.id,
        event: action.kind === "approve" ? "Approved into Track/Tier" : action.kind === "reject" ? "Application Rejected" : "More Info Requested",
        action: action.kind === "approve" ? "Provisioned into PRM Portal" : action.kind === "reject" ? "Application Closed" : "Notification Sent to Applicant",
        actor: "You (Channel Manager)" }, ...state.audit];
      return { ...state, applications, approvals, audit };
    }
    case "MARK_UPSELL_ANALYZED":
      return { ...state, upsells: state.upsells.map((u) => (u.id === action.id ? { ...u, analyzed: true } : u)) };
    case "UPSELL_ACTION": {
      const labelMap = { send: "sent", discard: "discarded", hold: "pending" };
      const decisionMap = { send: "approved", discard: "rejected", hold: "pending" };
      const eventMap = { send: "Opportunity Created + Outreach Sent", discard: "Recommendation Discarded", hold: "Held for Edit" };
      const actionMap = { send: "CRM Opportunity Created + Email Sent", discard: "No Action Taken", hold: "Awaiting Manual Edit" };
      const upsells = state.upsells.map((u) => (u.id === action.id ? { ...u, status: labelMap[action.kind], decision: decisionMap[action.kind] } : u));
      const approvals = state.approvals.filter((a) => a.recordId !== action.id);
      const audit = [{ ts: nowTs(), agent: "Upsell Agent", record: action.id, event: eventMap[action.kind], action: actionMap[action.kind], actor: "You (AM)" }, ...state.audit];
      return { ...state, upsells, approvals, audit };
    }
    case "MARK_REP_ANALYZED":
      return { ...state, reps: state.reps.map((r) => (r.id === action.id ? { ...r, analyzed: true } : r)) };
    case "REP_ACTION": {
      const decisionMap = { coach: "approved", recognize: "approved", dismiss: "rejected", defer: "pending" };
      const labelMap = { coach: "Coaching Task Created", recognize: "Recognition Nominated", dismiss: "Dismissed", defer: "Deferred for Review" };
      const actionMap = { coach: "Routed to Manager", recognize: "Routed to SLT for Review", dismiss: "No Action Taken", defer: "Snoozed — Revisit Next Cycle" };
      const reps = state.reps.map((r) => (r.id === action.id ? { ...r, coachStatus: action.kind, decision: decisionMap[action.kind] } : r));
      const approvals = state.approvals.filter((a) => a.recordId !== action.id);
      const audit = [{ ts: nowTs(), agent: "Coaching Agent", record: action.id, event: labelMap[action.kind], action: actionMap[action.kind], actor: "You" }, ...state.audit];
      return { ...state, reps, approvals, audit };
    }
    case "RENEWAL_RECOVERY": {
      const isEscalation = action.kind === "escalate_manager" || action.kind === "escalate_exec";
      const renewals = state.renewals.map((r) => (r.id === action.id ? {
        ...r,
        escalationStage: isEscalation ? (action.kind === "escalate_manager" ? "manager" : "executive") : r.escalationStage,
        decision: action.decision || r.decision,
      } : r));
      const labels = { notify: "AM Notified", task: "Follow-up Task Created", meeting: "Customer Meeting Recommended", briefing: "Renewal Briefing Generated", escalate_manager: "Escalated to AM Manager", escalate_exec: "Escalated to Executive Sponsor" };
      const approvals = state.approvals.filter((a) => a.recordId !== action.id);
      const audit = [{ ts: nowTs(), agent: "Renewal Agent", record: action.id, event: labels[action.kind], action: "Recovery Workflow Step", actor: "You" }, ...state.audit];
      return { ...state, renewals, approvals, audit };
    }
    default:
      return state;
  }
}
