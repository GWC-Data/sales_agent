import React from "react";
import { Check, CircleDot } from "lucide-react";
import { FULL_CATALOG } from "../../lib/seedData";
import { Card, Field, SectionLabel, MetricRow, Table, Sparkline, ExecutionTrace, RunAgentButton, ApprovalPanel } from "../shared";

/* =========================================================================
   AGENT 6 — AM Cross-Sell / Upsell
========================================================================= */
export function A6Screen1({ upsells }) {
  return (
    <div>
      <MetricRow metrics={[{ label: "Pipeline created (90d)", value: "$57.6K" }, { label: "Win rate", value: "31%" }]} />
      <SectionLabel>Expansion Opportunity Map</SectionLabel>
      <Table columns={["Account", "Current Products", "Signal", "Potential ARR", "Fit Score"]}
        rows={upsells.map((u) => ({ __id: u.id, __cells: [
          <Field kind="account" id={u.account}>{u.account}</Field>,
          <span>{u.owned.map((p, i) => <React.Fragment key={p}>{i > 0 && " + "}<Field kind="product" id={p}>{p}</Field></React.Fragment>)}</span>,
          <span className="text-[#5B5F73]">{u.signal}</span>, <Field kind="upsell" id={u.id} className="font-semibold">${u.uplift.toLocaleString()}</Field>, `${u.fitScore}`,
        ] }))} />
    </div>
  );
}
export function A6Screen2({ upsells, runId, onRun, onDone }) {
  const u = upsells.find((x) => x.id === "UP-501");
  const steps = [`OBSERVE — Signal detected: ${u.signal}`, `REASON — Current entitlement: ${u.owned.join(", ")}`, `REASON — Gap: ${u.gap}`, `DECIDE — Recommend ${u.recommended}, potential uplift $${u.uplift.toLocaleString()} ARR`];
  return (
    <div>
      <SectionLabel right={!u.analyzed && <RunAgentButton onClick={onRun} />}>Account Product Gap — <Field kind="account" id={u.account}>{u.account}</Field></SectionLabel>
      <ExecutionTrace triggerKey={runId} steps={steps} onDone={onDone} pendingLabel="Waiting for AM approval to send outreach" />
      <Card className="p-5 max-w-xl">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {FULL_CATALOG.map((c) => (
            <div key={c} className="flex items-center gap-2 text-sm">
              {u.owned.includes(c) ? <Check size={14} color="#059669" /> : <CircleDot size={14} color="#DCDEE8" />}
              <Field kind="product" id={c} className={u.owned.includes(c) ? "text-[#12172B] font-medium" : c === "Endpoint Security" ? "text-[#4F46E5] font-semibold" : "text-[#B7BACC]"}>{c}</Field>
            </div>
          ))}
        </div>
        <SectionLabel>Detected signal</SectionLabel>
        <div className="text-sm text-[#12172B] mb-3">{u.signal}</div>
        <SectionLabel>Usage trend</SectionLabel>
        <Sparkline data={u.trend} color="#059669" />
      </Card>
    </div>
  );
}
export function A6Screen3({ upsells, dispatch }) {
  const u = upsells.find((x) => x.id === "UP-501");
  if (!u.analyzed) return <div className="text-sm text-[#8A90A6]">Run the agent on the Account Product Gap tab first to generate the opportunity and outreach.</div>;
  return (
    <Card className="p-5 max-w-xl">
      <SectionLabel>Opportunity + Outreach — <Field kind="account" id={u.account}>{u.account}</Field></SectionLabel>
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold">Opportunity value</div><div className="font-medium">${u.uplift.toLocaleString()}</div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold">Product</div><div className="font-medium">{u.recommended}</div></div>
      </div>
      <div className="border border-[#EDEEF4] rounded-lg p-4 bg-[#FAFAFD] text-sm text-[#3B3F52] leading-relaxed mb-4">
        <div className="font-semibold text-[#12172B] mb-1">Subject: Scaling {u.account.split(" ")[0]}'s security coverage for your recent growth</div>
        Hi Priya — congrats on the acquisition. Given the headcount increase, your current Endpoint Security licenses won't cover the expanded team. Want 15 minutes this week to size the upgrade?
      </div>
      <ApprovalPanel
        decision={u.decision}
        approveLabel="Approve & Create Opportunity"
        pendingLabel="Hold for Edit"
        rejectLabel="Discard"
        onApprove={() => dispatch({ type: "UPSELL_ACTION", id: u.id, kind: "send" })}
        onPending={() => dispatch({ type: "UPSELL_ACTION", id: u.id, kind: "hold" })}
        onReject={() => dispatch({ type: "UPSELL_ACTION", id: u.id, kind: "discard" })}
      />
    </Card>
  );
}
