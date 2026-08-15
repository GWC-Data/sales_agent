import React from "react";
import { ClipboardList, Play } from "lucide-react";
import { DISPLAY } from "../lib/constants";
import { AGENT_META } from "../lib/seedData";
import { Card, Mono, Field, SectionLabel, MetricRow, HitlBadge, inferKind, agentHealth } from "./shared";

export function Overview({ state, goTo, onRunDemo, demoActive }) {
  const health = agentHealth(state);
  const backlogTotal = state.renewals.reduce((s, r) => s + r.arr, 0);
  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div><h1 className="text-2xl font-bold text-[#12172B]" style={{ fontFamily: DISPLAY }}>Executive Command Center</h1><p className="text-sm text-[#6B7280] mt-1">CRM → Sales Ops → Finance → ERP/Billing → Provisioning → PRM → AM → Renewal → Performance — one operating layer.</p></div>
        <button onClick={onRunDemo} disabled={demoActive} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-transform active:scale-[0.97] disabled:opacity-60" style={{ background: "linear-gradient(135deg,#4F46E5,#6D28D9)" }}><Play size={14} fill="white" /> {demoActive ? "Demo running…" : "Run Live Demo"}</button>
      </div>
      <MetricRow metrics={[
        { label: "Deals validated today", value: "128" }, { label: "Exceptions prevented", value: "12" },
        { label: "Renewal ARR protected", value: `$${(backlogTotal / 1000).toFixed(0)}K` }, { label: "Pending approvals", value: String(state.approvals.length) },
      ]} />
      <MetricRow metrics={[
        { label: "Partner applications processed", value: "18" }, { label: "Pipeline created (upsell)", value: "$57.6K" },
        { label: "Coaching interventions", value: String(state.reps.filter((r) => r.coachStatus === "coach").length) }, { label: "Opportunities accelerated", value: String(state.opps.filter((o) => o.decision !== "undecided").length) },
      ]} />
      <SectionLabel>Agent Health</SectionLabel>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {AGENT_META.map((a, i) => {
          const h = health.find((x) => x.key === a.key); const Icon = a.icon;
          return (
            <Card key={a.key} className="p-3.5 cursor-pointer hover:border-[#C7D2FE] transition-colors" onClick={() => goTo(i)}>
              <div className="flex items-center gap-2 mb-2"><Icon size={14} color="#4F46E5" /><span className="text-[12.5px] font-semibold text-[#12172B] leading-tight">{a.name}</span></div>
              <div className="mb-2"><HitlBadge hitl={a.hitl} /></div>
              <div className="flex gap-3 text-xs text-[#8A90A6]"><span>{h.waiting} waiting</span><span>{h.completed} completed</span></div>
            </Card>
          );
        })}
        <Card className="p-3.5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#C7D2FE]" onClick={() => goTo(-2)}>
          <ClipboardList size={18} color="#4F46E5" /><div className="text-xs font-semibold text-[#12172B] mt-1">{state.approvals.length} Pending Approvals</div><div className="text-[11px] text-[#8A90A6]">Open Approval Center</div>
        </Card>
      </div>
      <SectionLabel>Live Agent Activity</SectionLabel>
      <Card className="divide-y divide-[#F3F3F8]">
        {state.audit.slice(0, 6).map((e, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-2.5 text-sm">
            <Mono className="text-[11px] text-[#B7BACC] pt-0.5">{e.ts}</Mono>
            <div className="flex-1"><span className="font-semibold text-[#12172B]">{e.agent}</span> <span className="text-[#5B5F73]">{e.event.toLowerCase()}</span> · <Field kind={inferKind(e.record)} id={e.record} mono className="text-[#4F46E5]">{e.record}</Field><div className="text-xs text-[#9599AC]">{e.action}</div></div>
          </div>
        ))}
      </Card>
    </div>
  );
}
