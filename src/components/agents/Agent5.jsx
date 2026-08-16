import React, { useEffect, useState } from "react";
import { Send, Check, AlertTriangle, Info } from "lucide-react";
import {
  submitApplication, reviewApplication, approveApplication, rejectApplication, requestMoreInfo,
} from "../../lib/agent5";
import { usePartnerApplications, useApplicationsQueue, useProgramCriteria } from "../../hooks/useAgent5";
import { Card, Field, SectionLabel, Pill, ActionButton, Dropdown, MetricRow, Table } from "../shared";

/* =========================================================================
   AGENT 5 — Distributor & Reseller (MSP) Partner Onboarding
========================================================================= */
const MATCH_TONE = { Cleared: "cleared", Exception: "exception", "Info Requested": "moreinfo" };
const CURRENT_TONE = { Pending: "pending", Approved: "approved", Rejected: "rejected", "Info Requested": "moreinfo" };

const EMPTY_FORM = {
  track: "Distributor",
  company_name: "", geography: "", contact_name: "", contact_email: "",
  is_wholesale_only: true, sells_direct: true, has_managed_services: false,
  volume_or_accounts: 20, notes: "",
};

export function A5Screen1() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function setTrack(track) {
    setForm((f) => ({
      ...f, track,
      volume_or_accounts: track === "Distributor" ? 20 : 10,
      is_wholesale_only: track === "Distributor",
      sells_direct: track === "Reseller/MSP",
      has_managed_services: false,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!form.company_name || !form.contact_name || !form.contact_email || !form.geography) {
      setError("Please fill in company name, contact name, contact email, and geography.");
      return;
    }
    setStatus("loading");
    try {
      const created = await submitApplication({
        company_name: form.company_name, contact_name: form.contact_name, contact_email: form.contact_email,
        requested_track: form.track, geography: form.geography,
        is_wholesale_only: form.track === "Distributor" ? form.is_wholesale_only : false,
        sells_direct: form.track === "Reseller/MSP" ? form.sells_direct : false,
        has_managed_services: form.track === "Reseller/MSP" ? form.has_managed_services : false,
        volume_or_accounts: Number(form.volume_or_accounts) || 0,
        notes: form.notes,
      });
      setMessage(`Application ${created.id} submitted for ${created.company_name}. Check the Applications Queue.`);
      setForm({ ...EMPTY_FORM, track: form.track, volume_or_accounts: form.track === "Distributor" ? 20 : 10 });
    } catch (err) {
      setError(err?.message || "Failed to submit application.");
    } finally {
      setStatus("idle");
    }
  }

  const inputCls = "w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm";
  const labelCls = "text-xs font-semibold text-[#8A90A6] mb-1";

  return (
    <Card className="p-5 max-w-xl">
      <SectionLabel>New Partner Application</SectionLabel>
      <div className="text-xs text-[#8A90A6] mb-4">Applicant submits company details and requested track. Fields adapt to the track selected.</div>
      {message && <div className="text-sm text-[#059669] font-medium mb-3">{message}</div>}
      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <div>
          <div className={labelCls}>Requested track</div>
          <Dropdown
            value={form.track}
            options={[{ value: "Distributor", label: "Distributor" }, { value: "Reseller/MSP", label: "Reseller/MSP" }]}
            onChange={setTrack}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><div className={labelCls}>Company name</div><input className={inputCls} value={form.company_name} onChange={(e) => set("company_name", e.target.value)} /></div>
          <div><div className={labelCls}>Geography</div><input className={inputCls} value={form.geography} onChange={(e) => set("geography", e.target.value)} /></div>
          <div><div className={labelCls}>Contact name</div><input className={inputCls} value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} /></div>
          <div><div className={labelCls}>Contact email</div><input className={inputCls} value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} /></div>
        </div>

        <div className="border-t border-[#EDEEF4] pt-3">
          {form.track === "Distributor" ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-[#12172B]">Distributor-specific details</div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_wholesale_only} onChange={(e) => set("is_wholesale_only", e.target.checked)} />
                This business is wholesale-only (never sells directly to end customers)
              </label>
              <div>
                <div className={labelCls}>Approximate wholesale volume (units/scale used for tiering)</div>
                <input type="number" min={0} className={inputCls} value={form.volume_or_accounts} onChange={(e) => set("volume_or_accounts", e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-[#12172B]">Reseller/MSP-specific details</div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.sells_direct} onChange={(e) => set("sells_direct", e.target.checked)} />
                This business sells directly to end customers
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.has_managed_services} onChange={(e) => set("has_managed_services", e.target.checked)} />
                Has a managed-services / dedicated technical support capability
              </label>
              <div>
                <div className={labelCls}>Number of SMB accounts currently served</div>
                <input type="number" min={0} className={inputCls} value={form.volume_or_accounts} onChange={(e) => set("volume_or_accounts", e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div><div className={labelCls}>Additional notes (optional)</div><textarea rows={3} className={inputCls} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>

        <ActionButton tone="primary" icon={Send} disabled={status === "loading"}>{status === "loading" ? "Submitting…" : "Submit Application"}</ActionButton>
      </form>
    </Card>
  );
}

export function A5Screen2() {
  const { rows, metrics, status, error } = useApplicationsQueue();

  const metricCards = [
    { label: "Applications this month", value: String(metrics.applications_this_month ?? 0) },
    ...Object.entries(metrics.approval_rate_by_track || {}).map(([track, rate]) => ({ label: `Approval rate — ${track}`, value: `${rate}%` })),
  ];

  return (
    <div>
      <SectionLabel>Applications Queue</SectionLabel>
      <MetricRow metrics={metricCards} />
      {status === "loading" && rows.length === 0 && <div className="text-sm text-[#8A90A6]">Loading…</div>}
      {status === "error" && <div className="text-sm text-[#DC2626]">Couldn't load the applications queue{error ? `: ${error}` : "."}</div>}
      {rows.length === 0 && status === "success" ? (
        <div className="text-sm text-[#8A90A6]">No applications yet.</div>
      ) : rows.length > 0 && (
        <Table
          columns={["Application ID", "Applicant", "Requested Track", "Program-Criteria Match", "Current Status", "Submitted"]}
          rows={rows.map((r) => ({
            __id: r.id,
            __cells: [
              <span className="font-mono text-xs text-[#5B5F73]">{r.id}</span>,
              <span className="font-medium text-[#12172B]">{r.company_name}</span>,
              r.requested_track,
              <Pill tone={MATCH_TONE[r.match_status] || "pending"}>{r.match_status}</Pill>,
              <Pill tone={CURRENT_TONE[r.current_status] || "pending"}>{r.current_status}</Pill>,
              r.submitted_date,
            ],
          }))}
        />
      )}
      <div className="text-xs text-[#8A90A6] mt-2">Open the Approval Card tab and select an application to review and act on it.</div>
    </div>
  );
}

export function A5Screen3({ onActed }) {
  const { applications, reload: reloadApplications } = usePartnerApplications();
  const { criteria } = useProgramCriteria();
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [review, setReview] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("idle");
  const [error, setError] = useState(null);

  const [track, setTrack] = useState(null);
  const [tier, setTier] = useState(null);
  const [note, setNote] = useState("");
  const [actionStatus, setActionStatus] = useState("idle");
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    if (!selectedAppId && applications.length > 0) setSelectedAppId(applications[0].id);
  }, [applications, selectedAppId]);

  useEffect(() => {
    setReview(null);
    setActionMessage(null);
    setNote("");
  }, [selectedAppId]);

  const app = applications.find((a) => a.id === selectedAppId);
  const appOptions = applications.map((a) => ({ value: a.id, label: `${a.company_name} — requested ${a.requested_track} (${a.status})` }));

  async function handleRunReview() {
    setReviewStatus("loading");
    setError(null);
    try {
      const r = await reviewApplication(selectedAppId);
      setReview(r);
      const defaultTrack = r.recommended_tier ? r.recommended_tier.track : r.correct_track;
      setTrack(["Distributor", "Reseller/MSP"].includes(defaultTrack) ? defaultTrack : "Distributor");
      setTier(r.recommended_tier ? r.recommended_tier.tier : null);
    } catch (err) {
      setError(err?.message || "Failed to run classification review.");
    } finally {
      setReviewStatus("idle");
    }
  }

  const tierOptions = (criteria[track] || []).map((c) => ({ value: c.tier, label: c.tier }));

  async function handleApprove() {
    setActionStatus("loading");
    setError(null);
    try {
      const result = await approveApplication(selectedAppId, { track, tier, note });
      setActionMessage(result.provisioning.notification);
      onActed?.(result.provisioning.notification);
      setReview(null);
      reloadApplications();
    } catch (err) {
      setError(err?.message || "Failed to approve application.");
    } finally {
      setActionStatus("idle");
    }
  }
  async function handleReject() {
    setActionStatus("loading");
    setError(null);
    try {
      await rejectApplication(selectedAppId, note || "Did not meet program criteria");
      onActed?.(`Application ${selectedAppId} rejected.`);
      setReview(null);
      reloadApplications();
    } catch (err) {
      setError(err?.message || "Failed to reject application.");
    } finally {
      setActionStatus("idle");
    }
  }
  async function handleMoreInfo() {
    setActionStatus("loading");
    setError(null);
    try {
      await requestMoreInfo(selectedAppId, note || "Please clarify sales model and account volume");
      onActed?.(`More info requested from ${app?.company_name || selectedAppId}.`);
      setReview(null);
      reloadApplications();
    } catch (err) {
      setError(err?.message || "Failed to request more info.");
    } finally {
      setActionStatus("idle");
    }
  }

  if (!app) return <div className="text-sm text-[#8A90A6]">No applications yet — submit one on the Partner Application Form tab.</div>;

  return (
    <div>
      <SectionLabel>Approval Card — <Dropdown value={selectedAppId} options={appOptions} onChange={setSelectedAppId} placeholder="Select an application…" /></SectionLabel>
      {error && <div className="text-sm text-[#DC2626] mb-3">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <Card className="p-4 text-sm space-y-1.5">
            <div className="font-semibold text-[#12172B] mb-1">Application Details</div>
            <div><b>Company:</b> {app.company_name}</div>
            <div><b>Contact:</b> {app.contact_name} ({app.contact_email})</div>
            <div><b>Geography:</b> {app.geography}</div>
            <div><b>Requested track:</b> {app.requested_track}</div>
            <div><b>Wholesale-only:</b> {String(app.is_wholesale_only)}</div>
            <div><b>Sells direct:</b> {String(app.sells_direct)}</div>
            <div><b>Managed services:</b> {String(app.has_managed_services)}</div>
            <div><b>Volume/accounts:</b> {app.volume_or_accounts}</div>
            <div><b>Status:</b> <Pill tone={CURRENT_TONE[app.status] || "pending"}>{app.status}</Pill></div>
            {app.assigned_track && <div><b>Assigned:</b> {app.assigned_track} / {app.assigned_tier}</div>}
            {app.notes && <div className="text-[#8A90A6] pt-1">{app.notes}</div>}
          </Card>
        </div>
        <div className="lg:col-span-3">
          <ActionButton tone="primary" onClick={handleRunReview} disabled={reviewStatus === "loading"}>
            {reviewStatus === "loading" ? "Reviewing…" : "Run AI classification review"}
          </ActionButton>

          {review && (
            <Card className="p-4 mt-3">
              <div className="text-base font-bold text-[#12172B] mb-2">{review.status}</div>
              <div className="bg-[#F3F4FA] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-[#12172B] mb-3">{review.summary}</div>
              <div className="text-sm mb-2"><b>Correct track (by attributes):</b> {review.correct_track}</div>
              {review.track_mismatch && (
                <div className="rounded-lg p-3 bg-[#FFFBEB] border border-[#FDE68A] text-sm text-[#7A4B0A] mb-2">
                  Requested '{review.requested_track}' but attributes fit '{review.correct_track}'.
                </div>
              )}
              {review.recommended_tier ? (
                <div className="rounded-lg p-3 bg-[#EEF0FF] border border-[#C7D2FE] text-sm text-[#33359E] mb-2 flex items-start gap-2">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  Recommended: {review.recommended_tier.track} / {review.recommended_tier.tier} tier — {Number(review.recommended_tier.discount_pct)}% discount schedule
                </div>
              ) : (
                <div className="rounded-lg p-3 bg-[#FFFBEB] border border-[#FDE68A] text-sm text-[#7A4B0A] mb-2">Does not meet the minimum volume/account threshold for any tier yet.</div>
              )}
              {review.conflict && (
                <div className="rounded-lg p-3 bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B] mb-2 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  Channel conflict: {review.conflict.conflict_detail}
                </div>
              )}
              <div className="text-sm font-semibold text-[#12172B] mb-1">Reasons:</div>
              <ul className="text-xs text-[#8A90A6] list-disc pl-4 space-y-0.5 mb-3">{review.reasons.map((r) => <li key={r}>{r}</li>)}</ul>

              {app.status === "Pending" ? (
                <div className="border-t border-[#EDEEF4] pt-3 space-y-2">
                  <div className="text-sm font-semibold text-[#12172B]">Approve into Track/Tier / Reject / Request more info</div>
                  <div className="flex gap-2 flex-wrap">
                    <Dropdown value={track} options={[{ value: "Distributor", label: "Distributor" }, { value: "Reseller/MSP", label: "Reseller/MSP" }]} onChange={(v) => { setTrack(v); setTier(null); }} />
                    <Dropdown value={tier} options={tierOptions} onChange={setTier} placeholder="Select tier…" />
                  </div>
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Comment (optional)" className="w-full border border-[#DCDEE8] rounded-lg px-3 py-2 text-sm" />
                  <div className="flex gap-2 flex-wrap">
                    <ActionButton tone="success" icon={Check} onClick={handleApprove} disabled={actionStatus === "loading" || !tier}>Approve into Track/Tier</ActionButton>
                    <ActionButton tone="danger" onClick={handleReject} disabled={actionStatus === "loading"}>Reject</ActionButton>
                    <ActionButton tone="ghost" onClick={handleMoreInfo} disabled={actionStatus === "loading"}>Request more info</ActionButton>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[#059669] font-medium border-t border-[#EDEEF4] pt-3">This application is already {app.status}.</div>
              )}
            </Card>
          )}
          {actionMessage && <div className="text-sm text-[#059669] font-medium mt-3">{actionMessage}</div>}
        </div>
      </div>
    </div>
  );
}
