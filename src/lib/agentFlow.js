// Drives the "Agent Status" side panel — a Trigger → Observe → Reason →
// Decide → Human Approval → Act pipeline view for whichever agent screen is
// currently open. Every branch is derived from the same live signals the
// screens themselves use (App.jsx's per-agent selection/result state plus
// the current screenIdx), never from fabricated/hardcoded record data.
function genericFlow(screenIdx, trigger, acted) {
  return {
    trigger,
    steps: [
      { label: "Trigger", note: trigger, status: "done" },
      { label: "Observe", note: "Screen 1 data loaded from the backend", status: "done" },
      { label: "Reason", note: "Detail reviewed", status: screenIdx >= 1 ? "done" : "current" },
      { label: "Decide", note: "Recommendation reviewed", status: screenIdx >= 1 ? "done" : "pending" },
      { label: "Human Approval", note: acted ? "Decision recorded" : "Awaiting your decision", status: acted ? "done" : screenIdx === 2 ? "current" : "pending" },
      { label: "Act", note: acted || "Awaiting a real decision", status: acted ? "done" : "pending" },
    ],
    summary: acted || (screenIdx === 2 ? "Awaiting your decision" : screenIdx === 1 ? "Reviewing detail" : "Browsing the queue"),
    tone: acted ? "approved" : "pending",
  };
}

export function getFlowStatus(view, screenIdx, ctx) {
  const {
    agent1DealId, agent1Acted, agent2Acted, agent3Pending, agent3Submitted,
    agent4RenewalId, agent4Acted, agent5Acted, agent6Result, agent7Acted,
  } = ctx;

  if (view === 0) {
    const selected = !!agent1DealId;
    return {
      trigger: "Deal enters the validation queue (CRM)",
      steps: [
        { label: "Trigger", note: "Closed-won deal lands in the queue", status: "done" },
        { label: "Observe", note: "Deal queue loaded from the backend", status: "done" },
        { label: "Reason", note: selected ? "Deal selected for detail review" : "Awaiting deal selection", status: selected ? "done" : screenIdx >= 1 ? "current" : "pending" },
        { label: "Decide", note: selected ? "Rules engine + confidence score computed" : "Pending deal selection", status: screenIdx >= 1 && selected ? "done" : "pending" },
        { label: "Human Approval", note: agent1Acted ? "Decision recorded" : "Sales Ops review", status: agent1Acted ? "done" : screenIdx === 2 ? "current" : "pending" },
        { label: "Act", note: agent1Acted || "Awaiting a real decision", status: agent1Acted ? "done" : "pending" },
      ],
      summary: agent1Acted || (screenIdx === 2 ? "Awaiting Sales Ops decision" : selected ? "Reviewing deal detail" : "Browsing the validation queue"),
      tone: agent1Acted ? "approved" : "pending",
    };
  }

  if (view === 2) {
    const pendingCount = agent3Pending.length;
    const submittedCount = agent3Submitted.length;
    return {
      trigger: "Upcoming customer call on calendar",
      steps: [
        { label: "Trigger", note: "Upcoming call selected", status: "done" },
        { label: "Observe", note: "ERP, CRM, tickets pulled for briefing", status: "done" },
        { label: "Reason", note: "Call notes captured & actions extracted", status: pendingCount > 0 || submittedCount > 0 ? "done" : screenIdx >= 1 ? "current" : "pending" },
        { label: "Decide", note: pendingCount > 0 ? `${pendingCount} action batch(es) awaiting approval` : "No actions extracted yet", status: pendingCount > 0 || submittedCount > 0 ? "done" : "pending" },
        { label: "Human Approval", note: pendingCount > 0 ? "AM review of extracted actions" : "—", status: pendingCount > 0 ? "current" : submittedCount > 0 ? "done" : "pending" },
        { label: "Act", note: submittedCount > 0 ? `${submittedCount} batch(es) written to the CRM log` : "Awaiting approval", status: submittedCount > 0 ? "done" : "pending" },
      ],
      summary: submittedCount > 0 ? `${submittedCount} batch(es) submitted this session` : pendingCount > 0 ? `${pendingCount} batch(es) awaiting approval` : "No call captured yet",
      tone: submittedCount > 0 ? "approved" : pendingCount > 0 ? "exception" : "pending",
    };
  }

  if (view === 3) {
    const selected = !!agent4RenewalId;
    return {
      trigger: "Renewal risk threshold crossed",
      steps: [
        { label: "Trigger", note: "Renewal backlog computed", status: "done" },
        { label: "Observe", note: "Meetings, tickets, usage pulled", status: "done" },
        { label: "Reason", note: selected ? "Risk factors weighed for the selected renewal" : "Awaiting renewal selection", status: selected ? "done" : screenIdx >= 1 ? "current" : "pending" },
        { label: "Decide", note: selected ? "Risk score + proactive suggestions computed" : "Pending selection", status: selected ? "done" : "pending" },
        { label: "Human Approval", note: agent4Acted ? "Decision recorded" : "AM / manager escalation choice", status: agent4Acted ? "done" : screenIdx === 2 ? "current" : "pending" },
        { label: "Act", note: agent4Acted || "Awaiting a real escalation or activity log", status: agent4Acted ? "done" : "pending" },
      ],
      summary: agent4Acted || (screenIdx === 2 ? "Reviewing escalation options" : selected ? "Reviewing renewal risk" : "Browsing the backlog"),
      tone: agent4Acted ? "approved" : "pending",
    };
  }

  if (view === 5) {
    const r = agent6Result;
    const skipped = !!(r && r.skipped);
    const decided = !!(r && r.status && r.status !== "proposed");
    // A skip is a terminal, complete outcome (no signal → nothing to review
    // or act on) — the pipeline should read as finished, not stuck pending.
    return {
      trigger: "Detected signal on account scan",
      steps: [
        { label: "Trigger", note: "Signal-eligible account selected", status: "done" },
        { label: "Observe", note: "Entitlement vs. catalog compared", status: r ? "done" : screenIdx >= 1 ? "current" : "pending" },
        { label: "Reason", note: r ? (skipped ? "No detected signal on file for this account" : "Signal + product fit evaluated") : "Pending agent run", status: r ? "done" : "pending" },
        { label: "Decide", note: r ? (skipped ? "No opportunity recommended" : `Recommend ${r.recommended_product || "—"}`) : "Pending analysis", status: r ? "done" : "pending" },
        { label: "Human Approval", note: skipped ? "Not applicable — no opportunity to review" : "AM review of outreach", status: skipped ? "done" : !r ? "pending" : decided ? "done" : "current" },
        { label: "Act", note: skipped ? "No action taken — nothing to act on" : decided ? (r.status === "approved" ? "Opportunity created + outreach sent" : r.status === "discard" ? "Discarded" : "Held for edit") : "Awaiting AM approval", status: skipped ? "done" : decided ? "done" : "pending" },
      ],
      summary: !r ? "No opportunity generated yet" : skipped ? "Agent declined — no signal-backed opportunity" : decided ? `Resolved — ${r.status}` : "Waiting for AM approval",
      tone: !r ? "pending" : skipped ? "exception" : decided ? "approved" : "exception",
    };
  }

  if (view === 1) return genericFlow(screenIdx, "Opportunity aging in the pipeline", agent2Acted);
  if (view === 4) return genericFlow(screenIdx, "New partner application submitted", agent5Acted);
  if (view === 6) return genericFlow(screenIdx, "Performance review cycle", agent7Acted);
  return null;
}
