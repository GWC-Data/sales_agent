import React, { useCallback, useEffect, useState } from "react";
import { DISPLAY } from "../../lib/constants";
import {
  fetchRenewalQueue, fetchRenewalDetail, logRenewalActivity, adjustRenewal, notifyRenewal,
} from "../../lib/agent4";
import { useRenewalQueue, useTriggerLog } from "../../hooks/useAgent4";
import { Pill, Mono, Card, Field, SectionLabel, MetricRow, Table, Dropdown, ActionButton } from "../shared";

/* =========================================================================
   AGENT 4 — Renewal Opportunity Auto-Creation & Backlog
========================================================================= */
const STAGE_TONE = { on_track: "cleared", am_notified: "medium", manager_escalated: "medium", executive_escalated: "high", expired: "high" };
const STAGE_LABEL = { on_track: "On track", am_notified: "AM notified", manager_escalated: "Manager escalated", executive_escalated: "Exec escalated", expired: "Expired" };
const WINDOW_ORDER = ["expired", "30-day window", "60-day window", "90-day window", "beyond 90 days"];

function riskTone(score) {
  return score >= 70 ? "high" : score >= 40 ? "medium" : "low";
}

export function A4Screen1({ onSelectRenewal }) {
  const [amOwner, setAmOwner] = useState("");
  const [groupBy, setGroupBy] = useState("window");
  const [queue, setQueue] = useState({ renewals: [], total_backlog_value: 0, backlog_completeness_pct: 100, at_risk_count: 0, due_within_30_count: 0, due_31_to_60_count: 0 });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const { entries: triggerLog } = useTriggerLog();

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    fetchRenewalQueue(amOwner || undefined)
      .then((res) => { if (!cancelled) { setQueue(res); setStatus("success"); } })
      .catch((err) => { if (!cancelled) { setError(err?.message || "Failed to load backlog."); setStatus("error"); } });
    return () => { cancelled = true; };
  }, [amOwner]);

  const amOptions = [{ value: "", label: "All AMs" }, ...[...new Set(queue.renewals.map((r) => r.am_owner))].sort().map((a) => ({ value: a, label: a }))];

  function quarterLabel(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
  }

  const columns = {};
  queue.renewals.forEach((r) => {
    const key = groupBy === "window" ? r.due_window : quarterLabel(r.renewal_date);
    (columns[key] = columns[key] || []).push(r);
  });
  const sortedKeys = groupBy === "window"
    ? WINDOW_ORDER.filter((w) => columns[w])
    : Object.keys(columns).sort();

  return (
    <div>
      <MetricRow metrics={[
        { label: "Total renewal ARR", value: `$${(Number(queue.total_backlog_value) / 1000).toFixed(0)}K` },
        { label: "At-risk renewals", value: String(queue.at_risk_count) },
        { label: "Due in 30 days", value: String(queue.due_within_30_count) },
        { label: "Due in 30–60 days", value: String(queue.due_31_to_60_count) },
        { label: "Due in 60–90 days", value: String(queue.due_61_to_90_count || 0) },
        { label: "Backlog completeness", value: `${queue.backlog_completeness_pct}%` },
      ]} />
      <SectionLabel
        right={
          <div className="flex gap-2">
            <Dropdown value={groupBy} options={[{ value: "window", label: "Group: Due window" }, { value: "quarter", label: "Group: Quarter" }]} onChange={setGroupBy} />
            <Dropdown value={amOwner} options={amOptions} onChange={setAmOwner} placeholder="All AMs" />
          </div>
        }
      >
        Renewal Command Center
      </SectionLabel>
      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      {status === "loading" && queue.renewals.length === 0 && <div className="text-sm text-[#8A90A6]">Computing escalation stages and risk scores…</div>}
      {status === "success" && queue.renewals.length === 0 && <div className="text-sm text-[#8A90A6]">No renewals in the backlog.</div>}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {sortedKeys.map((key) => {
          const cards = [...columns[key]].sort((a, b) => a.days_to_renewal - b.days_to_renewal);
          const colTotal = cards.reduce((sum, c) => sum + c.expected_value, 0);
          return (
            <div key={key} className="shrink-0" style={{ width: 280 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#8A90A6] uppercase">{key}</span>
                <span className="text-[11px] font-semibold text-[#8A90A6]">${colTotal.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                {cards.map((r) => (
                  <Card key={r.renewal_id} className="p-3 cursor-pointer hover:border-[#C7D2FE]" style={{ borderWidth: 1 }}>
                    <div onClick={() => onSelectRenewal(r.renewal_id)}>
                      <div className="text-sm font-semibold text-[#12172B] mb-0.5">{r.account_name} <span className="text-[10px] text-[#8A90A6] uppercase">{r.tier}</span></div>
                      <div className="text-[11px] text-[#8A90A6] mb-2">{r.am_owner} · {r.term_months}mo · renews {r.renewal_date}</div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-[#12172B]" style={{ fontFamily: DISPLAY }}>${r.expected_value.toLocaleString()}</span>
                        <span className="text-xs font-bold" style={{ color: r.risk_score >= 70 ? "#DC2626" : r.risk_score >= 40 ? "#B45309" : "#059669" }}>risk {r.risk_score}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Pill tone={STAGE_TONE[r.escalation_stage] || "pending"}>{STAGE_LABEL[r.escalation_stage] || r.escalation_stage}</Pill>
                        <span className="text-[11px] text-[#8A90A6]">{r.days_to_renewal}d left</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <details className="mt-6">
        <summary className="text-xs font-semibold text-[#8A90A6] uppercase tracking-wide cursor-pointer">Deal Closure Trigger Log — proves each renewal was auto-created from a closed-won deal</summary>
        <div className="mt-2">
          {(triggerLog || []).length === 0 ? <div className="text-sm text-[#8A90A6]">No trigger log entries yet.</div> : (
            <Table
              columns={["Renewal ID", "Account", "AM", "Trigger event", "Deal closed", "Renewal created", "Target close date"]}
              rows={triggerLog.map((e) => ({
                __id: e.renewal_id,
                __cells: [<Mono>{e.renewal_id}</Mono>, e.account_name, e.am_owner, e.trigger_event, e.trigger_timestamp, <span className="text-[#059669]">{e.created_timestamp}</span>, <span className="text-[#8A90A6]">{e.target_close_date}</span>],
              }))}
            />
          )}
        </div>
      </details>
    </div>
  );
}

function useRenewalSelection(initialRenewalId) {
  const { renewals } = useRenewalQueue();
  const [renewalId, setRenewalId] = useState(initialRenewalId || null);
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => { if (initialRenewalId) setRenewalId(initialRenewalId); }, [initialRenewalId]);
  useEffect(() => { if (!renewalId && renewals.length > 0) setRenewalId(renewals[0].renewal_id); }, [renewals, renewalId]);

  const load = useCallback((id) => {
    if (!id) return;
    setStatus("loading");
    setError(null);
    fetchRenewalDetail(id)
      .then((d) => { setDetail(d); setStatus("success"); })
      .catch((err) => { setError(err?.message || "Failed to load renewal."); setStatus("error"); });
  }, []);

  useEffect(() => { load(renewalId); }, [renewalId, load]);

  const options = renewals.map((r) => ({ value: r.renewal_id, label: `${r.account_name} — ${r.renewal_id}` }));
  return { renewalId, setRenewalId, options, detail, status, error, reload: () => load(renewalId) };
}

export function A4Screen2({ initialRenewalId }) {
  const { renewalId, setRenewalId, options, detail: d, status, error } = useRenewalSelection(initialRenewalId);

  return (
    <div>
      <SectionLabel>Renewal Risk Detail — <Dropdown value={renewalId} options={options} onChange={setRenewalId} placeholder="Select a renewal…" /></SectionLabel>
      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      {status === "loading" && !d && <div className="text-sm text-[#8A90A6]">Computing escalation state and generating proactive suggestions…</div>}
      {d && (
        <Card className="p-5 max-w-3xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-lg font-bold text-[#12172B]" style={{ fontFamily: DISPLAY }}>{d.account_name} <span className="text-xs text-[#8A90A6] uppercase">{d.tier}</span></div>
              <div className="text-xs text-[#9599AC]"><Mono>{d.renewal_id}</Mono> · {d.am_owner} → {d.manager || "—"} → {d.executive || "—"}</div>
            </div>
            <Pill tone={STAGE_TONE[d.escalation_stage] || "pending"}>{d.urgency_label || STAGE_LABEL[d.escalation_stage] || d.escalation_stage}</Pill>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-5 text-sm">
            <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Expected value</div><div className="font-medium">${Number(d.expected_value).toLocaleString()}</div></div>
            <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Term</div><div className="font-medium">{d.term_months}mo</div></div>
            <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Renewal date</div><div className="font-medium">{d.renewal_date}</div></div>
            <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Days to renewal</div><div className="font-medium" style={{ color: d.days_to_renewal <= 30 ? "#DC2626" : "#12172B" }}>{d.days_to_renewal} <span className="text-xs text-[#8A90A6]">({d.due_window})</span></div></div>
            <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Days since activity</div><div className="font-medium">{d.days_since_last_activity ?? "never"}</div></div>
          </div>

          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-[#12172B]">Renewal risk score</div>
              <span className="text-xl font-bold" style={{ color: d.risk_score >= 70 ? "#DC2626" : d.risk_score >= 40 ? "#B45309" : "#059669", fontFamily: DISPLAY }}>{d.risk_score}/100</span>
            </div>
            <div className="h-2 rounded-full bg-[#DCDEE8] overflow-hidden mb-3"><div className="h-full rounded-full" style={{ width: `${d.risk_score}%`, background: d.risk_score >= 70 ? "#DC2626" : d.risk_score >= 40 ? "#B45309" : "#059669" }} /></div>
            <div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1.5">Why this score</div>
            <ul className="text-sm text-[#5B5F73] list-disc pl-4 space-y-1">{(d.risk_factors || []).map((f, i) => <li key={i}>{f}</li>)}</ul>
          </Card>

          <Card className="p-4 mb-4">
            <SectionLabel>Product bundle</SectionLabel>
            <div className="text-sm mb-2">{d.product_bundle}</div>
            <div className="text-xs text-[#8A90A6]">{d.last_activity_note ? <><span className="font-semibold">Last logged activity:</span> {d.last_activity_note}</> : "No activity ever logged on this renewal."}</div>
          </Card>

          <div className="rounded-lg p-4 bg-[#EEF0FF] border border-[#C7D2FE]">
            <div className="text-sm font-semibold text-[#4F46E5] mb-2">Agent risk assessment</div>
            <div className="text-sm text-[#33359E] mb-3">{d.risk_summary || ""}</div>
            <div className="text-sm font-semibold text-[#4F46E5] mb-2">Proactive suggestions</div>
            <ul className="text-sm text-[#33359E] list-disc pl-4 space-y-1">{(d.proactive_suggestions || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        </Card>
      )}
    </div>
  );
}

export function A4Screen3({ initialRenewalId }) {
  const { renewalId, setRenewalId, options, detail: d, status, error, reload } = useRenewalSelection(initialRenewalId);
  const [actionResult, setActionResult] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actor, setActor] = useState("");
  const [note, setNote] = useState("");
  const [activityResult, setActivityResult] = useState(null);
  const [activityError, setActivityError] = useState(null);
  const [adjOwner, setAdjOwner] = useState("");
  const [adjTarget, setAdjTarget] = useState("");
  const [adjValue, setAdjValue] = useState("");
  const [adjBy, setAdjBy] = useState("");
  const [adjustResult, setAdjustResult] = useState(null);
  const [adjustError, setAdjustError] = useState(null);

  useEffect(() => {
    if (!d) return;
    setActor(d.am_owner || "");
    setAdjOwner(d.am_owner || "");
    setAdjTarget(d.target_close_date || "");
    setAdjValue(String(d.expected_value ?? ""));
    setActionResult(null); setActionError(null);
    setActivityResult(null); setActivityError(null);
    setAdjustResult(null); setAdjustError(null);
  }, [d?.renewal_id]);

  const ACTION_LABEL = {
    resolve: "Resolved", recommend_meeting: "Meeting recommended", escalate_am: "Escalated to AM",
    escalate_manager: "Escalated to Manager", escalate_executive: "Escalated to Executive",
  };

  async function doAction(kind) {
    setActionError(null);
    try {
      const res = await notifyRenewal(renewalId, { triggered_by: "manual", action: kind });
      setActionResult(`${ACTION_LABEL[kind]} — notified ${res.notified}.`);
      if (kind === "resolve" || kind === "recommend_meeting") reload();
    } catch (err) {
      setActionError(err?.message || "Failed.");
    }
  }

  async function doLogActivity() {
    setActivityError(null);
    if (!actor.trim() || !note.trim()) { setActivityError("Fill in actor and note."); return; }
    try {
      await logRenewalActivity(renewalId, { actor, note });
      setActivityResult("Activity logged — dormancy clock reset.");
      setNote("");
      reload();
    } catch (err) {
      setActivityError(err?.message || "Failed.");
    }
  }

  async function doAdjust(field, newValue) {
    setAdjustError(null);
    if (!adjBy.trim()) { setAdjustError('Enter "Adjusted by" first.'); return; }
    try {
      await adjustRenewal(renewalId, { field, new_value: String(newValue), adjusted_by: adjBy });
      setAdjustResult(`${field} updated.`);
      reload();
    } catch (err) {
      setAdjustError(err?.message || "Failed.");
    }
  }

  const inputCls = "w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm";

  return (
    <div>
      <SectionLabel>Escalation &amp; Recovery — <Dropdown value={renewalId} options={options} onChange={setRenewalId} placeholder="Select a renewal…" /></SectionLabel>
      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      {status === "loading" && !d && <div className="text-sm text-[#8A90A6]">Loading…</div>}
      {d && (
        <div className="space-y-4 max-w-xl">
          <Card className="p-4">
            <div className="text-xs text-[#8A90A6] mb-3">{d.am_owner} → {d.manager || "—"} → {d.executive || "—"}</div>
            {actionError && <div className="text-sm text-[#DC2626] mb-2">{actionError}</div>}
            <div className="flex flex-wrap gap-2">
              <ActionButton tone="success" onClick={() => doAction("resolve")}>Resolve (Notify + Follow-up Task)</ActionButton>
              <ActionButton tone="ghost" onClick={() => doAction("recommend_meeting")}>Recommend Customer Meeting</ActionButton>
              <ActionButton tone="ghost" onClick={() => doAction("escalate_am")}>Escalate to AM</ActionButton>
              <ActionButton tone="ghost" onClick={() => doAction("escalate_manager")}>Escalate to AM Manager</ActionButton>
              <ActionButton tone="danger" onClick={() => doAction("escalate_executive")}>Escalate to Executive</ActionButton>
            </div>
            {actionResult && <div className="text-sm text-[#059669] font-medium mt-3">{actionResult}</div>}
          </Card>

          <Card className="p-4">
            <SectionLabel>Log AM activity</SectionLabel>
            <div className="text-xs text-[#8A90A6] mb-3">Marks this renewal as actively worked, resetting the dormancy clock.</div>
            <div className="mb-2"><div className="text-xs font-semibold text-[#8A90A6] mb-1">Actor</div><input value={actor} onChange={(e) => setActor(e.target.value)} className={inputCls} /></div>
            <div className="mb-3"><div className="text-xs font-semibold text-[#8A90A6] mb-1">Note</div><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Called the customer to discuss renewal terms..." className={inputCls} /></div>
            {activityError && <div className="text-sm text-[#DC2626] mb-2">{activityError}</div>}
            <ActionButton tone="primary" onClick={doLogActivity}>Log Activity</ActionButton>
            {activityResult && <div className="text-sm text-[#059669] font-medium mt-3">{activityResult}</div>}
          </Card>

          <Card className="p-4">
            <SectionLabel>Manual adjustment</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <div><div className="text-xs font-semibold text-[#8A90A6] mb-1">Owner (AM)</div><input value={adjOwner} onChange={(e) => setAdjOwner(e.target.value)} className={inputCls} /></div>
              <div><div className="text-xs font-semibold text-[#8A90A6] mb-1">Target close date</div><input value={adjTarget} onChange={(e) => setAdjTarget(e.target.value)} className={inputCls} /></div>
            </div>
            <div className="mb-2"><div className="text-xs font-semibold text-[#8A90A6] mb-1">Expected value ($)</div><input value={adjValue} onChange={(e) => setAdjValue(e.target.value)} className={inputCls} /></div>
            <div className="mb-3"><div className="text-xs font-semibold text-[#8A90A6] mb-1">Adjusted by</div><input value={adjBy} onChange={(e) => setAdjBy(e.target.value)} placeholder="Sandra K." className={inputCls} /></div>
            {adjustError && <div className="text-sm text-[#DC2626] mb-2">{adjustError}</div>}
            <div className="flex flex-wrap gap-2">
              <ActionButton tone="ghost" onClick={() => doAdjust("am_owner", adjOwner)}>Save Owner</ActionButton>
              <ActionButton tone="ghost" onClick={() => doAdjust("target_close_date", adjTarget)}>Save Target Date</ActionButton>
              <ActionButton tone="ghost" onClick={() => doAdjust("expected_value", adjValue)}>Save Value</ActionButton>
            </div>
            {adjustResult && <div className="text-sm text-[#059669] font-medium mt-3">{adjustResult}</div>}
          </Card>
        </div>
      )}
    </div>
  );
}
