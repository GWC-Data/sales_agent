import React from "react";
import { ChevronRight } from "lucide-react";
import { DISPLAY } from "../../lib/constants";
import { Pill, Mono, Card, Field, SectionLabel, MetricRow, ApprovalPanel } from "../shared";

/* =========================================================================
   AGENT 4 — Renewal Risk & Retention Agent
========================================================================= */
export function A4Screen1({ renewals }) {
  const windows = { "90-day": [], "60-day": [], "30-day": [] };
  renewals.forEach((r) => (windows[r.window] || (windows[r.window] = [])).push(r));
  const total = renewals.reduce((s, r) => s + r.arr, 0);
  const atRisk = renewals.filter((r) => r.riskScore >= 60).length;
  return (
    <div>
      <MetricRow metrics={[
        { label: "Total renewal ARR", value: `$${(total / 1000).toFixed(0)}K` },
        { label: "At-risk renewals", value: String(atRisk) },
        { label: "Due in 90 days", value: String(renewals.filter((r) => r.window === "90-day").length) },
        { label: "Due in 30–60 days", value: String(renewals.filter((r) => r.window !== "90-day").length) },
      ]} />
      <SectionLabel>Renewal Command Center</SectionLabel>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(windows).map(([w, cards]) => (
          <div key={w}>
            <div className="text-xs font-semibold text-[#8A90A6] mb-2 uppercase">{w} window</div>
            <div className="space-y-2">
              {cards.map((c) => (
                <Card key={c.id} className="p-3">
                  <div className="flex items-center justify-between"><div className="text-sm font-semibold text-[#12172B]"><Field kind="renewal" id={c.id}>{c.account}</Field></div><Pill tone={c.riskScore >= 60 ? "high" : c.riskScore >= 35 ? "medium" : "low"}>{c.riskScore}</Pill></div>
                  <div className="flex justify-between mt-1 text-xs text-[#8A90A6]"><span>ARR ${(c.arr / 1000).toFixed(0)}K</span><span>{c.closeDate}</span></div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export function A4Screen2({ renewals }) {
  const r = renewals.find((x) => x.id === "REN-8850");
  return (
    <Card className="p-5 max-w-2xl">
      <div className="flex items-start justify-between mb-4">
        <div><div className="text-xs text-[#9599AC] mb-1"><Mono>{r.id}</Mono> · <Field kind="account" id={r.account}>{r.account}</Field></div><div className="text-lg font-bold text-[#12172B]" style={{ fontFamily: DISPLAY }}>Renewal Risk Detail</div></div>
        <div className="text-right"><div className="text-3xl font-bold" style={{ color: "#DC2626", fontFamily: DISPLAY }}>{r.riskScore}<span className="text-base text-[#B7BACC]">/100</span></div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold">Renewal Risk Score</div></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-5 text-sm">
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">ARR</div><div className="font-medium">${r.arr.toLocaleString()}</div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Renewal date</div><div className="font-medium">{r.closeDate}</div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Owner (AM)</div><div className="font-medium"><Field kind="rep" id={r.owner}>{r.owner}</Field></div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Last interaction</div><div className="font-medium">{r.lastMeeting}</div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Open tickets</div><div className="font-medium">{r.openTickets}</div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Payment status</div><div className="font-medium">{r.payment}</div></div>
      </div>
      <SectionLabel>Why this score</SectionLabel>
      <ul className="text-sm text-[#B45309] list-disc pl-4 space-y-1">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
    </Card>
  );
}
export function A4Screen3({ renewals, dispatch }) {
  const r = renewals.find((x) => x.id === "REN-8850");
  const stages = [{ k: "am", label: "AM" }, { k: "manager", label: "AM Manager" }, { k: "executive", label: "Executive" }];
  const stageIdx = stages.findIndex((s) => s.k === r.escalationStage);
  return (
    <Card className="p-5 max-w-xl">
      <SectionLabel>Escalation &amp; Recovery — <Field kind="account" id={r.account}>{r.account}</Field></SectionLabel>
      <div className="rounded-lg p-3 bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B] mb-4">Renewal is at high risk of being missed.</div>
      <div className="flex items-center gap-2 mb-5">
        {stages.map((s, i) => (
          <React.Fragment key={s.k}>
            <div className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: i <= stageIdx ? "#4F46E5" : "#F0F1F6", color: i <= stageIdx ? "#fff" : "#9599AC" }}>{s.label}</div>
            {i < stages.length - 1 && <ChevronRight size={13} color="#C7CAD9" />}
          </React.Fragment>
        ))}
      </div>
      <ApprovalPanel
        decision={r.decision}
        approveLabel="Resolve (Notify + Follow-up Task)"
        pendingLabel="Recommend Customer Meeting"
        rejectLabel="Escalate to AM Manager"
        onApprove={() => dispatch({ type: "RENEWAL_RECOVERY", id: r.id, kind: "task", decision: "approved" })}
        onPending={() => dispatch({ type: "RENEWAL_RECOVERY", id: r.id, kind: "meeting", decision: "pending" })}
        onReject={() => dispatch({ type: "RENEWAL_RECOVERY", id: r.id, kind: "escalate_manager", decision: "rejected" })}
      />
    </Card>
  );
}
