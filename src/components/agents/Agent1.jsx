import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { DISPLAY } from "../../lib/constants";
import {
  fetchDealQueue, fetchDealDetail, submitDealDecision, escalateDealViaEmail,
} from "../../lib/agent1";
import { useDealQueue, useDealAuditLog } from "../../hooks/useAgent1";
import { Pill, Mono, Card, Field, SectionLabel, MetricRow, Table, Dropdown, ActionButton } from "../shared";

/* =========================================================================
   AGENT 1 — Sales Deal Guardrail & Order Validation
========================================================================= */
const FIT_TONE = { "auto-cleared": "cleared", exception: "exception", escalated: "escalated" };
const CHANGE_TONE = { increase: "low", decrease: "high", no_change: "pending" };
const CHANGE_LABEL = { increase: "▲ Upsell", decrease: "▼ Downsell", no_change: "↔ Renewal" };
const VIOLATION_TONE = { hard: "high", soft: "medium" };
const ACTION_LABEL = {
  "auto-approve": "Auto-approve recommended",
  "return-to-rep": "Return to rep",
  "escalate-to-erp-integration": "Escalate to ERP-Integration",
};

function fmtAddress(a) {
  if (!a) return "No address on file";
  const parts = [a.street, a.city, a.region, a.postal_code, a.country].filter((p) => p && String(p).trim());
  return parts.length ? parts.join(", ") : "Address on file is entirely blank";
}

export function A1Screen1({ onSelectDeal }) {
  const [rep, setRep] = useState("");
  const [queue, setQueue] = useState({ deals: [], total_pending: 0, exception_count: 0, escalated_count: 0, upsell_count: 0, downsell_count: 0 });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const { entries: auditEntries } = useDealAuditLog();

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    fetchDealQueue(rep || undefined)
      .then((res) => { if (!cancelled) { setQueue(res); setStatus("success"); } })
      .catch((err) => { if (!cancelled) { setError(err?.message || "Failed to load queue."); setStatus("error"); } });
    return () => { cancelled = true; };
  }, [rep]);

  const repOptions = [{ value: "", label: "All reps" }, ...[...new Set(queue.deals.map((d) => d.rep))].sort().map((r) => ({ value: r, label: r }))];
  const autoCleared = queue.total_pending - queue.exception_count - queue.escalated_count;

  return (
    <div>
      <MetricRow metrics={[
        { label: "Pending review", value: String(queue.total_pending) },
        { label: "Exceptions", value: String(queue.exception_count) },
        { label: "Escalated", value: String(queue.escalated_count) },
        { label: "Auto-cleared", value: String(Math.max(autoCleared, 0)) },
        { label: "Upsell requests", value: `▲ ${queue.upsell_count}` },
        { label: "Downsell requests", value: `▼ ${queue.downsell_count}` },
      ]} />
      <SectionLabel right={<Dropdown value={rep} options={repOptions} onChange={setRep} placeholder="All reps" />}>Deal Validation Queue</SectionLabel>

      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      {status === "loading" && queue.deals.length === 0 && <div className="text-sm text-[#8A90A6]">Running rules engine over the backlog…</div>}
      {status === "success" && queue.deals.length === 0 && <div className="text-sm text-[#8A90A6]">Queue is empty — every deal has been reviewed.</div>}
      {queue.deals.length > 0 && (
        <Table
          columns={["Deal ID", "Rep", "Account", "Config", "Change", "Fit Status", "Age"]}
          onRowClick={(r) => onSelectDeal(r.__id)}
          rows={queue.deals.map((d) => ({
            __id: d.deal_id,
            __cells: [
              <Mono>{d.deal_id}</Mono>,
              <span>{d.rep} <span className="text-xs text-[#9599AC]">({d.rep_role})</span></span>,
              <Field kind="account" id={d.account_name}>{d.account_name}</Field>,
              <span className="text-xs text-[#8A90A6]">{d.config_summary}</span>,
              d.quantity_change_type && CHANGE_TONE[d.quantity_change_type]
                ? <Pill tone={CHANGE_TONE[d.quantity_change_type]}>{CHANGE_LABEL[d.quantity_change_type]}</Pill>
                : <span className="text-xs text-[#8A90A6]">new sale</span>,
              <Pill tone={FIT_TONE[d.fit_status] || "pending"}>{d.fit_status}</Pill>,
              <span className="text-xs text-[#9599AC]">{d.submitted_age}</span>,
            ],
          }))}
        />
      )}

      <details className="mt-5">
        <summary className="text-xs font-semibold text-[#8A90A6] uppercase tracking-wide cursor-pointer">Decision audit log — every approve/return/escalate, including the agent's own auto-approvals</summary>
        <div className="mt-2">
          {(auditEntries || []).length === 0 ? <div className="text-sm text-[#8A90A6]">No decisions recorded yet.</div> : (
            <Table
              columns={["Deal ID", "Decision", "Decided by", "Comment", "When"]}
              rows={auditEntries.map((e, i) => ({
                __id: i,
                __cells: [
                  <Mono>{e.deal_id}</Mono>,
                  <Pill tone={e.decision === "approved" ? "approved" : e.decision === "escalated" ? "escalated" : "pending"}>{e.decision}</Pill>,
                  <span>{e.reviewer === "Deal Guardrail Agent" ? "⚡ " : ""}{e.reviewer}</span>,
                  <span className="text-xs text-[#8A90A6]">{e.comment || "—"}</span>,
                  <span className="text-xs text-[#9599AC]">{e.decided_at}</span>,
                ],
              }))}
            />
          )}
        </div>
      </details>
    </div>
  );
}

function useDealSelection(initialDealId) {
  const { deals } = useDealQueue();
  const [dealId, setDealId] = useState(initialDealId || null);
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialDealId) setDealId(initialDealId);
  }, [initialDealId]);

  useEffect(() => {
    if (!dealId && deals.length > 0) setDealId(deals[0].deal_id);
  }, [deals, dealId]);

  const load = React.useCallback((id) => {
    if (!id) return;
    setStatus("loading");
    setError(null);
    fetchDealDetail(id)
      .then((d) => { setDetail(d); setStatus("success"); })
      .catch((err) => { setError(err?.message || "Failed to load deal."); setStatus("error"); });
  }, []);

  useEffect(() => { load(dealId); }, [dealId, load]);

  const options = deals.map((d) => ({ value: d.deal_id, label: `${d.deal_id} — ${d.account_name}` }));
  return { dealId, setDealId, options, detail, status, error, reload: () => load(dealId) };
}

export function A1Screen2({ initialDealId }) {
  const { dealId, setDealId, options, detail: d, status, error } = useDealSelection(initialDealId);

  return (
    <div>
      <SectionLabel>Deal Detail — <Dropdown value={dealId} options={options} onChange={setDealId} placeholder="Select a deal…" /></SectionLabel>
      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      {status === "loading" && !d && <div className="text-sm text-[#8A90A6]">Running the capability rules engine and generating the rationale…</div>}
      {d && (
        <Card className="p-5 max-w-3xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-[#9599AC] mb-1"><Mono>{d.deal_id}</Mono> · <Field kind="account" id={d.account_name}>{d.account_name}</Field></div>
              <div className="text-lg font-bold text-[#12172B]" style={{ fontFamily: DISPLAY }}>{d.rep} ({d.rep_role}) · {d.product_bundle}</div>
            </div>
            <Pill tone={FIT_TONE[d.fit_status] || "pending"}>{d.fit_status}</Pill>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 text-sm">
            <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Quantity</div><div className="font-medium">{d.quantity}</div></div>
            <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Discount</div><div className="font-medium" style={{ color: d.discount_pct > d.max_discount_pct ? "#DC2626" : "#12172B" }}>{d.discount_pct}% <span className="text-xs text-[#8A90A6]">/ {d.max_discount_pct}% max</span></div></div>
            <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Billing</div><div className="font-medium">{d.billing_model}</div></div>
            <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Term</div><div className="font-medium">{d.term_months}mo</div></div>
            <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">ARR</div><div className="font-medium">${Number(d.arr).toLocaleString()}</div></div>
          </div>

          {d.requires_hardware_shipment && (
            <div className="mb-4">
              <SectionLabel>Ship-to address (hardware fulfillment required)</SectionLabel>
              <div className="text-sm text-[#5B5F73]">{fmtAddress(d.shipping_address)}</div>
            </div>
          )}

          {d.is_existing_customer_change && (
            <Card className="p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-[#12172B]">Existing subscription change</div>
                <Pill tone={CHANGE_TONE[d.quantity_change_type] || "pending"}>{CHANGE_LABEL[d.quantity_change_type] || d.quantity_change_type}</Pill>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm">
                <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold">Previous quantity</div><div className="font-medium">{d.previous_quantity}</div></div>
                <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold">Requested quantity</div><div className="font-medium">{d.quantity}</div></div>
                <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold">Reason sentiment</div><Pill tone={d.reason_sentiment === "positive" ? "low" : d.reason_sentiment === "negative" ? "high" : "medium"}>{d.reason_sentiment || "—"}</Pill></div>
              </div>
              <div className="text-sm text-[#5B5F73] mb-2"><span className="font-semibold">Rep's stated reason:</span> {d.change_reason}</div>
              {d.signal_interpretation && <div className="text-sm bg-[#FAFAFD] rounded-lg p-3"><span className="font-semibold">Agent read:</span> {d.signal_interpretation}</div>}
            </Card>
          )}

          <SectionLabel>Rule engine violations</SectionLabel>
          <div className="mb-4">
            {d.violations.length === 0 ? <div className="text-sm text-[#059669]">No rule violations — configuration is clean.</div> : (
              <div className="space-y-1.5">
                {d.violations.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Pill tone={VIOLATION_TONE[v.severity] || "medium"}>{v.severity}</Pill>
                    <span>{v.message}</span>
                    <span className="text-xs text-[#8A90A6]">{v.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg p-4 bg-[#EEF0FF] border border-[#C7D2FE] mb-4">
            <div className="text-sm font-semibold text-[#4F46E5] mb-2">Agent rationale</div>
            <ul className="text-sm text-[#33359E] list-disc pl-4 space-y-1 mb-3">{(d.rationale_trace || []).map((t, i) => <li key={i}>{t}</li>)}</ul>
            <div className="text-sm mb-2"><span className="font-semibold">Gap:</span> {d.gap_summary || "None"}</div>
            {d.confidence_score != null && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-[#DCDEE8] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${d.confidence_score}%`, background: d.confidence_score >= 90 ? "#059669" : "#DC2626" }} /></div>
                  <span className="text-sm whitespace-nowrap">{d.confidence_score}/100 confidence</span>
                </div>
                <div className="text-sm font-bold text-[#4F46E5] mt-2">{ACTION_LABEL[d.recommended_action] || ""}</div>
              </>
            )}
          </div>

          {d.already_decided && (
            <div className="rounded-lg p-4" style={{ background: d.auto_executed ? "#EEF0FF" : "#ECFDF5", border: `1px solid ${d.auto_executed ? "#C7D2FE" : "#A7F3D0"}` }}>
              <div className="text-sm font-semibold text-[#12172B] mb-1">{d.auto_executed ? "⚡ Auto-executed by the agent" : "Decision recorded"}</div>
              <div className="text-sm text-[#5B5F73]">{(d.rationale_trace || [])[0] || ""}</div>
              {d.auto_executed && <div className="text-xs text-[#8A90A6] mt-2">Confidence was ≥ 90 with no rule violations, so the agent approved this deal itself — no human click required.</div>}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export function A1Screen3({ initialDealId }) {
  const { dealId, setDealId, options, detail: d, status, error, reload } = useDealSelection(initialDealId);
  const [reviewer, setReviewer] = useState("");
  const [comment, setComment] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [decisionResult, setDecisionResult] = useState(null);
  const [decisionError, setDecisionError] = useState(null);
  const [escalateResult, setEscalateResult] = useState(null);
  const [escalateError, setEscalateError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setDecisionResult(null); setDecisionError(null);
    setEscalateResult(null); setEscalateError(null);
  }, [dealId]);

  async function decide(decision) {
    if (!reviewer.trim()) { setDecisionError("Enter your name as reviewer first."); return; }
    setSubmitting(true);
    setDecisionError(null);
    try {
      const res = await submitDealDecision(dealId, { decision, reviewer, comment });
      setDecisionResult(`Recorded: ${res.decision} by ${res.reviewer}. This deal has left the queue.`);
      reload();
    } catch (err) {
      setDecisionError(err?.message || "Failed to record decision.");
    } finally {
      setSubmitting(false);
    }
  }

  async function escalate() {
    if (!reviewer.trim()) { setEscalateError("Enter your name as reviewer first."); return; }
    if (!toEmail.trim() || !toEmail.includes("@")) { setEscalateError("Enter a valid recipient email address."); return; }
    setSubmitting(true);
    setEscalateError(null);
    try {
      const res = await escalateDealViaEmail(dealId, { to_email: toEmail, reviewer, comment });
      setEscalateResult(`Emailed ${res.emailed_to} — "${res.email_subject}". This deal has left the queue.`);
      reload();
    } catch (err) {
      setEscalateError(err?.message || "Failed to send escalation email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <SectionLabel>Sales Ops Approval — <Dropdown value={dealId} options={options} onChange={setDealId} placeholder="Select a deal…" /></SectionLabel>
      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      {status === "loading" && !d && <div className="text-sm text-[#8A90A6]">Loading…</div>}
      {d && (
        <Card className="p-5 max-w-xl">
          <div className="text-sm text-[#5B5F73] mb-4"><Mono>{d.deal_id}</Mono> — <Field kind="account" id={d.account_name}>{d.account_name}</Field></div>

          {d.already_decided ? (
            <div className="rounded-lg p-4 bg-[#ECFDF5] border border-[#A7F3D0] text-sm text-[#065F46]">
              This deal has already been decided{d.auto_executed ? " (auto-executed by the agent)" : ""}.
            </div>
          ) : (
            <>
              <div className="mb-3">
                <div className="text-xs font-semibold text-[#8A90A6] mb-1">Reviewer name</div>
                <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Sandra K." className="w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="mb-4">
                <div className="text-xs font-semibold text-[#8A90A6] mb-1">Comment (optional)</div>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Notes for the rep or ERP-Integration team..." className="w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm" />
              </div>
              {decisionError && <div className="text-sm text-[#DC2626] mb-3">{decisionError}</div>}
              <div className="flex gap-2 mb-2">
                <ActionButton tone="success" icon={Check} onClick={() => decide("approved")} disabled={submitting}>Approve</ActionButton>
                <ActionButton tone="ghost" onClick={() => decide("returned")} disabled={submitting}>Return to Rep</ActionButton>
              </div>
              {decisionResult && <div className="text-sm text-[#059669] font-medium mb-3">{decisionResult}</div>}

              <div className="mt-5 pt-4 border-t border-[#EDEEF4]">
                <div className="text-xs font-semibold text-[#8A90A6] mb-1">Escalate to (email address)</div>
                <input value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder="erp-integration@company.com" className="w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm mb-2" />
                {escalateError && <div className="text-sm text-[#DC2626] mb-2">{escalateError}</div>}
                <ActionButton tone="danger" icon={X} onClick={escalate} disabled={submitting}>Escalate to ERP-Integration (sends email)</ActionButton>
                {escalateResult && <div className="text-sm text-[#059669] font-medium mt-3">{escalateResult}</div>}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
