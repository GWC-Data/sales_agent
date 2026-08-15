import React from "react";
import { ChevronRight, Check, X, MessageSquareText, Flame } from "lucide-react";
import { Card, Field, SectionLabel, ApprovalPanel } from "../shared";

/* =========================================================================
   AGENT 2 — NCA Lead-to-Order (Opportunity Co-Pilot)
========================================================================= */
export function A2Screen1({ opps }) {
  const sorted = [...opps].sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
  const top = sorted[0];
  return (
    <Card className="p-0 max-w-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#EDEEF4] flex items-center gap-2 bg-[#FAFAFD]"><MessageSquareText size={16} color="#4F46E5" /><span className="text-sm font-semibold text-[#12172B]">Opportunity Co-Pilot</span></div>
      <div className="p-4 space-y-3">
        <div className="flex justify-start"><div className="max-w-[90%] bg-[#F3F4FA] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-[#12172B]">You have {opps.length} active opportunities. Here's what I'd prioritize today.</div></div>
        {sorted.map((o) => (
          <div key={o.id} className={`border rounded-lg p-3 ${o.id === top.id ? "border-[#FDE68A] bg-[#FFFBEB]" : "border-[#EDEEF4] bg-[#FAFAFD]"}`}>
            <div className="flex items-center gap-2 mb-1">
              {o.id === top.id && <Flame size={13} color="#B45309" />}
              <span className="text-sm font-semibold text-[#12172B]"><Field kind="account" id={o.account}>{o.account}</Field></span>
              <Field kind="opportunity" id={o.id} mono className="text-[11px] text-[#9599AC]">{o.id}</Field>
              <span className="text-[11px] text-[#8A90A6] ml-auto">{o.stage} · {o.age}d</span>
            </div>
            <div className="text-xs text-[#8A90A6] mb-1">Last response: "{o.lastResponse}"</div>
            <div className="text-sm text-[#12172B]"><span className="font-semibold text-[#4F46E5]">Recommended:</span> {o.recommendedAction}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
export function A2Screen2({ opps }) {
  const o = opps.find((x) => x.id === "OP-10492");
  return (
    <Card className="p-6 max-w-2xl">
      <SectionLabel>Opportunity Journey — <Field kind="account" id={o.account}>{o.account}</Field> (<Field kind="opportunity" id={o.id}>{o.id}</Field>)</SectionLabel>
      <div className="flex items-center mt-2 mb-5 flex-wrap gap-y-3">
        {["Lead", "Opportunity", "Qualified", "Proposal", "Negotiation", "Contract", "Closed Won"].map((s, i) => {
          const stages = ["Lead", "Opportunity", "Qualified", "Proposal", "Negotiation", "Contract", "Closed Won"];
          const current = stages.indexOf(o.stage);
          return (
            <div key={s} className="flex items-center">
              <div className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ background: i < current ? "#4F46E5" : i === current ? "#EEF0FF" : "#F0F1F6", color: i <= current ? (i === current ? "#4F46E5" : "#fff") : "#B7BACC", border: i === current ? "1px solid #C7D2FE" : "none" }}>{s}</div>
              {i < stages.length - 1 && <ChevronRight size={12} color="#C7CAD9" className="mx-0.5" />}
            </div>
          );
        })}
      </div>
      <SectionLabel>Required for {o.stage}</SectionLabel>
      <div className="space-y-1.5 mb-4">
        {o.fields.map((f) => (
          <div key={f.label} className="flex items-center gap-2 text-sm">
            {f.ok ? <Check size={14} color="#059669" /> : <X size={14} color="#DC2626" />}
            <span className={f.ok ? "text-[#12172B]" : "text-[#B45309] font-medium"}>{f.label}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg p-3 bg-[#EEF0FF] border border-[#C7D2FE] text-sm text-[#33359E]">Agent recommendation: contact the customer to confirm decision-maker availability.</div>
    </Card>
  );
}
export function A2Screen3({ opps, dispatch }) {
  const o = opps.find((x) => x.id === "OP-10492");
  const otherActions = ["Send updated product information", "Send product catalog", "Generate proposal PDF", "Schedule technical demo", "Follow up with customer", "Update missing CRM fields"];
  return (
    <Card className="p-5 max-w-xl">
      <SectionLabel>Next Best Action — <Field kind="account" id={o.account}>{o.account}</Field></SectionLabel>
      <div className="text-sm font-semibold text-[#12172B] mb-1">Recommended: {o.recommendedAction}</div>
      <div className="text-sm text-[#5B5F73] mb-4">{o.reason}</div>
      <div className="mb-4">
        <ApprovalPanel
          decision={o.decision}
          approveLabel="Approve"
          pendingLabel="Modify Later"
          rejectLabel="Reject"
          onApprove={() => dispatch({ type: "OPP_ACTION", id: o.id, kind: "approve" })}
          onPending={() => dispatch({ type: "OPP_ACTION", id: o.id, kind: "pending" })}
          onReject={() => dispatch({ type: "OPP_ACTION", id: o.id, kind: "reject" })}
        />
      </div>
      <SectionLabel>Other available actions</SectionLabel>
      <div className="flex flex-wrap gap-1.5">{otherActions.map((a) => <span key={a} className="px-2.5 py-1 rounded-md text-xs bg-[#F0F1F6] text-[#5B5F73]">{a}</span>)}</div>
    </Card>
  );
}
