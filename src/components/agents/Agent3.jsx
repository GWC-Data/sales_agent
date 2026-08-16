import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, Check } from "lucide-react";
import { DISPLAY } from "../../lib/constants";
import { fetchBriefing, transcribeAudio, submitCallNotes, approveActions } from "../../lib/agent3";
import { useUpcomingMeetings } from "../../hooks/useAgent3";
import { Pill, Card, Field, SectionLabel, Sparkline, ActionButton, Table } from "../shared";

/* =========================================================================
   AGENT 3 — AM Account Context Assembly & Post-Call Action
========================================================================= */
const URGENCY_ORDER = { high: 0, medium: 1, low: 2 };
const URGENCY_TONE = { high: "escalated", medium: "pending", low: "cleared" };
const SENTIMENT_TONE = { positive: "low", cautiously_positive: "low", neutral: "pending", at_risk: "medium", negative: "high" };

function fmtWhen(dt) {
  const d = new Date(String(dt).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return dt;
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function A3Screen1({ onStartCall }) {
  const { meetings } = useUpcomingMeetings();
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const meeting = meetings.find((m) => m.account_id === activeAccountId);

  async function selectAccount(accountId) {
    setActiveAccountId(accountId);
    setStatus("loading");
    setError(null);
    setBriefing(null);
    try {
      setBriefing(await fetchBriefing(accountId));
      setStatus("success");
    } catch (err) {
      setError(err?.message || "Failed to load briefing.");
      setStatus("error");
    }
  }

  const talkingPoints = briefing ? [...(briefing.talking_points || [])].sort((a, b) => (URGENCY_ORDER[a.urgency] ?? 3) - (URGENCY_ORDER[b.urgency] ?? 3)) : [];
  const upsell = briefing?.upsell_candidate || {};

  return (
    <div>
      <SectionLabel>Customer 360 Brief</SectionLabel>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <div className="text-xs font-semibold text-[#8A90A6] uppercase mb-2">Upcoming calls</div>
          <div className="space-y-2">
            {meetings.length === 0 && <div className="text-sm text-[#8A90A6]">No upcoming meetings found.</div>}
            {meetings.map((m) => (
              <button
                key={m.account_id}
                type="button"
                onClick={() => selectAccount(m.account_id)}
                className={`w-full text-left p-3 rounded-lg border text-sm cursor-pointer transition-colors ${m.account_id === activeAccountId ? "border-[#4F46E5] bg-[#EEF0FF]" : "border-[#EDEEF4] bg-white hover:bg-[#FAFAFD]"}`}
              >
                <div className="flex items-center justify-between font-semibold text-[#12172B]">{m.account_name}<Pill tone="pending">{m.tier}</Pill></div>
                <div className="text-xs text-[#8A90A6] mt-0.5">AM: {m.am_rep}</div>
                <div className="text-xs text-[#8A90A6]">{m.meeting_type}</div>
                <div className="text-xs text-[#B7BACC] mt-1">{fmtWhen(m.scheduled_datetime)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {!activeAccountId && <Card className="p-5 text-sm text-[#8A90A6]">Select a customer on the left to load their pre-call briefing.</Card>}
          {status === "loading" && <Card className="p-5 text-sm text-[#8A90A6]">Assembling account context and generating talking points…</Card>}
          {error && <Card className="p-5 text-sm text-[#DC2626]">Failed to load briefing: {error}</Card>}
          {briefing && meeting && (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-[#12172B]" style={{ fontFamily: DISPLAY }}>{briefing.account_name}</div>
                    <div className="text-xs text-[#8A90A6]">{meeting.tier} tier · AM: {meeting.am_rep} · {meeting.meeting_type}</div>
                  </div>
                  <ActionButton tone="primary" onClick={() => onStartCall({ account_id: briefing.account_id, account_name: briefing.account_name, meeting_id: meeting.meeting_id, am_rep: meeting.am_rep })}>Start Call →</ActionButton>
                </div>
              </Card>

              {(briefing.opening_line || briefing.pitch_strategy) && (
                <Card className="p-4" style={{ borderColor: "#C7D2FE" }}>
                  <div className="text-sm font-semibold text-[#4F46E5] mb-2">✨ How to run this call</div>
                  {briefing.opening_line && <div className="italic text-sm text-[#12172B] mb-2">"{briefing.opening_line}"</div>}
                  {briefing.pitch_strategy && <div className="text-sm text-[#5B5F73]">{briefing.pitch_strategy}</div>}
                </Card>
              )}

              <Card className="p-4">
                <SectionLabel>Talking points</SectionLabel>
                {talkingPoints.length === 0 ? <div className="text-sm text-[#8A90A6]">No talking points generated.</div> : (
                  <div className="space-y-1.5">
                    {talkingPoints.map((tp, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Pill tone={URGENCY_TONE[tp.urgency] || "pending"}>{tp.urgency}</Pill>
                        <span>{tp.point}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <SectionLabel>Upsell candidate</SectionLabel>
                {upsell.recommended_product ? (
                  <>
                    <div className="flex items-center justify-between mb-2"><span className="font-semibold text-[#12172B]">{upsell.recommended_product}</span><span className="text-xs text-[#8A90A6]">fit score {upsell.fit_score ?? "—"}/100</span></div>
                    <div className="h-2 rounded-full bg-[#DCDEE8] overflow-hidden mb-2"><div className="h-full rounded-full bg-[#4F46E5]" style={{ width: `${upsell.fit_score ?? 0}%` }} /></div>
                    <div className="text-sm text-[#8A90A6]">{upsell.reasoning || ""}</div>
                  </>
                ) : <div className="text-sm text-[#8A90A6]">No confident upsell candidate for this account right now.</div>}
              </Card>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card className="p-3"><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Invoice status</div><Pill tone={/overdue|over 30/i.test(briefing.invoice_status || "") ? "escalated" : "cleared"}>{briefing.invoice_status}</Pill></Card>
                <Card className="p-3"><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">DSO (days)</div><div className="text-lg font-bold" style={{ fontFamily: DISPLAY }}>{briefing.dso_days ?? "—"}</div></Card>
                <Card className="p-3">
                  <div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Usage trend (12wk)</div>
                  <div className="text-sm mb-1">{briefing.usage_direction === "up" ? "↑ Up" : briefing.usage_direction === "down" ? "↓ Down" : "→ Flat"}</div>
                  {briefing.usage_trend?.length > 1 && <Sparkline data={briefing.usage_trend} color="#4F46E5" />}
                </Card>
                <Card className="p-3"><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Open tickets</div><div className="text-lg font-bold" style={{ fontFamily: DISPLAY }}>{(briefing.open_tickets || []).length}</div></Card>
                <Card className="p-3"><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Sentiment</div><Pill tone={SENTIMENT_TONE[briefing.customer_sentiment] || "pending"}>{briefing.sentiment_label || briefing.customer_sentiment || "—"}</Pill></Card>
                <Card className="p-3"><div className="text-[11px] text-[#8A90A6] uppercase font-semibold mb-1">Recent interaction</div><div className="text-sm">{briefing.last_interaction ? `${briefing.last_interaction.type} ${briefing.last_interaction.days_ago}d ago` : "—"}</div></Card>
              </div>

              {(briefing.sentiment_reason || briefing.recent_signal) && (
                <Card className="p-4 text-sm space-y-2">
                  {briefing.sentiment_reason && <div><span className="font-semibold">Sentiment read:</span> <span className="text-[#5B5F73]">{briefing.sentiment_reason}</span></div>}
                  {briefing.recent_signal && <div className="bg-[#FAFAFD] rounded-lg p-3"><span className="font-semibold">Recent signal:</span> {briefing.recent_signal}</div>}
                </Card>
              )}

              <Card className="p-4">
                <SectionLabel>Open tickets</SectionLabel>
                {(briefing.open_tickets || []).length === 0 ? <div className="text-sm text-[#8A90A6]">No open tickets.</div> : (
                  <Table columns={["ID", "Priority", "Subject", "Product"]} rows={briefing.open_tickets.map((t, i) => ({ __id: i, __cells: [t.ticket_id, t.priority, t.subject, t.product_area] }))} />
                )}
              </Card>

              <Card className="p-4">
                <SectionLabel>Contract</SectionLabel>
                {briefing.contract ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-2">
                    <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold">Bundle</div><div>{briefing.contract.product_bundle}</div></div>
                    <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold">ARR</div><div>${Number(briefing.contract.arr).toLocaleString()}</div></div>
                    <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold">Renewal</div><div>{briefing.contract.renewal_date}</div></div>
                    <div><div className="text-[11px] text-[#8A90A6] uppercase font-semibold">Billing</div><div>{briefing.contract.billing_model}</div></div>
                  </div>
                ) : <div className="text-sm text-[#8A90A6]">No contract on file.</div>}
                <div className="text-xs text-[#8A90A6]">Owned products: {(briefing.owned_products || []).join(", ") || "none"}</div>
              </Card>

              {briefing.trace?.length > 0 && (
                <details>
                  <summary className="text-xs font-semibold text-[#8A90A6] uppercase tracking-wide cursor-pointer">Agent execution trace</summary>
                  <ul className="text-xs text-[#8A90A6] list-disc pl-4 mt-2 space-y-0.5">{briefing.trace.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function A3Screen2({ initialContext, onSubmitted }) {
  const [accountId, setAccountId] = useState(initialContext?.account_id || "");
  const [meetingId, setMeetingId] = useState(initialContext?.meeting_id || "");
  const [amRep, setAmRep] = useState(initialContext?.am_rep || "");
  const [notesText, setNotesText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [recStatus, setRecStatus] = useState(null); // null | "transcribing" | "done"
  const [recError, setRecError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (initialContext) {
      setAccountId(initialContext.account_id || "");
      setMeetingId(initialContext.meeting_id || "");
      setAmRep(initialContext.am_rep || "");
    }
  }, [initialContext]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  function fmtTimer(s) {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  }

  async function toggleRecording() {
    setRecError(null);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      return;
    }
    if (!accountId.trim()) {
      setRecError("Enter an Account ID before recording.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mimeType = window.MediaRecorder?.isTypeSupported?.("audio/webm") ? "audio/webm" : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
        setRecording(false);
        setRecStatus("transcribing");
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        try {
          const res = await transcribeAudio(accountId.trim(), blob);
          setNotesText((prev) => (prev ? `${prev}\n${res.transcribed_text}` : res.transcribed_text));
          setRecStatus("done");
        } catch (err) {
          setRecError(`Transcription failed: ${err?.message || "unknown error"}`);
          setRecStatus(null);
        }
      };

      recorder.start();
      setRecSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch (err) {
      setRecError(`Microphone access failed: ${err?.message || "unknown error"}`);
    }
  }

  async function submitNotes() {
    setSubmitError(null);
    if (!accountId.trim() || !meetingId.trim() || !amRep.trim() || !notesText.trim()) {
      setSubmitError("Fill in Account ID, Meeting ID, AM Rep, and call notes before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitCallNotes(accountId.trim(), { meetingId: meetingId.trim(), amRep: amRep.trim(), notesText: notesText.trim() });
      onSubmitted({
        batch_id: `${res.call_notes_log_id}-${accountId.trim()}`,
        call_notes_log_id: res.call_notes_log_id,
        account_id: accountId.trim(),
        account_name: initialContext?.account_id === accountId.trim() ? initialContext.account_name : accountId.trim(),
        meeting_id: meetingId.trim(),
        am_rep: amRep.trim(),
        notes_text: res.notes_text,
        created_at: new Date().toISOString(),
        actions: res.extracted_actions.map((a, i) => ({ ...a, _id: i, _checked: true })),
      });
      setNotesText("");
    } catch (err) {
      setSubmitError(err?.message || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm";

  return (
    <div className="max-w-2xl">
      <SectionLabel>Call Notes &amp; Action Capture</SectionLabel>
      <div className="text-xs text-[#8A90A6] mb-4">Enter the account you're on a call with, record or type your notes, then submit to extract suggested follow-up actions.</div>

      <Card className="p-4 mb-4">
        <div className="text-sm font-semibold text-[#12172B] mb-2">Account</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div><div className="text-xs font-semibold text-[#8A90A6] mb-1">Account ID</div><input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="ACC-004" className={inputCls} /></div>
          <div><div className="text-xs font-semibold text-[#8A90A6] mb-1">Meeting ID</div><input value={meetingId} onChange={(e) => setMeetingId(e.target.value)} placeholder="MTG-404" className={inputCls} /></div>
        </div>
        <div className="text-xs font-semibold text-[#8A90A6] mb-1">AM Rep</div>
        <input value={amRep} onChange={(e) => setAmRep(e.target.value)} placeholder="Ananya S." className={inputCls} />
        {initialContext?.account_name && <div className="text-xs text-[#4F46E5] mt-2">Selected from briefing: {initialContext.account_name}</div>}
      </Card>

      <Card className="p-4 mb-4">
        <div className="text-sm font-semibold text-[#12172B] mb-1">Voice notes</div>
        <div className="text-xs text-[#8A90A6] mb-3">Optional — record while on the call, or skip and type notes directly below.</div>
        <div className="flex items-center gap-3">
          <ActionButton tone={recording ? "danger" : "primary"} icon={recording ? Square : Mic} onClick={toggleRecording}>{recording ? "Stop Recording" : "Start Recording"}</ActionButton>
          {recording && <span className="text-sm text-[#DC2626]">● {fmtTimer(recSeconds)}</span>}
          {recStatus === "transcribing" && <span className="text-sm text-[#8A90A6]">Transcribing…</span>}
          {recStatus === "done" && <span className="text-sm text-[#059669]">Transcribed ✓</span>}
        </div>
        {recError && <div className="text-sm text-[#DC2626] mt-2">{recError}</div>}
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-[#12172B] mb-2">Call notes</div>
        <textarea
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          rows={5}
          placeholder="Type or dictate call notes here — e.g. 'Discussed the DNSWatch ticket, they want it resolved before renewal.'"
          className={inputCls}
        />
        {submitError && <div className="text-sm text-[#DC2626] mt-2">{submitError}</div>}
        <div className="mt-3">
          <ActionButton tone="primary" onClick={submitNotes} disabled={submitting}>{submitting ? "Extracting actions…" : "Submit Notes & Extract Actions"}</ActionButton>
        </div>
      </Card>
    </div>
  );
}

export function A3Screen3({ pendingBatches, submittedBatches, onUpdatePending, onApproved }) {
  const [errors, setErrors] = useState({});

  function toggleAction(batchId, actionId) {
    onUpdatePending(pendingBatches.map((b) => (
      b.batch_id !== batchId ? b : { ...b, actions: b.actions.map((a) => (a._id === actionId ? { ...a, _checked: !a._checked } : a)) }
    )));
  }
  function editAction(batchId, actionId, value) {
    onUpdatePending(pendingBatches.map((b) => (
      b.batch_id !== batchId ? b : { ...b, actions: b.actions.map((a) => (a._id === actionId ? { ...a, description: value } : a)) }
    )));
  }
  function discardBatch(batchId) {
    onUpdatePending(pendingBatches.filter((b) => b.batch_id !== batchId));
  }
  async function approveBatch(batch) {
    const checked = batch.actions.filter((a) => a._checked);
    if (checked.length === 0) {
      setErrors((e) => ({ ...e, [batch.batch_id]: "Check at least one action to approve." }));
      return;
    }
    try {
      const payload = {
        call_notes_log_id: batch.call_notes_log_id,
        am_rep: batch.am_rep,
        actions: checked.map(({ type, description, linked_ticket_id, linked_product }) => ({ type, description, linked_ticket_id: linked_ticket_id || null, linked_product: linked_product || null })),
      };
      const res = await approveActions(batch.account_id, payload);
      onApproved(batch, res.written_tasks);
      setErrors((e) => ({ ...e, [batch.batch_id]: null }));
    } catch (err) {
      setErrors((e) => ({ ...e, [batch.batch_id]: err?.message || "Approve failed." }));
    }
  }

  return (
    <div>
      <SectionLabel>Post-Call Action Approval</SectionLabel>
      <div className="text-xs text-[#8A90A6] mb-4">Review what the agent extracted from each call. Uncheck anything to discard it, edit descriptions inline, then approve — only checked items get written to the CRM log.</div>

      {pendingBatches.length === 0 ? (
        <Card className="p-5 text-sm text-[#8A90A6] mb-6">No pending action batches. Submit call notes on the Meeting / Call Capture tab first.</Card>
      ) : (
        <div className="space-y-4 mb-6">
          {pendingBatches.map((batch) => (
            <Card key={batch.batch_id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm"><span className="font-semibold text-[#12172B]">{batch.account_name}</span><span className="text-xs text-[#8A90A6]"> · {batch.account_id} · {batch.meeting_id} · logged by {batch.am_rep}</span></div>
                <span className="text-xs text-[#8A90A6]">{new Date(batch.created_at).toLocaleString()}</span>
              </div>
              <details className="mb-3">
                <summary className="text-xs text-[#8A90A6] cursor-pointer">Call notes</summary>
                <div className="text-sm text-[#5B5F73] mt-1 whitespace-pre-wrap">{batch.notes_text}</div>
              </details>
              <div className="space-y-2 mb-3">
                {batch.actions.map((a) => (
                  <div key={a._id} className={`flex items-start gap-2 p-2 rounded-lg border ${a._checked ? "border-[#EDEEF4]" : "border-[#EDEEF4] opacity-50"}`}>
                    <input type="checkbox" checked={a._checked} onChange={() => toggleAction(batch.batch_id, a._id)} className="mt-1" />
                    <div className="flex-1">
                      <input value={a.description} onChange={(e) => editAction(batch.batch_id, a._id, e.target.value)} className="w-full text-sm border border-transparent hover:border-[#DCDEE8] focus:border-[#DCDEE8] rounded px-1 py-0.5" />
                      <div className="flex gap-1.5 mt-1">
                        <Pill tone="pending">{a.type}</Pill>
                        {a.linked_ticket_id && <span className="text-xs text-[#8A90A6]">{a.linked_ticket_id}</span>}
                        {a.linked_product && <span className="text-xs text-[#8A90A6]">{a.linked_product}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors[batch.batch_id] && <div className="text-sm text-[#DC2626] mb-2">{errors[batch.batch_id]}</div>}
              <div className="flex gap-2">
                <ActionButton tone="success" icon={Check} onClick={() => approveBatch(batch)}>Approve Checked ({batch.actions.filter((a) => a._checked).length})</ActionButton>
                <ActionButton tone="danger" onClick={() => discardBatch(batch.batch_id)}>Discard All</ActionButton>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="text-sm font-semibold text-[#12172B] mb-2">Recently submitted</div>
      {submittedBatches.length === 0 ? <div className="text-sm text-[#8A90A6]">Nothing submitted to the CRM log yet this session.</div> : (
        <div className="space-y-3">
          {submittedBatches.map((batch, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[#12172B] text-sm">{batch.account_name}</span>
                <span className="text-xs text-[#8A90A6]">{new Date(batch.created_at).toLocaleString()}</span>
              </div>
              <Table columns={["Task ID", "Type", "Description", "Status"]} rows={batch.written_tasks.map((t) => ({ __id: t.task_id, __cells: [<span className="font-mono text-xs">{t.task_id}</span>, <Pill tone="pending">{t.type}</Pill>, t.description, t.status] }))} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
