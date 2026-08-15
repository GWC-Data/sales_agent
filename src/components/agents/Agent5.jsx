import React from "react";
import { Send, Check, AlertTriangle } from "lucide-react";
import { DISPLAY } from "../../lib/constants";
import { Card, Field, SectionLabel, Pill, ActionButton, RunAgentButton, ExecutionTrace, ApprovalPanel } from "../shared";

/* =========================================================================
   AGENT 5 — Distributor & Reseller Onboarding
========================================================================= */
export function A5Screen1() {
  return (
    <Card className="p-5 max-w-xl">
      <SectionLabel>Partner Application</SectionLabel>
      <div className="space-y-3 text-sm">
        <div><div className="text-xs font-semibold text-[#8A90A6] mb-1">Company</div><div className="border border-[#DCDEE8] rounded-lg px-3 py-2">Summit Managed Services</div></div>
        <div><div className="text-xs font-semibold text-[#8A90A6] mb-1">Geography</div><div className="border border-[#DCDEE8] rounded-lg px-3 py-2">Texas, Oklahoma</div></div>
        <div><div className="text-xs font-semibold text-[#8A90A6] mb-1">Sales model</div><div className="border border-[#DCDEE8] rounded-lg px-3 py-2">Direct end-customer selling</div></div>
        <div><div className="text-xs font-semibold text-[#8A90A6] mb-1">Services offered</div><div className="border border-[#DCDEE8] rounded-lg px-3 py-2">Managed services + technical support</div></div>
        <div><div className="text-xs font-semibold text-[#8A90A6] mb-1">Existing relationship</div><div className="border border-[#DCDEE8] rounded-lg px-3 py-2 text-[#8A90A6]">Unknown — agent will check</div></div>
      </div>
      <div className="mt-4"><ActionButton tone="primary" icon={Send}>Submit Application</ActionButton></div>
    </Card>
  );
}
export function A5Screen2({ applications, runId, onRun, onDone }) {
  const app = applications.find((a) => a.id === "APP-302");
  const steps = [`OBSERVE — Application ${app.id} submitted (${app.name})`, "Checking distributor vs. reseller/MSP criteria...", "REASON — Direct end-customer selling → track: Reseller/MSP", "Checking managed services & technical support capability...", "Searching existing partner relationships for conflicts...", { text: "Potential existing relationship found", warn: true }];
  return (
    <div>
      <SectionLabel right={!app.analyzed && <RunAgentButton onClick={onRun} label={`Run Agent — ${app.id}`} />}>AI Partner Classification — <Field kind="application" id={app.id}>{app.name}</Field></SectionLabel>
      <ExecutionTrace triggerKey={runId} steps={steps} onDone={onDone} />
      {app.analyzed && (
        <Card className="p-5 max-w-xl">
          <div className="flex items-center justify-between mb-3"><div className="text-sm text-[#8A90A6]">Recommended track</div><div className="text-lg font-bold text-[#4F46E5]" style={{ fontFamily: DISPLAY }}>{app.track}</div><Pill tone="pending">{app.confidence}% confidence</Pill></div>
          <SectionLabel>Reasons</SectionLabel>
          <ul className="text-sm text-[#12172B] space-y-1 mb-4">{app.reasons.map((r) => <li key={r} className="flex items-center gap-2"><Check size={13} color="#059669" />{r}</li>)}</ul>
          <SectionLabel>Channel Conflict Check</SectionLabel>
          {app.conflict ? <div className="rounded-lg p-3 bg-[#FFFBEB] border border-[#FDE68A] text-sm text-[#7A4B0A] flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5" />{app.gap}</div> : <div className="text-sm text-[#059669]">No conflicts found.</div>}
        </Card>
      )}
    </div>
  );
}
export function A5Screen3({ applications, dispatch }) {
  const app = applications.find((a) => a.id === "APP-302");
  return (
    <Card className="p-5 max-w-lg">
      <SectionLabel>Partner Approval — <Field kind="application" id={app.id}>{app.name}</Field></SectionLabel>
      <div className="text-sm text-[#5B5F73] mb-1">Track: {app.track} · Proposed tier: <b>{app.tier}</b> · Discount schedule: {app.schedule}</div>
      <div className="text-sm text-[#5B5F73] mb-4">PRM access level: Standard Partner Portal</div>
      <ApprovalPanel
        decision={app.decision}
        pendingLabel="Request More Info"
        resolvedTone={app.status}
        onApprove={() => dispatch({ type: "PARTNER_ACTION", id: app.id, kind: "approve" })}
        onPending={() => dispatch({ type: "PARTNER_ACTION", id: app.id, kind: "moreinfo" })}
        onReject={() => dispatch({ type: "PARTNER_ACTION", id: app.id, kind: "reject" })}
      />
    </Card>
  );
}
