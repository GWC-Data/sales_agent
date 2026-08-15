import React from "react";
import { DISPLAY } from "../lib/constants";
import { Table, Field, inferKind } from "./shared";

export function ApprovalCenter({ approvals, goTo }) {
  const byAgent = {}; approvals.forEach((a) => { byAgent[a.agent] = (byAgent[a.agent] || 0) + 1; });
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#12172B] mb-1" style={{ fontFamily: DISPLAY }}>Approval Center</h1>
      <p className="text-sm text-[#6B7280] mb-5">Every pending human decision across all 7 agents, in one place.</p>
      <div className="flex gap-2 flex-wrap mb-5">
        {Object.entries(byAgent).map(([agent, count]) => <div key={agent} className="px-3 py-1.5 rounded-lg bg-[#EEF0FF] border border-[#C7D2FE] text-sm text-[#33359E] font-medium">{agent} · {count}</div>)}
        {approvals.length === 0 && <div className="text-sm text-[#8A90A6]">No pending approvals — all clear.</div>}
      </div>
      <Table columns={["Agent", "Summary", "Record"]} rows={approvals.map((a) => ({ __id: a.id, __cells: [a.agent, a.summary, <Field kind={inferKind(a.recordId)} id={a.recordId} mono className="text-[#4F46E5]">{a.recordId}</Field>] }))}
        onRowClick={(r) => { const found = approvals.find((a) => a.id === r.__id); if (found) goTo(found.nav.agent, found.nav.screen); }} />
    </div>
  );
}
