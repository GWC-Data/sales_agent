import React from "react";
import { DISPLAY } from "../lib/constants";
import { Table, Mono, Field, inferKind } from "./shared";

export function AuditTrail({ audit }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#12172B] mb-1" style={{ fontFamily: DISPLAY }}>Audit Trail</h1>
      <p className="text-sm text-[#6B7280] mb-5">Every agent action across the platform, timestamped and attributed.</p>
      <Table columns={["Timestamp", "Agent", "Event", "Record", "Action", "Actor"]}
        rows={audit.map((e, i) => ({ __id: String(i), __cells: [<Mono className="text-xs">{e.ts}</Mono>, e.agent, e.event, <Field kind={inferKind(e.record)} id={e.record} mono className="text-xs">{e.record}</Field>, e.action, e.actor] }))} />
    </div>
  );
}
