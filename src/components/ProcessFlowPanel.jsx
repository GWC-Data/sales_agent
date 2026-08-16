import React from "react";
import { DISPLAY } from "../lib/constants";

/* =========================================================================
   AGENT STATUS — Trigger → Observe → Reason → Decide → Human Approval → Act
   pipeline view for whichever agent screen is currently open.
========================================================================= */
const TONE_COLOR = { approved: "#059669", exception: "#B45309", pending: "#4F46E5" };

export function ProcessFlowPanel({ flow }) {
  if (!flow) return null;
  const color = TONE_COLOR[flow.tone] || "#4F46E5";
  return (
    <div className="w-72 shrink-0 rounded-xl shadow-xl border border-[#E7E8F0] bg-white p-5 overflow-y-auto">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A90A6] mb-1" style={{ fontFamily: DISPLAY }}>Agent Status</div>
      <div className="text-xs text-[#8A90A6] mb-4">Triggered by: {flow.trigger}</div>
      <div>
        {flow.steps.map((s, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ background: s.status === "done" ? "#059669" : s.status === "current" ? "#4F46E5" : "#DCDEE8" }} />
              {i < flow.steps.length - 1 && <div className="w-px flex-1" style={{ background: s.status === "done" ? "#059669" : "#E7E8F0", minHeight: 22 }} />}
            </div>
            <div className="pb-4">
              <div className="text-[13px] font-semibold" style={{ color: s.status === "pending" ? "#B7BACC" : "#12172B" }}>{s.label}</div>
              <div className="text-xs text-[#8A90A6]">{s.note}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 rounded-lg p-3" style={{ background: `${color}14`, border: `1px solid ${color}33` }}>
        <div className="text-xs font-semibold" style={{ color }}>{flow.summary}</div>
      </div>
    </div>
  );
}
