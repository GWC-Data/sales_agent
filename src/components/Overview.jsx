import React from "react";
import { ClipboardList, Play } from "lucide-react";
import { DISPLAY } from "../lib/constants";
import { AGENT_META } from "../lib/seedData";
import { Card, Mono, Field, SectionLabel, KpiRow, HitlBadge, inferKind, agentHealth } from "./shared";

// Stable (not re-randomized per render) filler trend for KPIs with no real
// historical series behind them yet — seeded by label so each tile's
// sparkline stays put across re-renders instead of jittering.
function pseudoTrend(seed, points = 8) {
  let x = String(seed).split("").reduce((acc, c) => acc + c.charCodeAt(0), 7);
  const rand = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  let v = 40 + rand() * 20;
  const out = [];
  for (let i = 0; i < points; i++) { v = Math.max(5, v + (rand() - 0.5) * 20); out.push(Math.round(v)); }
  return out;
}

export function Overview({ state, goTo, onRunDemo, demoActive }) {
  const health = agentHealth(state);
  const backlogTotal = state.renewals.reduce((s, r) => s + r.arr, 0);
  const healthyRenewalRatio = state.renewals.length ? state.renewals.filter((r) => r.riskScore < 35).length / state.renewals.length : 0;
  const coachRatio = state.reps.length ? state.reps.filter((r) => r.coachStatus === "coach").length / state.reps.length : 0;
  const accelRatio = state.opps.length ? state.opps.filter((o) => o.decision !== "undecided").length / state.opps.length : 0;

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div><h1 className="text-2xl font-bold text-[#12172B]" style={{ fontFamily: DISPLAY }}>Executive Command Center</h1><p className="text-sm text-[#6B7280] mt-1">CRM &gt; Sales Ops &gt; Finance &gt; ERP/Billing &gt; Provisioning &gt; PRM &gt; AM &gt; Renewal &gt; Performance - one operating layer.</p></div>
        <button onClick={onRunDemo} disabled={demoActive} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-transform active:scale-[0.97] disabled:opacity-60 cursor-pointer" style={{ background: "linear-gradient(135deg,#4F46E5,#6D28D9)" }}><Play size={14} fill="white" /> {demoActive ? "running…" : "Run Live"}</button>
      </div>
      <KpiRow metrics={[
        { label: "Deals validated today", value: "128", chart: "area", data: pseudoTrend("deals"), tone: "pending" },
        { label: "Exceptions prevented", value: "12", chart: "area", data: pseudoTrend("exceptions"), tone: "approved" },
        { label: "Renewal ARR protected", value: `$${(backlogTotal / 1000).toFixed(0)}K`, sub: `${Math.round(healthyRenewalRatio * 100)}% of renewals healthy`, chart: "bar", ratio: healthyRenewalRatio, tone: "approved" },
        { label: "Pending approvals", value: String(state.approvals.length), chart: "area", data: pseudoTrend("approvals"), tone: "exception", onClick: () => goTo(-2) },
      ]} />
      <KpiRow metrics={[
        { label: "Partner applications processed", value: "18", chart: "area", data: pseudoTrend("partners"), tone: "pending" },
        { label: "Pipeline created (upsell)", value: "$57.6K", chart: "area", data: pseudoTrend("pipeline"), tone: "pending" },
        { label: "Coaching interventions", value: String(state.reps.filter((r) => r.coachStatus === "coach").length), sub: "of reps", chart: "bar", ratio: coachRatio, tone: "exception" },
        { label: "Opportunities accelerated", value: String(state.opps.filter((o) => o.decision !== "undecided").length), sub: "of open opportunities", chart: "bar", ratio: accelRatio, tone: "approved" },
      ]} />
      <SectionLabel>Agent Health</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
