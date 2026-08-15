import React from "react";
import { Mic, Check } from "lucide-react";
import { DISPLAY } from "../../lib/constants";
import { ACCOUNTS } from "../../lib/seedData";
import {
  Pill, Card, Field, SectionLabel, Sparkline, ExecutionTrace, RunAgentButton, ActionButton,
} from "../shared";

/* =========================================================================
   AGENT 3 — AM Account Context & Post-Call Action
   (hitl: false in AGENT_META — autonomous execution, no approve/pending/
   reject decision here; "Approve All" just confirms the agent's own actions.)
========================================================================= */
export function A3Screen1({ analyzed, runId, onRun, onDone }) {
  const acct = ACCOUNTS["Meridian Health Systems"];
  const steps = ["OBSERVE — Upcoming call: Meridian Health Systems, 2:30 PM", "Fetching ERP invoice/payment status...", "Fetching product usage telemetry...", "Fetching open support tickets...", "Fetching recent emails & meeting history...", "REASON — Cross-referencing entitlement, sentiment and risk signals...", "DECIDE — Briefing assembled, 5 talking points generated"];
  return (
    <div className="max-w-3xl">
      <div className="mb-4"><div className="text-xs text-[#9599AC] mb-1">Upcoming call · 2:30 PM</div><div className="text-lg font-bold text-[#12172B]" style={{ fontFamily: DISPLAY }}>Customer 360 Brief — <Field kind="account" id="Meridian Health Systems">Meridian Health Systems</Field></div></div>
      {!analyzed && <RunAgentButton onClick={onRun} label="Assemble Customer 360" />}
      <ExecutionTrace triggerKey={runId} steps={steps} onDone={onDone} doneLabel="Briefing ready" />
      {analyzed && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card className="p-4"><SectionLabel>Invoice / Payment</SectionLabel><Pill tone="escalated">{acct.invoiceStatus}</Pill><div className="text-xs text-[#8A90A6] mt-2">DSO {acct.dso} days</div></Card>
            <Card className="p-4"><SectionLabel>Usage trend (90d)</SectionLabel><Sparkline data={[45, 48, 44, 52, 58, 61, 65]} /></Card>
            <Card className="p-4"><SectionLabel>Open tickets</SectionLabel><div className="text-2xl font-bold" style={{ fontFamily: DISPLAY }}>{acct.tickets.length}</div><div className="text-xs text-[#8A90A6]"><Field kind="ticket" id={`Meridian Health Systems::${acct.tickets[0].id}`}>{acct.tickets[0].sev} — {acct.tickets[0].desc}</Field></div></Card>
            <Card className="p-4"><SectionLabel>Contract</SectionLabel><div className="text-sm">{acct.term} · renews <Field kind="renewal" id="REN-8790">{acct.renewal}</Field></div></Card>
            <Card className="p-4"><SectionLabel>Sentiment</SectionLabel><div className="text-sm">{acct.sentiment}</div></Card>
            <Card className="p-4"><SectionLabel>Recent interaction</SectionLabel><div className="text-sm">{acct.recentInteraction}</div></Card>
          </div>
          <Card className="p-4" style={{ borderColor: "#C7D2FE" }}>
            <SectionLabel>What should I talk about?</SectionLabel>
            <ul className="text-sm text-[#12172B] list-decimal pl-4 space-y-1">
              <li>Invoice overdue by 42 days — worth addressing early in the call.</li>
              <li>Endpoint utilization increased 31% — possible expansion signal.</li>
              <li>One Sev-2 support ticket remains open (database performance).</li>
              <li>Recent email suggests a subsidiary acquisition — confirm and ask about licensing needs.</li>
              <li>AuthPoint adoption remains low relative to similar accounts.</li>
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
export function A3Screen2({ analyzed }) {
  if (!analyzed) return <div className="text-sm text-[#8A90A6]">Assemble the Customer 360 brief first (previous tab) before logging notes.</div>;
  return (
    <Card className="p-5 max-w-xl">
      <SectionLabel>Meeting / Call Capture</SectionLabel>
      <div className="flex items-center gap-2 mb-3 text-xs text-[#8A90A6]"><Mic size={13} /> Voice-to-text active</div>
      <textarea defaultValue="Customer mentioned database performance issues and an upcoming acquisition — they'll need more licenses for the new subsidiary's team." className="w-full text-sm border border-[#DCDEE8] rounded-lg p-3 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30" rows={4} />
      <div className="rounded-lg p-3 bg-[#EEF0FF] border border-[#C7D2FE] text-sm text-[#33359E]">Agent extracted 3 action items with owners — see next tab</div>
    </Card>
  );
}
export function A3Screen3({ analyzed, dispatch, done }) {
  if (!analyzed) return <div className="text-sm text-[#8A90A6]">No call notes captured yet.</div>;
  const items = [
    { action: "Escalate database performance issue", owner: "Solution Architect", priority: "High", due: "Tomorrow", source: "Call notes", system: "Ticketing" },
    { action: "Prepare additional licensing proposal", owner: "Account Manager", priority: "Medium", due: "This week", source: "Call notes", system: "CRM Opportunity" },
    { action: "Schedule technical workshop", owner: "Solutions Engineering", priority: "Medium", due: "Next 2 weeks", source: "Call notes", system: "Calendar" },
  ];
  return (
    <Card className="p-5 max-w-2xl">
      <SectionLabel>Post-Call Action Center</SectionLabel>
      <div className="space-y-2 mb-4">
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#EDEEF4] bg-[#FAFAFD] text-sm">
            <div className="flex-1"><div className="font-medium text-[#12172B]">{it.action}</div><div className="text-xs text-[#8A90A6]">Owner: {it.owner} · Due: {it.due} · → {it.system}</div></div>
            <Pill tone={it.priority === "High" ? "escalated" : "pending"}>{it.priority}</Pill>
            {done && <Check size={14} color="#059669" />}
          </div>
        ))}
      </div>
      {done ? <Pill tone="approved">All actions approved</Pill> : <ActionButton tone="primary" icon={Check} onClick={() => dispatch({ type: "POST_CALL_APPROVE", account: "Meridian Health Systems" })}>Approve All</ActionButton>}
    </Card>
  );
}
