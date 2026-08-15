import React from "react";
import { STATUS, DISPLAY } from "../../lib/constants";
import { Pill, Card, Field, SectionLabel, MetricRow, Table, Sparkline, ExecutionTrace, RunAgentButton, ApprovalPanel } from "../shared";

/* =========================================================================
   AGENT 7 — Rep Performance & Coaching Trigger
========================================================================= */
export function A7Screen1({ reps, runId, onRun, onDone }) {
  const rep = reps.find((r) => r.id === "REP-04");
  const steps = [`OBSERVE — End-of-period metrics pulled for ${rep.name} (${rep.role})`, `REASON — Conversion ${rep.conversion}% vs. target ${rep.target}%`, "REASON — Breaking down by funnel stage...", "DECIDE — Root cause identified, coaching focus recommended"];
  return (
    <div>
      <MetricRow metrics={[{ label: "Reps below target", value: String(reps.filter((r) => r.gap !== "cleared").length) }, { label: "Recognition candidates", value: String(reps.filter((r) => r.recognitionCandidate).length) }]} />
      <SectionLabel right={!rep.analyzed && <RunAgentButton onClick={onRun} label={`Diagnose — ${rep.name}`} />}>Rep Performance Command Center</SectionLabel>
      <ExecutionTrace triggerKey={runId} steps={steps} onDone={onDone} />
      <Table columns={["Rep", "Role", "Pipeline", "Conversion", "Target", "Deal Value vs. Target", "Gap Flag"]}
        rows={reps.map((r) => ({ __id: r.id, __cells: [<Field kind="rep" id={r.id}>{r.name}</Field>, r.role, r.pipeline, `${r.conversion}%`, `${r.target}%`, `${r.dealValuePct}%`, <Pill tone={r.gap}>{STATUS[r.gap].label}</Pill>] }))} />
    </div>
  );
}
export function A7Screen2({ reps }) {
  const rep = reps.find((r) => r.id === "REP-04");
  return (
    <Card className="p-5 max-w-xl">
      <SectionLabel>Rep Performance Diagnostic — {rep.name} ({rep.role})</SectionLabel>
      <div className="flex items-center gap-6 mb-4">
        <div><div className="text-3xl font-bold text-[#DC2626]" style={{ fontFamily: DISPLAY }}>{rep.conversion}%</div><div className="text-xs text-[#8A90A6]">Conversion</div></div>
        <div><div className="text-3xl font-bold text-[#B7BACC]" style={{ fontFamily: DISPLAY }}>{rep.target}%</div><div className="text-xs text-[#8A90A6]">Target</div></div>
        <div><div className="text-3xl font-bold text-[#DC2626]" style={{ fontFamily: DISPLAY }}>{rep.conversion - rep.target}%</div><div className="text-xs text-[#8A90A6]">Gap</div></div>
      </div>
      <div className="mb-4"><Sparkline data={rep.trend} color="#DC2626" /></div>
      <SectionLabel>Why</SectionLabel>
      <ul className="text-sm text-[#5B5F73] list-disc pl-4 space-y-1 mb-3">{rep.diagnostics.map((d) => <li key={d}>{d}</li>)}</ul>
      {rep.coachingFocus && <div className="rounded-lg p-3 bg-[#EEF0FF] border border-[#C7D2FE] text-sm text-[#33359E]">Coaching focus: <b>{rep.coachingFocus}</b></div>}
    </Card>
  );
}
export function A7Screen3({ reps, dispatch }) {
  const rep = reps.find((r) => r.id === "REP-04");
  const resolvedLabelMap = { coach: "Coaching task created", recognize: "Recognition nominated", defer: "Deferred", dismiss: "Dismissed" };
  return (
    <Card className="p-5 max-w-lg">
      <SectionLabel>Coaching / Recognition</SectionLabel>
      <div className="text-sm text-[#5B5F73] mb-1">Recommended intervention: <b>Coaching</b></div>
      <div className="text-sm text-[#5B5F73] mb-4">Recommended playbook: <b>{rep.playbook}</b> — suggested manager action: schedule a coaching session this week.</div>
      <ApprovalPanel
        decision={rep.decision}
        approveLabel="Create Coaching Task"
        pendingLabel="Defer Decision"
        rejectLabel="Dismiss"
        resolvedLabel={rep.coachStatus ? resolvedLabelMap[rep.coachStatus] : undefined}
        onApprove={() => dispatch({ type: "REP_ACTION", id: rep.id, kind: "coach" })}
        onPending={() => dispatch({ type: "REP_ACTION", id: rep.id, kind: "defer" })}
        onReject={() => dispatch({ type: "REP_ACTION", id: rep.id, kind: "dismiss" })}
      />
      {!rep.coachStatus && (
        <button
          onClick={() => dispatch({ type: "REP_ACTION", id: rep.id, kind: "recognize" })}
          className="mt-3 text-xs text-[#4F46E5] underline decoration-dotted underline-offset-2 hover:text-[#3730A3]"
        >
          Nominate for recognition instead
        </button>
      )}
    </Card>
  );
}
