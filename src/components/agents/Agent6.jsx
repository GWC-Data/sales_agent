import React, { useEffect, useState } from "react";
import { Check, CircleDot, RefreshCw } from "lucide-react";
import { FULL_CATALOG } from "../../lib/seedData";
import { generateOpportunity, fetchAccountOpportunities, submitOpportunityAction } from "../../lib/agent6";
import { useOpportunities } from "../../hooks/useOpportunities";
import { useAccounts } from "../../hooks/useAccounts";
import { useProductCatalog } from "../../hooks/useProductCatalog";
import { useAccountSignals } from "../../hooks/useAccountSignals";
import { Card, Field, SectionLabel, Table, Sparkline, ExecutionTrace, RunAgentButton, ApprovalPanel, Pill, Dropdown, norm } from "../shared";

/* =========================================================================
   AGENT 6 — AM Cross-Sell / Upsell
========================================================================= */
function formatArr(value) {
  const n = Number(value);
  return value === undefined || value === null || value === "" || Number.isNaN(n) ? "—" : `$${n.toLocaleString()}`;
}
function opportunityStatusTone(status) {
  if (status === "approved") return "approved";
  if (status === "discard") return "discarded";
  if (status === "pending") return "pending";
  return "pending"; // "proposed" or unset
}

// No live usage-trend data source exists yet, so render a stable placeholder
// sparkline seeded by account id instead of leaving the chart empty.
function placeholderTrend(seed, points = 7) {
  let x = String(seed || "seed").split("").reduce((acc, c) => acc + c.charCodeAt(0), 7);
  const rand = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  let v = 40 + rand() * 20;
  const out = [];
  for (let i = 0; i < points; i++) { v = Math.max(5, v + (rand() - 0.5) * 20); out.push(Math.round(v)); }
  return out;
}

export function A6Screen1() {
  const { opportunities, status, error, reload } = useOpportunities();

  return (
    <div>
      <SectionLabel
        right={
          <button
            type="button"
            onClick={reload}
            disabled={status === "loading"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={12} className={status === "loading" ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      >
        Expansion Opportunity Map
      </SectionLabel>

      {status === "loading" && opportunities.length === 0 && (
        <div className="text-sm text-[#8A90A6]">Loading opportunities…</div>
      )}
      {status === "error" && (
        <div className="text-sm text-[#DC2626]">
          Couldn't load opportunities from /api/opportunities{error ? `: ${error}` : "."}
        </div>
      )}
      {status === "success" && opportunities.length === 0 && (
        <div className="text-sm text-[#8A90A6]">No opportunities found yet.</div>
      )}
      {opportunities.length > 0 && (
        <Table
          columns={["Account", "Current Products", "Signal", "Recommended Product", "Potential ARR", "Fit Score", "Status"]}
          rows={opportunities.map((o) => ({
            __id: o.opportunity_id,
            __cells: [
              <span className="font-medium text-[#12172B]">{o.account_name || o.account_id}</span>,
              <span className="text-[#5B5F73]">
                {(() => {
                  const products = (o.current_products || "").split(",").map((p) => p.trim()).filter(Boolean);
                  return products.length === 0
                    ? "—"
                    : products.map((p, i) => (
                        <React.Fragment key={p}>
                          {i > 0 && " + "}
                          <Field kind="product" id={p}>{p}</Field>
                        </React.Fragment>
                      ));
                })()}
              </span>,
              <span className="text-[#5B5F73]">{o.detected_signal || "—"}</span>,
              <span className="text-[#5B5F73]">{o.recommended_product || "—"}</span>,
              <span className="font-semibold text-[#12172B]">{formatArr(o.potential_arr_usd)}</span>,
              <span>{o.fit_score_total || "—"}</span>,
              <Pill tone={opportunityStatusTone(o.status)}>{o.status || "proposed"}</Pill>,
            ],
          }))}
        />
      )}
    </div>
  );
}
export function A6Screen2({ onGenerated }) {
  const { accounts: liveAccounts } = useAccounts();
  const { products: liveProducts } = useProductCatalog();
  const { opportunities } = useOpportunities();

  const accountOptions = liveAccounts
    .map((a) => ({ value: a.account_id || a.account_name, label: a.account_name || a.account_id }))
    .filter((o) => o.value);

  const [selectedAccountId, setSelectedAccountId] = useState(null);
  useEffect(() => {
    if (selectedAccountId || accountOptions.length === 0) return;
    setSelectedAccountId(accountOptions[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountOptions.length]);

  const selectedAccount = liveAccounts.find((a) => (a.account_id || a.account_name) === selectedAccountId);
  const { signals } = useAccountSignals(selectedAccount?.account_id || selectedAccountId);

  // The detected_signals dataset only covers accounts with a raw signal event;
  // the opportunities dataset carries the signal that was actually acted on
  // for accounts that already have an opportunity, so merge both in.
  const matchedOpportunity = selectedAccount && opportunities.find(
    (o) => norm(o.account_id) === norm(selectedAccount.account_id) || norm(o.account_name) === norm(selectedAccount.account_name)
  );
  const signalTexts = signals.map((s) => s.detected_signal).filter(Boolean);
  if (matchedOpportunity?.detected_signal && !signalTexts.some((t) => norm(t) === norm(matchedOpportunity.detected_signal))) {
    signalTexts.push(matchedOpportunity.detected_signal);
  }

  const catalog = liveProducts.length > 0 ? liveProducts.map((p) => p.name || p.product_name).filter(Boolean) : FULL_CATALOG;
  const ownedProducts = new Set((selectedAccount?.products_owned || "").split(",").map(norm).filter(Boolean));
  const trend = placeholderTrend(selectedAccountId);

  // Run Agent triggers the real backend call; the trace below is a cosmetic
  // "thinking" animation shown while it's in flight, not literal agent steps.
  const [runCount, setRunCount] = useState(0);
  const [traceFinished, setTraceFinished] = useState(false);
  const [genStatus, setGenStatus] = useState("idle"); // idle | running | success | error
  const [genError, setGenError] = useState(null);
  const [genResult, setGenResult] = useState(null);

  const accountLabel = selectedAccount?.account_name || selectedAccount?.account_id || "this account";
  const steps = [
    `OBSERVE — Reviewing ${accountLabel}'s signals and current entitlement`,
    `REASON — Entitlement on file: ${ownedProducts.size > 0 ? [...ownedProducts].join(", ") : "none on file"}`,
    `REASON — Checking fit against the ${catalog.length}-product catalog`,
    "DECIDE — Asking the AI agent to draft a recommendation and outreach",
  ];

  async function handleRunAgent() {
    if (!selectedAccount || genStatus === "running") return;
    const accountId = selectedAccount.account_id || selectedAccountId;
    setGenStatus("running");
    setGenError(null);
    setTraceFinished(false);
    setRunCount((n) => n + 1);
    try {
      const result = await generateOpportunity(accountId);
      if (result?.error) { setGenStatus("error"); setGenError(result.error); return; }

      if (result?.skipped) {
        // Not a failure — the agent looked at the account and decided a cross-sell/upsell
        // isn't appropriate right now. Still hand that decision off to Screen 3.
        setGenResult({
          accountId,
          accountName: selectedAccount.account_name || accountId,
          skipped: true,
          reason: result.reason || "The agent found no cross-sell/upsell opportunity to pursue for this account right now.",
        });
        setGenStatus("success");
        return;
      }

      let persistedRow = null;
      try {
        const rows = await fetchAccountOpportunities(accountId);
        persistedRow = Array.isArray(rows) ? rows.find((r) => norm(r.account_id) === norm(accountId)) : null;
      } catch {
        // best-effort enrichment (ARR / fit score) — the generated result is still usable without it
      }

      setGenResult({ accountId, accountName: selectedAccount.account_name || accountId, ...persistedRow, ...result });
      setGenStatus("success");
    } catch (err) {
      setGenStatus("error");
      setGenError(err?.message || "Failed to generate opportunity.");
    }
  }

  // Only fires the redirect once both the (cosmetic) trace animation has
  // played out AND the real generate-opportunity call has actually resolved.
  useEffect(() => {
    if (traceFinished && genStatus === "success" && genResult) onGenerated(genResult);
  }, [traceFinished, genStatus, genResult, onGenerated]);

  return (
    <div>
      <SectionLabel
        right={
          <RunAgentButton
            onClick={handleRunAgent}
            disabled={!selectedAccount || genStatus === "running"}
            label={genStatus === "running" ? "Running…" : "Run Agent"}
          />
        }
      >
        Account Product Gap —{" "}
        <Dropdown
          value={selectedAccountId}
          options={accountOptions}
          onChange={(v) => { setSelectedAccountId(v); setGenStatus("idle"); setGenError(null); }}
          placeholder="Select account…"
          disabled={genStatus === "running"}
        />
      </SectionLabel>
      <ExecutionTrace
        triggerKey={runCount}
        steps={steps}
        onDone={() => setTraceFinished(true)}
        pendingLabel={genStatus === "running" ? "Generating opportunity via AI agent…" : undefined}
        doneLabel={genStatus === "success" ? (genResult?.skipped ? "Agent finished — opening Opportunity + Outreach…" : "Opportunity generated — opening Opportunity + Outreach…") : undefined}
      />
      {genStatus === "error" && genError && (
        <div className="text-sm text-[#DC2626] mb-4">Couldn't generate an opportunity: {genError}</div>
      )}
      <Card className="p-5 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {catalog.map((c) => (
            <div key={c} className="flex items-center gap-2 text-sm">
              {ownedProducts.has(norm(c)) ? <Check size={14} color="#059669" /> : <CircleDot size={14} color="#DCDEE8" />}
              <Field kind="product" id={c} className={ownedProducts.has(norm(c)) ? "text-[#12172B] font-medium" : "text-[#B7BACC]"}>{c}</Field>
            </div>
          ))}
        </div>
        <SectionLabel>Detected signals</SectionLabel>
        {signalTexts.length === 0 ? (
          <div className="text-sm text-[#8A90A6] mb-3">No signals detected for this account.</div>
        ) : (
          <div className="space-y-1 mb-3">
            {signalTexts.map((text, i) => <div key={i} className="text-sm text-[#12172B]">{text}</div>)}
          </div>
        )}
        <SectionLabel>Usage trend</SectionLabel>
        <Sparkline data={trend} color="#059669" />
      </Card>
    </div>
  );
}
export function A6Screen3({ generated, onUpdate }) {
  const [actionStatus, setActionStatus] = useState("idle"); // idle | submitting | error
  const [actionError, setActionError] = useState(null);
  const [toEmails, setToEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!generated || generated.skipped) return;
    setSubject(generated.outreach_subject || "");
    setBody(generated.outreach_draft || "");
    setToEmails("");
  }, [generated?.accountId, generated?.opportunity_id, generated?.skipped]);

  if (!generated) {
    return <div className="text-sm text-[#8A90A6]">Run the agent on the Account Product Gap tab first to generate the opportunity and outreach.</div>;
  }

  if (generated.skipped) {
    return (
      <Card className="p-5 max-w-xl">
        <SectionLabel>Opportunity + Outreach — <Field kind="account" id={generated.accountName}>{generated.accountName}</Field></SectionLabel>
        <div className="rounded-lg p-4 bg-[#FFFBEB] border border-[#FDE68A] text-sm text-[#7A4B0A] leading-relaxed">
          <div className="font-semibold text-[#12172B] mb-1">No opportunity recommended</div>
          {generated.reason}
        </div>
      </Card>
    );
  }

  const decision = generated.status === "approved" ? "approved" : generated.status === "discard" ? "rejected" : generated.status === "pending" ? "pending" : "undecided";
  const locked = decision !== "undecided" || actionStatus === "submitting";

  async function submitAction(action) {
    setActionStatus("submitting");
    setActionError(null);
    try {
      const emails = toEmails.split(",").map((e) => e.trim()).filter(Boolean);
      await submitOpportunityAction(generated.accountId, {
        action,
        outreach_subject: subject,
        outreach_draft: body,
        to_emails: emails.length > 0 ? emails : undefined,
      });
      onUpdate({ status: action, outreach_subject: subject, outreach_draft: body });
      setActionStatus("idle");
    } catch (err) {
      setActionStatus("error");
      setActionError(err?.message || "Failed to record decision.");
    }
  }

  const fieldCls = "w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm disabled:bg-[#FAFAFD] disabled:text-[#8A90A6]";

  return (
    <Card className="p-5 max-w-xl">
      <SectionLabel>Opportunity + Outreach — <Field kind="account" id={generated.accountName}>{generated.accountName}</Field></SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold">Opportunity value</div><div className="font-medium">{formatArr(generated.potential_arr_usd)}</div></div>
        <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold">Product</div><div className="font-medium">{generated.recommended_product || "—"}</div></div>
      </div>
      {generated.reasoning && <div className="text-sm text-[#5B5F73] mb-4">{generated.reasoning}</div>}

      <div className="space-y-3 mb-4">
        <div>
          <div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">To</div>
          <input
            value={toEmails}
            onChange={(e) => setToEmails(e.target.value)}
            disabled={locked}
            placeholder="name@company.com, name2@company.com"
            className={fieldCls}
          />
        </div>
        <div>
          <div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Subject</div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={locked} className={`${fieldCls} font-medium`} />
        </div>
        <div>
          <div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Body</div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} disabled={locked} rows={7} className={`${fieldCls} leading-relaxed`} />
        </div>
      </div>

      {actionStatus === "error" && actionError && <div className="text-sm text-[#DC2626] mb-3">{actionError}</div>}
      <ApprovalPanel
        decision={decision}
        approveLabel="Approve & Create Opportunity"
        pendingLabel="Hold for Edit"
        rejectLabel="Discard"
        disabled={actionStatus === "submitting"}
        onApprove={() => submitAction("approved")}
        onPending={() => submitAction("pending")}
        onReject={() => submitAction("discard")}
      />
    </Card>
  );
}
