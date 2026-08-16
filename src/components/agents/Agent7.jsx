import React, { useEffect, useState } from "react";
import { Check, X, Target } from "lucide-react";
import {
  fetchRepGapAnalysis, fetchRepDetail, createCoachingTask, createRecognitionNomination, decideRecognitionNomination,
} from "../../lib/agent7";
import { useCoachingDashboard, useCoachingReps, useCoachingTasks, useRecognitionNominations } from "../../hooks/useAgent7";
import { Pill, Card, SectionLabel, MetricRow, Table, TrendChart, ActionButton, Dropdown } from "../shared";

/* =========================================================================
   AGENT 7 — Sales Rep Performance & Coaching Trigger
========================================================================= */
const GAP_TONE = { "Below Target": "high", "On Target": "low", "Exceeding Target": "medium" };
const metricLabel = (metric) => (metric === "conversion_ratio" ? "Conversion Ratio" : "Churn Rate");
function fmtMoney(value) {
  const n = Number(value);
  return Number.isNaN(n) ? "—" : `$${n.toLocaleString()}`;
}
function fmtPct(value) {
  return value === null || value === undefined ? "-" : `${value > 0 ? "+" : ""}${value}%`;
}

export function A7Screen1() {
  const { rows, metrics, status, error } = useCoachingDashboard();

  return (
    <div>
      <MetricRow metrics={[
        { label: "Reps below target", value: String(metrics.reps_below_target ?? 0) },
        { label: "Avg gap size (below-target reps)", value: String(metrics.avg_gap_size ?? 0) },
      ]} />
      <SectionLabel>Rep Performance Dashboard</SectionLabel>
      {status === "loading" && rows.length === 0 && <div className="text-sm text-[#8A90A6]">Loading…</div>}
      {status === "error" && <div className="text-sm text-[#DC2626]">Couldn't load the dashboard{error ? `: ${error}` : "."}</div>}
      {rows.length > 0 && (
        <Table
          columns={["Rep", "Role", "Primary Metric", "Latest", "Target", "Gap", "Deal Value", "Deal Value vs Target", "Gap Flag"]}
          rows={rows.map((r) => ({
            __id: r.rep_id,
            __cells: [
              <span className="font-medium text-[#12172B]">{r.name}</span>,
              r.role,
              metricLabel(r.metric),
              r.latest_value,
              r.target_value,
              r.gap,
              fmtMoney(r.deal_value_latest),
              fmtPct(r.deal_value_gap_pct),
              <Pill tone={GAP_TONE[r.status] || "pending"}>{r.status}</Pill>,
            ],
          }))}
        />
      )}
      <div className="text-xs text-[#8A90A6] mt-2">Open Rep Detail to see the trend chart, or go to the Approval tab to act on a flagged rep.</div>
    </div>
  );
}

export function A7Screen2() {
  const { reps } = useCoachingReps();
  const [selectedRepId, setSelectedRepId] = useState(null);
  const [g, setG] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const repOptions = reps.map((r) => ({ value: r.id, label: `${r.name} (${r.role})` }));

  useEffect(() => {
    if (!selectedRepId && reps.length > 0) setSelectedRepId(reps[0].id);
  }, [reps, selectedRepId]);

  useEffect(() => {
    if (!selectedRepId) return;
    let cancelled = false;
    setStatus("loading");
    setError(null);
    fetchRepGapAnalysis(selectedRepId)
      .then((res) => { if (!cancelled) { setG(res); setStatus("success"); } })
      .catch((err) => { if (!cancelled) { setError(err?.message || "Failed to load rep detail."); setStatus("error"); } });
    return () => { cancelled = true; };
  }, [selectedRepId]);

  return (
    <div>
      <SectionLabel>Rep Detail — <Dropdown value={selectedRepId} options={repOptions} onChange={setSelectedRepId} placeholder="Select a rep…" /></SectionLabel>
      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      {status === "loading" && !g && <div className="text-sm text-[#8A90A6]">Loading…</div>}
      {g && (
        <Card className="p-5 max-w-3xl">
          <div className="text-sm text-[#5B5F73] mb-1">{g.name} — {g.role} — manager: {g.manager_name}</div>
          <div className="flex items-center gap-2 mb-4"><Pill tone={GAP_TONE[g.status] || "pending"}>{g.status}</Pill></div>

          <TrendChart
            height={220}
            data={g.periods.map((p, i) => ({ period: p, metric: g.metric_series[i], target: g.target_value }))}
            lines={[
              { key: "metric", label: metricLabel(g.metric), color: "#4F46E5" },
              { key: "target", label: "Target", color: "#DC2626" },
            ]}
          />

          <MetricRow metrics={[
            { label: metricLabel(g.metric), value: String(g.latest_value), sub: `Gap: ${g.gap}` },
            { label: "Deal Value", value: fmtMoney(g.deal_value_latest), sub: `${fmtPct(g.deal_value_gap_pct)} vs target` },
            { label: "Activity Volume Trend", value: g.activity_trend },
          ]} />

          <SectionLabel>Gap breakdown</SectionLabel>
          <ul className="text-sm text-[#5B5F73] list-disc pl-4 space-y-1">
            <li>Metric trend: <b>{g.metric_trend}</b> over the last {g.periods.length} periods</li>
            <li>Activity volume trend: <b>{g.activity_trend}</b></li>
            <li>Deal value vs target: <b>{fmtPct(g.deal_value_gap_pct)}</b></li>
          </ul>
        </Card>
      )}
    </div>
  );
}

export function A7Screen3({ onActed }) {
  const { reps } = useCoachingReps();
  const { tasks, reload: reloadTasks } = useCoachingTasks();
  const { nominations, reload: reloadNominations } = useRecognitionNominations();
  const [selectedRepId, setSelectedRepId] = useState(null);
  const [review, setReview] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("idle");
  const [note, setNote] = useState("");
  const [actionStatus, setActionStatus] = useState("idle");
  const [actionMessage, setActionMessage] = useState(null);
  const [error, setError] = useState(null);

  const repOptions = reps.map((r) => ({ value: r.id, label: `${r.name} (${r.role})` }));

  useEffect(() => {
    if (!selectedRepId && reps.length > 0) setSelectedRepId(reps[0].id);
  }, [reps, selectedRepId]);

  useEffect(() => {
    setReview(null);
    setActionMessage(null);
    setNote("");
  }, [selectedRepId]);

  async function handleRunReview() {
    setReviewStatus("loading");
    setError(null);
    try {
      setReview(await fetchRepDetail(selectedRepId));
    } catch (err) {
      setError(err?.message || "Failed to run performance review.");
    } finally {
      setReviewStatus("idle");
    }
  }

  async function handleCoach() {
    setActionStatus("loading");
    setError(null);
    try {
      const task = await createCoachingTask(selectedRepId, note);
      const msg = `Coaching task ${task.id} created and assigned to ${task.manager_name}.`;
      setActionMessage(msg);
      onActed?.(msg);
      setReview(null);
      reloadTasks();
    } catch (err) {
      setError(err?.message || "Failed to create coaching task.");
    } finally {
      setActionStatus("idle");
    }
  }
  async function handleRecognize() {
    setActionStatus("loading");
    setError(null);
    try {
      const nomination = await createRecognitionNomination(selectedRepId, note);
      const msg = `Recognition nomination ${nomination.id} routed to SLT for review.`;
      setActionMessage(msg);
      onActed?.(msg);
      setReview(null);
      reloadNominations();
    } catch (err) {
      setError(err?.message || "Failed to nominate for recognition.");
    } finally {
      setActionStatus("idle");
    }
  }
  async function handleDecide(nominationId, approved) {
    try {
      await decideRecognitionNomination(nominationId, approved);
      reloadNominations();
    } catch (err) {
      setError(err?.message || "Failed to record decision.");
    }
  }

  const repName = (repId) => reps.find((r) => r.id === repId)?.name || repId;

  return (
    <div>
      <SectionLabel>Coaching / Recognition Approval Card — <Dropdown value={selectedRepId} options={repOptions} onChange={setSelectedRepId} placeholder="Select a rep…" /></SectionLabel>
      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      <Card className="p-5 max-w-2xl mb-6">
        <ActionButton tone="primary" onClick={handleRunReview} disabled={reviewStatus === "loading"}>
          {reviewStatus === "loading" ? "Diagnosing…" : "Run AI performance review"}
        </ActionButton>

        {review && (
          <div className="mt-4">
            <Pill tone={GAP_TONE[review.status] || "pending"}>{review.status}</Pill>
            <div className="bg-[#F3F4FA] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-[#12172B] mt-3 mb-3">{review.diagnosis}</div>

            {review.recommended_action === "Create Coaching Task" && (
              <div className="space-y-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Comment (optional)" className="w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm" />
                <ActionButton tone="primary" icon={Target} onClick={handleCoach} disabled={actionStatus === "loading"}>Create Coaching Task</ActionButton>
              </div>
            )}
            {review.recommended_action === "Nominate for Recognition" && (
              <div className="space-y-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Comment (optional)" className="w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm" />
                <ActionButton tone="success" icon={Check} onClick={handleRecognize} disabled={actionStatus === "loading"}>Nominate for Recognition</ActionButton>
              </div>
            )}
            {review.recommended_action === "None" && (
              <div className="text-sm text-[#4F46E5] bg-[#EEF0FF] border border-[#C7D2FE] rounded-lg p-3">This rep is on target — no coaching or recognition action recommended.</div>
            )}
          </div>
        )}
        {actionMessage && <div className="text-sm text-[#059669] font-medium mt-3">{actionMessage}</div>}
      </Card>

      <SectionLabel>Open Coaching Tasks (Manager Queue)</SectionLabel>
      {tasks.length === 0 ? <div className="text-sm text-[#8A90A6] mb-6">No coaching tasks yet.</div> : (
        <div className="mb-6">
          <Table
            columns={["Task ID", "Rep", "Manager", "Gap Summary", "Created", "Status"]}
            rows={tasks.map((t) => ({
              __id: t.id,
              __cells: [<span className="font-mono text-xs text-[#5B5F73]">{t.id}</span>, repName(t.rep_id), t.manager_name, t.gap_summary, t.created_date, <Pill tone="pending">{t.status}</Pill>],
            }))}
          />
        </div>
      )}

      <SectionLabel>Recognition Nominations (SLT Review Queue)</SectionLabel>
      {nominations.length === 0 ? <div className="text-sm text-[#8A90A6]">No recognition nominations yet.</div> : (
        <div className="space-y-3 max-w-2xl">
          {nominations.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="text-sm font-semibold text-[#12172B]">{repName(n.rep_id)} — {n.note}</div>
              <div className="text-xs text-[#8A90A6] mt-1">Submitted {n.created_date} — Status: {n.status}</div>
              {n.status === "Pending SLT Review" && (
                <div className="flex gap-2 mt-2">
                  <ActionButton tone="success" icon={Check} onClick={() => handleDecide(n.id, true)}>Approve</ActionButton>
                  <ActionButton tone="danger" icon={X} onClick={() => handleDecide(n.id, false)}>Reject</ActionButton>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
