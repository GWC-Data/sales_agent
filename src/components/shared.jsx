import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { AlertTriangle, Sparkles, ChevronRight, Play, Check, X, Clock } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { STATUS, DISPLAY, MONO } from "../lib/constants";

export function Pill({ tone = "pending", children }) {
  const s = STATUS[tone] || STATUS.pending;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ color: s.fg, background: s.bg, border: `1px solid ${s.ring}` }}>{children}</span>;
}
export function Mono({ children, className = "" }) { return <span className={`font-mono ${className}`} style={{ fontFamily: MONO }}>{children}</span>; }
export function Card({ children, className = "", style }) { return <div className={`bg-white rounded-xl border border-[#E7E8F0] shadow-[0_1px_2px_rgba(15,20,36,0.04)] ${className}`} style={style}>{children}</div>; }

/* ---- Click-to-detail: any entity reference (account, rep, deal id, ticket, etc.)
   is wrapped in <Field> and opens a detail drawer via context, instead of
   navigating away or duplicating data. ---- */
export const DetailContext = createContext(() => {});
export function Field({ kind, id, mono, className = "", children }) {
  const open = useContext(DetailContext);
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); open(kind, id); }}
      className={`inline text-left p-0 border-0 bg-transparent underline decoration-dotted decoration-[#C7CAD9] underline-offset-2 hover:decoration-[#4F46E5] hover:text-[#4F46E5] transition-colors cursor-pointer ${className}`}
      style={mono ? { fontFamily: MONO } : undefined}
    >
      {children}
    </button>
  );
}
export function inferKind(record) {
  if (!record) return "account";
  if (record.startsWith("WG-")) return "deal";
  if (record.startsWith("OP-")) return "opportunity";
  if (record.startsWith("REN-")) return "renewal";
  if (record.startsWith("APP-")) return "application";
  if (record.startsWith("UP-")) return "upsell";
  if (record.startsWith("REP-")) return "rep";
  return "account";
}
export function DetailRow({ label, value }) {
  return <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-0.5">{label}</div><div className="text-sm font-medium text-[#12172B]">{value}</div></div>;
}
export function SectionLabel({ children, right }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A90A6]" style={{ fontFamily: DISPLAY }}>{children}</div>
      {right}
    </div>
  );
}
export function MetricRow({ metrics }) {
  return (
    <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: `repeat(${metrics.length}, minmax(0,1fr))` }}>
      {metrics.map((m) => (
        <Card key={m.label} className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8A90A6] mb-1">{m.label}</div>
          <div className="text-2xl font-bold text-[#12172B]" style={{ fontFamily: DISPLAY }}>{m.value}</div>
          {m.sub && <div className="text-xs text-[#9599AC] mt-0.5">{m.sub}</div>}
        </Card>
      ))}
    </div>
  );
}
export function Table({ columns, rows, onRowClick, activeId }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-[#EDEEF4] bg-[#FAFAFD]">{columns.map((c) => <th key={c} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#8A90A6]">{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} onClick={() => onRowClick && onRowClick(r)} className={`border-b border-[#F3F3F8] last:border-0 ${onRowClick ? "cursor-pointer" : ""} transition-colors ${activeId === r.__id ? "bg-[#EEF0FF]" : "hover:bg-[#FAFAFD]"}`}>
                {r.__cells.map((cell, j) => <td key={j} className="px-4 py-3 align-middle">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
export function ActionButton({ tone = "primary", icon: Icon, children, onClick, disabled }) {
  const tones = { primary: { bg: "#4F46E5", fg: "#fff", border: "#4F46E5" }, ghost: { bg: "#fff", fg: "#12172B", border: "#DCDEE8" }, danger: { bg: "#fff", fg: "#DC2626", border: "#F3D0D0" }, success: { bg: "#fff", fg: "#059669", border: "#BEEBD7" } };
  const t = tones[tone];
  return (
    <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: t.bg, color: t.fg, border: `1px solid ${t.border}` }}>
      {Icon && <Icon size={14} />}{children}
    </button>
  );
}
export function Sparkline({ data, color = "#4F46E5" }) {
  return <div style={{ width: 100, height: 30 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={data.map((v) => ({ v }))}><YAxis hide domain={["dataMin - 2", "dataMax + 2"]} /><Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>;
}
export function HitlBadge({ hitl }) {
  return hitl ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide" style={{ background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" }}><AlertTriangle size={12} /> Human Approval Required</span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide" style={{ background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}><Sparkles size={12} /> Autonomous Execution</span>
  );
}
export function SystemsFlow({ systems }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {systems.map((s, i) => (
        <React.Fragment key={s}>
          <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#F0F1F6] text-[#5B5F73]">{s}</span>
          {i < systems.length - 1 && <ChevronRight size={11} color="#C7CAD9" />}
        </React.Fragment>
      ))}
    </div>
  );
}
export function ScoreRing({ score }) {
  const tone = score >= 90 ? "#059669" : score >= 75 ? "#B45309" : "#DC2626";
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EDEEF4" strokeWidth="3.5" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={tone} strokeWidth="3.5" strokeDasharray={`${(score / 100) * 97.4} 97.4`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold" style={{ color: tone, fontFamily: DISPLAY }}>{score}</div>
      </div>
      <div>
        <div className="text-sm font-bold" style={{ color: tone }}>{score >= 90 ? "Auto-approve threshold met" : "Below 90% — human review required"}</div>
        <div className="text-xs text-[#8A90A6]">Validation confidence score</div>
      </div>
    </div>
  );
}

/* ---- Agent Execution Simulator ---- */
export function ExecutionTrace({ triggerKey, steps, onDone, pendingLabel, doneLabel, scoreLabel }) {
  const [count, setCount] = useState(0);
  const seenTrigger = useRef(0);
  useEffect(() => {
    if (!triggerKey || triggerKey === seenTrigger.current) return;
    seenTrigger.current = triggerKey;
    setCount(0);
    let i = 0;
    const iv = setInterval(() => {
      i += 1; setCount(i);
      if (i >= steps.length) { clearInterval(iv); setTimeout(() => onDone && onDone(), 550); }
    }, 460);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);
  if (count === 0) return null;
  const finished = count >= steps.length;
  return (
    <div className="rounded-lg p-4 mb-4" style={{ background: "#0F1424", border: "1px solid #262C48" }}>
      {steps.slice(0, count).map((s, i) => {
        const st = typeof s === "string" ? { text: s, warn: false } : s;
        return (
          <div key={i} className="flex items-start gap-2 py-0.5 text-[12.5px]" style={{ fontFamily: MONO }}>
            <span style={{ color: st.warn ? "#F59E0B" : "#4ADE80" }}>{st.warn ? "⚠" : "✓"}</span>
            <span style={{ color: "#D7DAEE" }}>{st.text}</span>
          </div>
        );
      })}
      {finished && scoreLabel && <div className="pt-3 mt-2 border-t border-[#242A45]">{scoreLabel}</div>}
      {finished && pendingLabel && <div className="flex items-center gap-2 pt-2 mt-1 border-t border-[#242A45] text-[12.5px]" style={{ color: "#F59E0B", fontFamily: MONO }}><span>⏳</span><span>{pendingLabel}</span></div>}
      {finished && doneLabel && <div className="flex items-center gap-2 pt-2 mt-1 border-t border-[#242A45] text-[12.5px]" style={{ color: "#4ADE80", fontFamily: MONO }}><span>✓</span><span>{doneLabel}</span></div>}
    </div>
  );
}
export function RunAgentButton({ onClick, label = "Run Agent" }) {
  return <button onClick={onClick} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-white mb-4 transition-transform active:scale-[0.97]" style={{ background: "#4F46E5" }}><Play size={13} fill="white" />{label}</button>;
}

/* ---- Standardized human decision control ----
   Every HITL agent's approval screen (screen 3) uses this instead of its own
   bespoke button row: Approve / Pending / Reject, backed by a record's
   `decision` field ("undecided" | "approved" | "pending" | "rejected").
   Once a decision is made, the buttons are replaced by a status Pill. */
export function ApprovalPanel({
  decision, onApprove, onPending, onReject,
  approveLabel = "Approve", pendingLabel = "Mark Pending", rejectLabel = "Reject",
  resolvedTone, resolvedLabel, disabled,
}) {
  if (decision && decision !== "undecided") {
    const tone = resolvedTone || (decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "pending");
    const label = resolvedLabel || (STATUS[tone] ? STATUS[tone].label : tone);
    return <Pill tone={tone}>{label}</Pill>;
  }
  return (
    <div className="flex gap-2 flex-wrap">
      <ActionButton tone="success" icon={Check} onClick={onApprove} disabled={disabled}>{approveLabel}</ActionButton>
      <ActionButton tone="ghost" icon={Clock} onClick={onPending} disabled={disabled}>{pendingLabel}</ActionButton>
      <ActionButton tone="danger" icon={X} onClick={onReject} disabled={disabled}>{rejectLabel}</ActionButton>
    </div>
  );
}

export function agentHealth(state) {
  return [
    { key: "a1", waiting: state.deals.filter((d) => d.status === "review" || d.status === "escalated").length, completed: state.deals.filter((d) => d.status === "cleared" || d.status === "approved").length },
    { key: "a2", waiting: state.opps.filter((o) => o.decision === "undecided").length, completed: state.opps.filter((o) => o.decision !== "undecided").length },
    { key: "a3", waiting: 0, completed: Object.keys(state.analyzedAccounts).length },
    { key: "a4", waiting: state.renewals.filter((r) => r.riskScore >= 60).length, completed: state.renewals.filter((r) => r.riskScore < 35).length },
    { key: "a5", waiting: state.applications.filter((a) => a.status === "exception").length, completed: state.applications.filter((a) => a.status === "approved" || a.status === "cleared").length },
    { key: "a6", waiting: state.upsells.filter((u) => u.decision === "undecided" && u.analyzed).length, completed: state.upsells.filter((u) => u.status === "sent").length },
    { key: "a7", waiting: state.reps.filter((r) => r.gap !== "cleared" && !r.coachStatus).length, completed: state.reps.filter((r) => r.coachStatus).length },
  ];
}
