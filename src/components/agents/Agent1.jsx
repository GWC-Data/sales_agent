import React from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { STATUS, DISPLAY } from "../../lib/constants";
import {
  Pill, Mono, Card, Field, SectionLabel, MetricRow, Table, ExecutionTrace,
  RunAgentButton, ScoreRing, ApprovalPanel,
} from "../shared";

/* =========================================================================
   AGENT 1 — Deal Guardrail & Order Validation
========================================================================= */
export function A1Screen1({ deals, runId, onRun, onDone }) {
  const flagship = deals.find((d) => d.id === "WG-10482");
  const avgScore = Math.round(deals.reduce((s, d) => s + d.validationScore, 0) / deals.length);
  const autoRate = Math.round((deals.filter((d) => d.validationScore >= 90).length / deals.length) * 100);
  const steps = [
    "Checking customer address...", "Checking country...", "Checking contract term...", "Checking quantity...", "Checking product configuration...",
    { text: "Checking billing quantity-ramp support...", warn: true }, "Checking provisioning compatibility...",
  ];
  return (
    <div>
      <MetricRow metrics={[
        { label: "Deals reviewed today", value: String(deals.length + 124) },
        { label: "Exception rate", value: `${Math.round((deals.filter((d) => d.validationScore < 90).length / deals.length) * 100)}%` },
        { label: "Auto-approval rate", value: `${autoRate}%` },
        { label: "Avg validation score", value: `${avgScore}%` },
      ]} />
      <SectionLabel right={!flagship.analyzed && <RunAgentButton onClick={onRun} label={`Run Live Validation Engine — ${flagship.id}`} />}>Deal Validation Queue</SectionLabel>
      <ExecutionTrace triggerKey={runId} steps={steps} onDone={onDone}
        scoreLabel={<ScoreRing score={flagship.validationScore} />} />
      <Table columns={["Deal ID", "Rep", "Account", "Config Summary", "Validation Score", "Fit Status", "Age"]}
        rows={deals.map((d) => ({ __id: d.id, __cells: [
          <Field kind="deal" id={d.id} mono>{d.id}</Field>, <Field kind="rep" id={d.rep}>{`${d.rep} (${d.repRole})`}</Field>, <Field kind="account" id={d.account}>{d.account}</Field>,
          <span className="text-[#5B5F73]">{d.product}</span>,
          <span className="font-semibold" style={{ color: d.validationScore >= 90 ? "#059669" : d.validationScore >= 75 ? "#B45309" : "#DC2626" }}>{d.validationScore}%</span>,
          <Pill tone={d.status}>{STATUS[d.status].label}</Pill>, <span className="text-[#9599AC]">{d.age}</span>,
        ] }))} />
    </div>
  );
}
export function A1Screen2({ deal }) {
  if (!deal) return null;
  const Cap = ({ ok }) => ok ? <span className="inline-flex items-center gap-1 text-[#059669] font-semibold text-xs"><Check size={13}/> Supported</span> : <span className="inline-flex items-center gap-1 text-[#DC2626] font-semibold text-xs"><X size={13}/> Not supported</span>;
  return (
    <Card className="p-5 max-w-3xl">
      <div className="flex items-start justify-between mb-4">
        <div><div className="text-xs text-[#9599AC] mb-1"><Mono>{deal.id}</Mono> · <Field kind="account" id={deal.account}>{deal.account}</Field></div><div className="text-lg font-bold text-[#12172B]" style={{ fontFamily: DISPLAY }}>Deal Detail</div></div>
        <Pill tone={deal.status}>{STATUS[deal.status].label}</Pill>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 text-sm">
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Customer / Address</div><div className="font-medium">{deal.account}</div><div className="text-[#8A90A6]">{deal.address}, {deal.country}</div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Contract window</div><div className="font-medium">{deal.startDate} — {deal.endDate}</div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Term</div><div className="font-medium">{deal.term}</div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Product / SKU</div><div className="font-medium"><Field kind="product" id={deal.product.split(" + ")[0]}>{deal.product}</Field></div><div className="text-[#8A90A6]">{deal.sku}</div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Quantity / Licenses</div><div className="font-medium">{deal.qty}</div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Billing model</div><div className="font-medium">{deal.billing}</div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Discount</div><div className="font-medium">{deal.discount}%</div></div>
      </div>
      <SectionLabel>Cross-System Capability Check</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="p-3"><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">CRM capability</div><Cap ok={deal.crmOk} /></Card>
        <Card className="p-3"><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">ERP / Billing capability</div><Cap ok={deal.erpOk} /></Card>
        <Card className="p-3"><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Provisioning capability</div><Cap ok={deal.provisioningOk} /></Card>
      </div>
      {deal.gap && (
        <div className="rounded-lg p-3.5" style={{ background: deal.status === "escalated" ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${deal.status === "escalated" ? "#FECACA" : "#FDE68A"}` }}>
          <div className="flex items-center gap-2 font-semibold text-sm mb-1" style={{ color: deal.status === "escalated" ? "#B91C1C" : "#B45309" }}><AlertTriangle size={14} /> System-fit gap identified</div>
          <div className="text-sm" style={{ color: deal.status === "escalated" ? "#7F1D1D" : "#7A4B0A" }}>{deal.gap}</div>
        </div>
      )}
    </Card>
  );
}
export function A1Screen3({ deal, dispatch, fulfillRunId }) {
  if (!deal) return null;
  const resolved = deal.decision !== "undecided";
  const fulfillSteps = ["CRM record updated", "ERP/Billing Queue updated", "Provisioning triggered"];
  return (
    <Card className="p-5 max-w-xl">
      <SectionLabel>Sales Ops Approval</SectionLabel>
      <div className="text-sm text-[#5B5F73] mb-1">Deal <Field kind="deal" id={deal.id} mono>{deal.id}</Field> — <Field kind="account" id={deal.account}>{deal.account}</Field></div>
      <div className="flex items-center gap-3 mb-3"><ScoreRing score={deal.validationScore} /></div>
      {deal.failedRules.length > 0 && (
        <div className="mb-3"><div className="text-xs font-semibold text-[#8A90A6] uppercase mb-1">Failed rules</div>
          {deal.failedRules.map((r) => <div key={r} className="text-sm text-[#B45309]">— {r}</div>)}
        </div>
      )}
      <div className="text-sm text-[#5B5F73] mb-4">{deal.gap || "No exception — within policy."}</div>
      {!resolved && <textarea placeholder="Comment (optional)…" className="w-full text-sm border border-[#DCDEE8] rounded-lg p-3 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30" rows={3} />}
      <ApprovalPanel
        decision={deal.decision}
        approveLabel="Approve"
        pendingLabel="Return to Rep"
        rejectLabel="Escalate to ERP / Product Team"
        resolvedTone={deal.status}
        onApprove={() => dispatch({ type: "DEAL_ACTION", id: deal.id, kind: "approve" })}
        onPending={() => dispatch({ type: "DEAL_ACTION", id: deal.id, kind: "return" })}
        onReject={() => dispatch({ type: "DEAL_ACTION", id: deal.id, kind: "escalate" })}
      />
      {resolved && deal.status === "approved" && <div className="mt-4"><ExecutionTrace triggerKey={fulfillRunId} steps={fulfillSteps} doneLabel="Order Fulfillment Ready" /></div>}
    </Card>
  );
}
