import React from "react";
import { ArrowRight, XCircle } from "lucide-react";
import { DISPLAY, STATUS } from "../lib/constants";
import { ACCOUNTS, PRODUCT_INFO, repByName } from "../lib/seedData";
import { Pill, Field, SectionLabel, DetailRow, ActionButton, Sparkline } from "./shared";

/* =========================================================================
   DETAIL DRAWER — clicking any entity reference opens this
========================================================================= */
export function DetailModal({ detail, state, onClose, goTo }) {
  if (!detail) return null;
  const { kind, id } = detail;
  let title = id, subtitle = "", body = null, gotoTarget = null;

  if (kind === "account") {
    const a = ACCOUNTS[id];
    if (!a) return null;
    subtitle = "Account";
    const owner = repByName(state.reps, a.owner);
    body = (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailRow label="ARR" value={`$${a.arr.toLocaleString()}`} />
          <DetailRow label="Customer since" value={a.since} />
          <DetailRow label="Contract term" value={a.term} />
          <DetailRow label="Renewal date" value={a.renewal} />
          <DetailRow label="Invoice status" value={a.invoiceStatus} />
          <DetailRow label="DSO" value={`${a.dso} days`} />
          <DetailRow label="Owner (AM)" value={owner ? <Field kind="rep" id={owner.id}>{a.owner}</Field> : a.owner} />
          <DetailRow label="Sentiment" value={a.sentiment || "—"} />
        </div>
        <div>
          <SectionLabel>Products owned</SectionLabel>
          <div className="flex flex-wrap gap-1.5">{a.products.map((p) => <span key={p} className="px-2 py-1 rounded-md text-xs bg-[#F0F1F6]"><Field kind="product" id={p}>{p}</Field></span>)}</div>
        </div>
        <div>
          <SectionLabel>Open tickets</SectionLabel>
          {a.tickets.length === 0 ? <div className="text-sm text-[#8A90A6]">None open.</div> : (
            <div className="space-y-1.5">{a.tickets.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <Pill tone={t.sev === "Sev-2" ? "escalated" : "pending"}>{t.sev}</Pill>
                <Field kind="ticket" id={`${id}::${t.id}`} mono>{t.id}</Field>
                <span className="text-[#8A90A6]">{t.desc}</span>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    );
  } else if (kind === "rep") {
    const r = state.reps.find((x) => x.id === id || x.name === id);
    if (!r) return null;
    subtitle = `${r.role} · Sales Rep`;
    const linkedDeals = state.deals.filter((d) => d.rep === r.name);
    body = (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailRow label="Pipeline" value={r.pipeline} />
          <DetailRow label="Conversion" value={`${r.conversion}%`} />
          <DetailRow label="Target" value={`${r.target}%`} />
          <DetailRow label="Deal value vs. target" value={`${r.dealValuePct}%`} />
        </div>
        <div><SectionLabel>Trend</SectionLabel><Sparkline data={r.trend} color={r.gap === "cleared" ? "#059669" : "#DC2626"} /></div>
        {linkedDeals.length > 0 && (
          <div><SectionLabel>Deals owned</SectionLabel>
            <div className="space-y-1">{linkedDeals.map((d) => <div key={d.id} className="text-sm"><Field kind="deal" id={d.id} mono>{d.id}</Field> <span className="text-[#8A90A6]">— {d.account}</span></div>)}</div>
          </div>
        )}
      </div>
    );
    gotoTarget = { agent: 6, screen: 0 };
  } else if (kind === "deal") {
    const d = state.deals.find((x) => x.id === id);
    if (!d) return null;
    subtitle = "Deal";
    body = (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailRow label="Account" value={<Field kind="account" id={d.account}>{d.account}</Field>} />
          <DetailRow label="Rep" value={<Field kind="rep" id={repByName(state.reps, d.rep)?.id}>{d.rep} ({d.repRole})</Field>} />
          <DetailRow label="Product" value={<Field kind="product" id={d.product.split(" + ")[0]}>{d.product}</Field>} />
          <DetailRow label="Validation score" value={`${d.validationScore}%`} />
          <DetailRow label="Billing model" value={d.billing} />
          <DetailRow label="Term" value={d.term} />
          <DetailRow label="Discount" value={`${d.discount}%`} />
          <DetailRow label="Status" value={<Pill tone={d.status}>{STATUS[d.status].label}</Pill>} />
        </div>
        {d.gap && <div className="rounded-lg p-3 bg-[#FFFBEB] border border-[#FDE68A] text-sm text-[#7A4B0A]">{d.gap}</div>}
      </div>
    );
    gotoTarget = { agent: 0, screen: 1 };
  } else if (kind === "ticket") {
    const [accountName, ticketId] = id.split("::");
    const a = ACCOUNTS[accountName]; const t = a && a.tickets.find((x) => x.id === ticketId);
    if (!t) return null;
    subtitle = "Support Ticket";
    body = (
      <div className="space-y-3">
        <DetailRow label="Account" value={<Field kind="account" id={accountName}>{accountName}</Field>} />
        <DetailRow label="Severity" value={<Pill tone={t.sev === "Sev-2" ? "escalated" : "pending"}>{t.sev}</Pill>} />
        <DetailRow label="Description" value={t.desc || "No description on file."} />
        <DetailRow label="Age" value={t.age} />
      </div>
    );
  } else if (kind === "product") {
    const owners = Object.entries(ACCOUNTS).filter(([, a]) => a.products.includes(id)).map(([name]) => name);
    subtitle = "Product";
    body = (
      <div className="space-y-4">
        <div className="text-sm text-[#5B5F73]">{PRODUCT_INFO[id] || "No description on file."}</div>
        <div><SectionLabel>Accounts using this product</SectionLabel>
          {owners.length === 0 ? <div className="text-sm text-[#8A90A6]">None yet.</div> : <div className="space-y-1">{owners.map((o) => <div key={o} className="text-sm"><Field kind="account" id={o}>{o}</Field></div>)}</div>}
        </div>
      </div>
    );
  } else if (kind === "opportunity") {
    const o = state.opps.find((x) => x.id === id);
    if (!o) return null;
    subtitle = "Opportunity";
    body = (
      <div className="space-y-3">
        <DetailRow label="Account" value={<Field kind="account" id={o.account}>{o.account}</Field>} />
        <DetailRow label="Stage" value={o.stage} />
        <DetailRow label="Age" value={`${o.age} days`} />
        <DetailRow label="Last response" value={`"${o.lastResponse}"`} />
        <DetailRow label="Recommended action" value={o.recommendedAction} />
        <div className="text-sm text-[#5B5F73]">{o.reason}</div>
      </div>
    );
    gotoTarget = { agent: 1, screen: 0 };
  } else if (kind === "renewal") {
    const r = state.renewals.find((x) => x.id === id);
    if (!r) return null;
    subtitle = "Renewal";
    body = (
      <div className="space-y-3">
        <DetailRow label="Account" value={<Field kind="account" id={r.account}>{r.account}</Field>} />
        <DetailRow label="ARR" value={`$${r.arr.toLocaleString()}`} />
        <DetailRow label="Renewal date" value={r.closeDate} />
        <DetailRow label="Owner" value={<Field kind="rep" id={repByName(state.reps, r.owner)?.id}>{r.owner}</Field>} />
        <DetailRow label="Risk score" value={<Pill tone={r.riskScore >= 60 ? "high" : r.riskScore >= 35 ? "medium" : "low"}>{r.riskScore}/100</Pill>} />
        <ul className="text-sm text-[#B45309] list-disc pl-4 space-y-1">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
    );
    gotoTarget = { agent: 3, screen: 1 };
  } else if (kind === "application") {
    const a = state.applications.find((x) => x.id === id);
    if (!a) return null;
    subtitle = "Partner Application";
    body = (
      <div className="space-y-3">
        <DetailRow label="Track" value={a.track} />
        <DetailRow label="Confidence" value={`${a.confidence}%`} />
        <DetailRow label="Proposed tier" value={a.tier} />
        <DetailRow label="Status" value={<Pill tone={a.status}>{STATUS[a.status].label}</Pill>} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{Object.entries(a.fields).map(([k, v]) => <DetailRow key={k} label={k} value={v} />)}</div>
      </div>
    );
    gotoTarget = { agent: 4, screen: 1 };
  } else if (kind === "upsell") {
    const u = state.upsells.find((x) => x.id === id);
    if (!u) return null;
    subtitle = "Upsell Opportunity";
    body = (
      <div className="space-y-3">
        <DetailRow label="Account" value={<Field kind="account" id={u.account}>{u.account}</Field>} />
        <DetailRow label="Recommended product" value={<Field kind="product" id={u.recommended.split(" (")[0]}>{u.recommended}</Field>} />
        <DetailRow label="Potential ARR" value={`$${u.uplift.toLocaleString()}`} />
        <DetailRow label="Fit score" value={u.fitScore} />
        <div className="text-sm text-[#5B5F73]">{u.signal}</div>
      </div>
    );
    gotoTarget = { agent: 5, screen: 0 };
  }

  if (!body) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#0F1424]/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-[slideIn_0.18s_ease-out]">
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#EDEEF4]">
          <div><div className="text-[11px] font-semibold uppercase tracking-wide text-[#8A90A6]">{subtitle}</div><div className="text-lg font-bold text-[#12172B]" style={{ fontFamily: DISPLAY }}>{title}</div></div>
          <button onClick={onClose} className="text-[#9599AC] hover:text-[#12172B]"><XCircle size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{body}</div>
        {gotoTarget && (
          <div className="px-5 py-3 border-t border-[#EDEEF4]">
            <ActionButton tone="ghost" icon={ArrowRight} onClick={() => { goTo(gotoTarget.agent, gotoTarget.screen); onClose(); }}>Open full agent screen</ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}
