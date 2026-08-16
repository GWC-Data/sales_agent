import React, { useCallback, useEffect, useState } from "react";
import { Check, CircleDot, AlertTriangle, MessageSquareText, Play } from "lucide-react";
import {
  fetchOpportunity, fetchTimeline, suggestNextStep, confirmField, previewProposal,
  sendProposal, markClosedLost, advanceStage, fetchOpenCommitments, fulfillCommitment,
  fetchDailyPriorities, analyzeMeetingNote, applyMeetingNote,
} from "../../lib/agent2";
import { useNcaOpportunities, useNcaReps } from "../../hooks/useAgent2";
import { Card, Field, SectionLabel, Dropdown, Pill, ActionButton } from "../shared";

/* =========================================================================
   AGENT 2 — NCA Lead-to-Order Conversion Assistant
========================================================================= */
function fmtMoney(value) {
  const n = Number(value);
  return Number.isNaN(n) ? "—" : `$${n.toLocaleString()}`;
}

export function A2Screen1() {
  const { opportunities } = useNcaOpportunities();
  const [selectedOppId, setSelectedOppId] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [detail, setDetail] = useState(null);
  const [commitments, setCommitments] = useState([]);
  const [sideStatus, setSideStatus] = useState("loading");
  const [error, setError] = useState(null);

  const [lostOpen, setLostOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");

  const [suggestion, setSuggestion] = useState(null);
  const [suggestStatus, setSuggestStatus] = useState("idle");
  const [document, setDocument] = useState(null);
  const [documentBody, setDocumentBody] = useState("");
  const [documentStatus, setDocumentStatus] = useState("idle");

  const opportunityOptions = opportunities.map((o) => ({
    value: o.id, label: `${o.account_name} — ${o.stage} (${fmtMoney(o.deal_value)})`,
  }));

  useEffect(() => {
    if (!selectedOppId && opportunities.length > 0) setSelectedOppId(opportunities[0].id);
  }, [opportunities, selectedOppId]);

  const loadSideData = useCallback(async (id) => {
    if (!id) return;
    setSideStatus("loading");
    setError(null);
    try {
      const [tl, det, comm] = await Promise.all([fetchTimeline(id), fetchOpportunity(id), fetchOpenCommitments(id)]);
      setTimeline(tl);
      setDetail(det);
      setCommitments(comm);
      setSideStatus("success");
    } catch (err) {
      setError(err?.message || "Failed to load opportunity.");
      setSideStatus("error");
    }
  }, []);

  useEffect(() => {
    setSuggestion(null);
    setDocument(null);
    setLostOpen(false);
    setLostReason("");
    loadSideData(selectedOppId);
  }, [selectedOppId, loadSideData]);

  async function handleAsk() {
    setSuggestStatus("loading");
    setError(null);
    setDocument(null);
    try {
      setSuggestion(await suggestNextStep(selectedOppId));
    } catch (err) {
      setError(err?.message || "Failed to get a suggestion.");
    } finally {
      setSuggestStatus("idle");
    }
  }
  async function handleMarkDone(field) {
    try {
      await confirmField(selectedOppId, field);
      setSuggestion(null);
      loadSideData(selectedOppId);
    } catch (err) {
      setError(err?.message || "Failed to confirm field.");
    }
  }
  async function handleDraft() {
    setDocumentStatus("loading");
    setError(null);
    try {
      const doc = await previewProposal(selectedOppId);
      setDocument(doc);
      setDocumentBody(doc.body);
    } catch (err) {
      setError(err?.message || "Failed to draft proposal.");
    } finally {
      setDocumentStatus("idle");
    }
  }
  async function handleAdvance() {
    try {
      await advanceStage(selectedOppId);
      setSuggestion(null);
      loadSideData(selectedOppId);
    } catch (err) {
      setError(err?.message || "Failed to advance stage.");
    }
  }
  async function handleSendProposal() {
    try {
      await sendProposal(selectedOppId, { ...document, body: documentBody });
      setDocument(null);
      setSuggestion(null);
      loadSideData(selectedOppId);
    } catch (err) {
      setError(err?.message || "Failed to send proposal.");
    }
  }
  async function handleFulfill(activityId) {
    try {
      await fulfillCommitment(selectedOppId, activityId);
      loadSideData(selectedOppId);
    } catch (err) {
      setError(err?.message || "Failed to mark commitment done.");
    }
  }
  async function handleConfirmClosedLost() {
    if (!lostReason.trim()) return;
    try {
      await markClosedLost(selectedOppId, lostReason);
      setLostOpen(false);
      setLostReason("");
      loadSideData(selectedOppId);
    } catch (err) {
      setError(err?.message || "Failed to mark deal Closed Lost.");
    }
  }

  const opp = detail?.opportunity;

  return (
    <div>
      <SectionLabel>
        Deal Assistant —{" "}
        <Dropdown value={selectedOppId} options={opportunityOptions} onChange={setSelectedOppId} placeholder="Select an opportunity…" />
      </SectionLabel>
      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      {sideStatus === "loading" && !opp && <div className="text-sm text-[#8A90A6]">Loading…</div>}
      {opp && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#EDEEF4] flex items-center justify-between gap-3 bg-[#FAFAFD] flex-wrap">
                <div className="flex items-center gap-2"><MessageSquareText size={16} color="#4F46E5" /><span className="text-sm font-semibold text-[#12172B]">Conversational Assistant</span></div>
                <ActionButton tone="primary" onClick={handleAsk} disabled={suggestStatus === "loading"}>
                  {suggestStatus === "loading" ? "Checking…" : "Ask agent what's needed to progress"}
                </ActionButton>
              </div>
              <div className="p-4 space-y-3">
                {!suggestion && !document && <div className="text-sm text-[#8A90A6]">Ask the agent what's needed to progress this deal.</div>}
                {suggestion && (
                  <>
                    <div className="flex justify-start"><div className="max-w-[90%] bg-[#F3F4FA] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-[#12172B]">{suggestion.message}</div></div>
                    {suggestion.next_stage && suggestion.missing.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-[#12172B] mb-1.5">Outstanding to reach "{suggestion.next_stage}":</div>
                        <div className="space-y-1.5">
                          {suggestion.missing.map((m) => (
                            <div key={m.field} className="flex items-center justify-between gap-3 text-sm border border-[#EDEEF4] rounded-lg px-3 py-2">
                              <span>{m.label}</span>
                              {m.field === "proposal_shared_date" ? (
                                <ActionButton tone="ghost" onClick={handleDraft} disabled={documentStatus === "loading"}>{documentStatus === "loading" ? "Drafting…" : "Draft it"}</ActionButton>
                              ) : (
                                <ActionButton tone="ghost" icon={Check} onClick={() => handleMarkDone(m.field)}>Mark done</ActionButton>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {suggestion.next_stage && suggestion.missing.length === 0 && (
                      <ActionButton tone="success" icon={Check} onClick={handleAdvance}>Confirm: advance to {suggestion.next_stage}</ActionButton>
                    )}
                  </>
                )}
                {document && (
                  <div className="border-t border-[#EDEEF4] pt-3 mt-3">
                    <div className="text-sm font-semibold text-[#12172B] mb-2">Generated Proposal Preview</div>
                    <textarea
                      className="w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm mb-2"
                      rows={7}
                      value={documentBody}
                      onChange={(e) => setDocumentBody(e.target.value)}
                    />
                    <ActionButton tone="success" icon={Check} onClick={handleSendProposal}>Approve & Send Proposal (advances to Negotiation)</ActionButton>
                  </div>
                )}
              </div>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4">
              <SectionLabel>Stage Progress</SectionLabel>
              <div className="space-y-1 mb-3">
                {(timeline?.stages || []).map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    {s.status === "complete" ? <Check size={14} color="#059669" /> : <CircleDot size={14} color={s.status === "current" ? "#4F46E5" : "#DCDEE8"} />}
                    <span className={s.status === "current" ? "font-semibold text-[#4F46E5]" : s.status === "pending" ? "text-[#B7BACC]" : "text-[#12172B]"}>{s.name}</span>
                  </div>
                ))}
              </div>
              <div className="text-sm text-[#5B5F73] space-y-0.5 border-t border-[#EDEEF4] pt-3">
                <div><span className="font-semibold text-[#12172B]">Account:</span> <Field kind="account" id={opp.account_name}>{opp.account_name}</Field></div>
                <div><span className="font-semibold text-[#12172B]">Rep:</span> {opp.rep_name}</div>
                <div><span className="font-semibold text-[#12172B]">Product:</span> {opp.product_line}</div>
                <div><span className="font-semibold text-[#12172B]">Deal value:</span> {fmtMoney(opp.deal_value)}</div>
              </div>
            </Card>
            <Card className="p-4">
              <SectionLabel>Recent activity</SectionLabel>
              {(detail.activities || []).length === 0 ? <div className="text-sm text-[#8A90A6]">None logged.</div> : (
                <div className="space-y-1.5">
                  {detail.activities.slice(0, 3).map((a) => (
                    <div key={a.id} className="text-xs text-[#8A90A6]">{a.activity_date} · {a.activity_type} — {a.summary}{a.commitment ? ` (promised: ${a.commitment})` : ""}</div>
                  ))}
                </div>
              )}
            </Card>
            {commitments.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#B45309] mb-2"><AlertTriangle size={14} />Open commitments not yet fulfilled</div>
                <div className="space-y-1.5">
                  {commitments.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>{c.commitment} ({c.activity_date})</span>
                      <ActionButton tone="ghost" onClick={() => handleFulfill(c.id)}>Mark done</ActionButton>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {opp.stage !== "Closed Won" && opp.stage !== "Closed Lost" && (
              <Card className="p-4">
                {!lostOpen ? (
                  <button type="button" onClick={() => setLostOpen(true)} className="text-xs text-[#DC2626] underline decoration-dotted underline-offset-2 cursor-pointer">
                    Mark this deal Closed Lost
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      value={lostReason}
                      onChange={(e) => setLostReason(e.target.value)}
                      placeholder="Reason"
                      className="w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm"
                    />
                    <ActionButton tone="danger" onClick={handleConfirmClosedLost} disabled={!lostReason.trim()}>Confirm Closed Lost</ActionButton>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function A2Screen2() {
  const { reps } = useNcaReps();
  const [selectedRep, setSelectedRep] = useState(null);
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedRep && reps.length > 0) setSelectedRep(reps[0]);
  }, [reps, selectedRep]);

  const repOptions = reps.map((r) => ({ value: r, label: r }));

  async function handleRun() {
    if (!selectedRep) return;
    setStatus("loading");
    setError(null);
    setResults(null);
    try {
      setResults(await fetchDailyPriorities(selectedRep));
    } catch (err) {
      setError(err?.message || "Failed to run daily review.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div>
      <SectionLabel
        right={
          <ActionButton tone="primary" icon={Play} onClick={handleRun} disabled={!selectedRep || status === "loading"}>
            {status === "loading" ? "Reviewing…" : "Run daily review"}
          </ActionButton>
        }
      >
        Daily Priorities — <Dropdown value={selectedRep} options={repOptions} onChange={setSelectedRep} placeholder="Select rep…" />
      </SectionLabel>
      <div className="text-xs text-[#8A90A6] mb-3">Instead of manually reviewing every open opportunity, get a ranked list of what to do next.</div>
      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      {results && results.length === 0 && <div className="text-sm text-[#8A90A6]">No open opportunities for this rep.</div>}
      {results && results.length > 0 && (
        <div className="space-y-3 max-w-2xl">
          {results.map((r) => (
            <Card key={r.opportunity_id} className="p-4">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-semibold text-[#12172B]"><Field kind="account" id={r.account_name}>{r.account_name}</Field></span>
                <span className="text-xs text-[#8A90A6]">· {r.stage} · {fmtMoney(r.deal_value)}</span>
                {r.commitments.length > 0 && <Pill tone="pending">unfulfilled commitment</Pill>}
                {r.stale_days >= 10 && <Pill tone="escalated">stale {r.stale_days}d</Pill>}
              </div>
              <div className="text-sm text-[#12172B]">👉 {r.recommended_action}</div>
              <div className="text-xs text-[#8A90A6] mt-1">Based on: {r.pattern}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function A2Screen3({ onActed }) {
  const { opportunities } = useNcaOpportunities();
  const [selectedOppId, setSelectedOppId] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzeStatus, setAnalyzeStatus] = useState("idle");
  const [confirmedFields, setConfirmedFields] = useState({});
  const [commitment, setCommitment] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedOppId && opportunities.length > 0) setSelectedOppId(opportunities[0].id);
  }, [opportunities, selectedOppId]);

  const opportunityOptions = opportunities.map((o) => ({ value: o.id, label: `${o.account_name} — ${o.stage}` }));
  const selectedOpp = opportunities.find((o) => o.id === selectedOppId);

  async function handleAnalyze() {
    if (!noteText.trim()) return;
    setAnalyzeStatus("loading");
    setError(null);
    setSaveMessage(null);
    try {
      const result = await analyzeMeetingNote(selectedOppId, noteText);
      setAnalysis(result);
      setCommitment(result.suggested_commitment || "");
      const initial = {};
      result.suggested_fields.forEach((m) => { initial[m.field] = true; });
      setConfirmedFields(initial);
    } catch (err) {
      setError(err?.message || "Failed to analyze note.");
    } finally {
      setAnalyzeStatus("idle");
    }
  }

  async function handleSave() {
    setSaveStatus("loading");
    setError(null);
    try {
      const fields = Object.entries(confirmedFields).filter(([, v]) => v).map(([k]) => k);
      const result = await applyMeetingNote(selectedOppId, analysis.summary, fields, commitment);
      let msg = `Activity logged for ${selectedOpp?.account_name}.`;
      if (result.advanced) msg += ` Stage advanced to ${result.opportunity.stage}.`;
      setSaveMessage(msg);
      onActed?.(msg);
      setAnalysis(null);
      setNoteText("");
    } catch (err) {
      setError(err?.message || "Failed to save to CRM.");
    } finally {
      setSaveStatus("idle");
    }
  }

  return (
    <Card className="p-5 max-w-2xl">
      <SectionLabel>
        Log a Meeting or Call —{" "}
        <Dropdown
          value={selectedOppId}
          options={opportunityOptions}
          onChange={(v) => { setSelectedOppId(v); setAnalysis(null); setSaveMessage(null); }}
          placeholder="Select opportunity…"
        />
      </SectionLabel>
      <div className="text-xs text-[#8A90A6] mb-3">Paste in notes from a call/meeting (or a recording transcript) — the agent extracts what changed.</div>
      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="What happened in the call/meeting?"
        rows={5}
        className="w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm mb-3"
      />
      <ActionButton tone="primary" onClick={handleAnalyze} disabled={!noteText.trim() || analyzeStatus === "loading"}>
        {analyzeStatus === "loading" ? "Analyzing…" : "Analyze note"}
      </ActionButton>

      {analysis && (
        <div className="mt-4 border-t border-[#EDEEF4] pt-4">
          <div className="text-sm mb-3"><span className="font-semibold">Summary to log:</span> {analysis.summary}</div>
          {analysis.suggested_fields.length === 0 ? (
            <div className="text-sm text-[#8A90A6] mb-3">No pending fields detected as satisfied by this note.</div>
          ) : (
            <div className="mb-3">
              <div className="text-sm font-semibold text-[#12172B] mb-1.5">Fields this note appears to satisfy (uncheck any that aren't actually confirmed):</div>
              <div className="space-y-1.5">
                {analysis.suggested_fields.map((m) => (
                  <label key={m.field} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!confirmedFields[m.field]}
                      onChange={(e) => setConfirmedFields((prev) => ({ ...prev, [m.field]: e.target.checked }))}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="mb-3">
            <div className="text-xs font-semibold text-[#8A90A6] mb-1">New commitment made to the customer (edit/clear if wrong)</div>
            <input value={commitment} onChange={(e) => setCommitment(e.target.value)} className="w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm" />
          </div>
          <ActionButton tone="success" icon={Check} onClick={handleSave} disabled={saveStatus === "loading"}>
            {saveStatus === "loading" ? "Saving…" : "Confirm & save to CRM"}
          </ActionButton>
        </div>
      )}
      {saveMessage && <div className="mt-4 text-sm text-[#059669] font-medium">{saveMessage}</div>}
    </Card>
  );
}
