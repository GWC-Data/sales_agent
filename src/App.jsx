import React, { useReducer, useState, useEffect, useRef } from "react";
import { ClipboardList, History, LayoutGrid, Menu, PinOff } from "lucide-react";
import { FONT_IMPORT, DISPLAY } from "./lib/constants";
import { AGENT_META, AGENT_SCREEN_LABELS } from "./lib/seedData";
import { initialState, reducer } from "./state/reducer";
import { DetailContext, Mono, HitlBadge, SystemsFlow, agentHealth } from "./components/shared";
import { useProductCatalog } from "./hooks/useProductCatalog";
import { useAccounts } from "./hooks/useAccounts";
import { useTickets } from "./hooks/useTickets";
import { Overview } from "./components/Overview";
import { ApprovalCenter } from "./components/ApprovalCenter";
import { AuditTrail } from "./components/AuditTrail";
import { DetailModal } from "./components/DetailModal";
import sidebarBg from "./assets/sidebar-bg.png";
import { A1Screen1, A1Screen2, A1Screen3 } from "./components/agents/Agent1";
import { A2Screen1, A2Screen2, A2Screen3 } from "./components/agents/Agent2";
import { A3Screen1, A3Screen2, A3Screen3 } from "./components/agents/Agent3";
import { A4Screen1, A4Screen2, A4Screen3 } from "./components/agents/Agent4";
import { A5Screen1, A5Screen2, A5Screen3 } from "./components/agents/Agent5";
import { A6Screen1, A6Screen2, A6Screen3 } from "./components/agents/Agent6";
import { A7Screen1, A7Screen2, A7Screen3 } from "./components/agents/Agent7";

/* =========================================================================
   APP SHELL
========================================================================= */
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [view, setView] = useState(-1);
  const [screenIdx, setScreenIdx] = useState(0);
  const [demoStep, setDemoStep] = useState(null);
  const [detail, setDetail] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [agent6Result, setAgent6Result] = useState(null);
  const [agent1DealId, setAgent1DealId] = useState(null);
  const [agent3Context, setAgent3Context] = useState(null);
  const [agent3Pending, setAgent3Pending] = useState([]);
  const [agent3Submitted, setAgent3Submitted] = useState([]);
  const [agent4RenewalId, setAgent4RenewalId] = useState(null);
  const timerRef = useRef(null);
  const { products: liveProducts } = useProductCatalog();
  const { accounts: liveAccounts } = useAccounts();
  const { tickets: liveTickets } = useTickets();

  const goTo = (agentIdx, screen = 0) => { setView(agentIdx); setScreenIdx(screen); };
  const openDetail = (kind, id) => setDetail({ kind, id });

  useEffect(() => {
    if (!demoStep) return;
    clearTimeout(timerRef.current);
    if (demoStep === "select") { setView(0); setScreenIdx(0); timerRef.current = setTimeout(() => setDemoStep("analyzing"), 900); }
    else if (demoStep === "analyzing") { dispatch({ type: "TRIGGER_RUN", agent: "a1" }); timerRef.current = setTimeout(() => setDemoStep("detail"), 7 * 460 + 1100); }
    else if (demoStep === "detail") { setScreenIdx(1); timerRef.current = setTimeout(() => setDemoStep("reveal"), 1400); }
    else if (demoStep === "reveal") { setScreenIdx(2); timerRef.current = setTimeout(() => setDemoStep("approve"), 1400); }
    else if (demoStep === "approve") { dispatch({ type: "DEAL_ACTION", id: "WG-10482", kind: "approve" }); timerRef.current = setTimeout(() => setDemoStep("fulfill"), 3 * 460 + 1300); }
    else if (demoStep === "fulfill") { timerRef.current = setTimeout(() => setDemoStep("done"), 800); }
    else if (demoStep === "done") { setView(-1); timerRef.current = setTimeout(() => setDemoStep(null), 10); }
    return () => clearTimeout(timerRef.current);
  }, [demoStep]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setCollapsed(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const isAgent = view >= 0;
  const meta = isAgent ? AGENT_META[view] : null;
  const screenLabels = isAgent ? AGENT_SCREEN_LABELS[view] : [];

  let content = null;
  if (view === -1) content = <Overview state={state} goTo={goTo} demoActive={!!demoStep} onRunDemo={() => setDemoStep("select")} />;
  else if (view === -2) content = <ApprovalCenter approvals={state.approvals} goTo={goTo} />;
  else if (view === -3) content = <AuditTrail audit={state.audit} />;
  else if (view === 0) {
    content = screenIdx === 0 ? <A1Screen1 onSelectDeal={(id) => { setAgent1DealId(id); setScreenIdx(1); }} />
      : screenIdx === 1 ? <A1Screen2 initialDealId={agent1DealId} />
      : <A1Screen3 initialDealId={agent1DealId} />;
  } else if (view === 1) {
    content = screenIdx === 0 ? <A2Screen1 /> : screenIdx === 1 ? <A2Screen2 /> : <A2Screen3 />;
  } else if (view === 2) {
    content = screenIdx === 0 ? <A3Screen1 onStartCall={(ctx) => { setAgent3Context(ctx); setScreenIdx(1); }} />
      : screenIdx === 1 ? <A3Screen2 initialContext={agent3Context} onSubmitted={(batch) => { setAgent3Pending((p) => [...p, batch]); setScreenIdx(2); }} />
      : <A3Screen3
          pendingBatches={agent3Pending}
          submittedBatches={agent3Submitted}
          onUpdatePending={setAgent3Pending}
          onApproved={(batch, writtenTasks) => {
            setAgent3Pending((p) => p.filter((b) => b.batch_id !== batch.batch_id));
            setAgent3Submitted((s) => [{ ...batch, written_tasks: writtenTasks, created_at: new Date().toISOString() }, ...s]);
          }}
        />;
  } else if (view === 3) {
    content = screenIdx === 0 ? <A4Screen1 onSelectRenewal={(id) => { setAgent4RenewalId(id); setScreenIdx(1); }} />
      : screenIdx === 1 ? <A4Screen2 initialRenewalId={agent4RenewalId} />
      : <A4Screen3 initialRenewalId={agent4RenewalId} />;
  } else if (view === 4) {
    content = screenIdx === 0 ? <A5Screen1 /> : screenIdx === 1 ? <A5Screen2 /> : <A5Screen3 />;
  } else if (view === 5) {
    content = screenIdx === 0 ? <A6Screen1 />
      : screenIdx === 1 ? <A6Screen2 onGenerated={(result) => { setAgent6Result(result); setScreenIdx(2); }} />
      : <A6Screen3 generated={agent6Result} onUpdate={(patch) => setAgent6Result((prev) => (prev ? { ...prev, ...patch } : prev))} />;
  } else if (view === 6) {
    content = screenIdx === 0 ? <A7Screen1 /> : screenIdx === 1 ? <A7Screen2 /> : <A7Screen3 />;
  }

  return (
    <DetailContext.Provider value={openDetail}>
    <div className="w-full h-screen overflow-hidden" style={{ background: "#F6F7FB", fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`@keyframes slideIn { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      <DetailModal detail={detail} state={state} onClose={() => setDetail(null)} goTo={goTo} liveProducts={liveProducts} liveAccounts={liveAccounts} liveTickets={liveTickets} />
      <div className="flex p-2 sm:p-4 gap-2 sm:gap-4" style={{ width: "125%", height: "125%", transform: "scale(0.8)", transformOrigin: "top left" }}>
      <aside className="shrink-0 flex flex-col rounded-xl shadow-xl overflow-hidden relative" style={{ background: "#12172B", width: collapsed ? "5rem" : "340px" }}>
        <div className="px-3 py-4 border-b flex items-center justify-center" style={{ borderColor: "#242A45" }}>
          {!collapsed && <div className="flex-1 min-w-0 text-white font-bold text-[15px] leading-tight tracking-tight" style={{ fontFamily: DISPLAY }}>Sales Channel Ops</div>}
          <button onClick={() => setCollapsed(!collapsed)} className="shrink-0 cursor-pointer text-[#9AA0C0] hover:text-white transition-colors" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <Menu size={20} /> : <PinOff size={20} />}</button>
        </div>
        <nav className="flex-1 py-3 px-2">
          <button onClick={() => goTo(-1)} className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left" style={{ background: view === -1 ? "linear-gradient(135deg,#4F46E5,#6D28D9)" : "transparent", justifyContent: collapsed ? "center" : "flex-start" }} title={collapsed ? "Overview" : undefined}><LayoutGrid size={collapsed ? 20 : 16} color={view === -1 ? "#fff" : "#9AA0C0"} />{!collapsed && <span className="text-[13px] font-medium" style={{ color: view === -1 ? "#fff" : "#C7CAE0" }}>Overview</span>}</button>
          {!collapsed && <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C6290] px-3 pt-3 pb-1.5">Agents</div>}
          {AGENT_META.map((a, i) => {
            const Icon = a.icon; const on = view === i; const h = agentHealth(state).find((x) => x.key === a.key);
            const waiting = h.waiting > 0;
            const iconColor = on ? (waiting ? "#FDE68A" : "#BBF7D0") : (waiting ? "#F59E0B" : "#34D399");
            return (
              <button key={a.key} onClick={() => goTo(i)} className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left" style={{ background: on ? "linear-gradient(135deg,#4F46E5,#6D28D9)" : "transparent", justifyContent: collapsed ? "center" : "flex-start" }} title={collapsed ? a.name : undefined}>
                <Icon size={collapsed ? 20 : 16} color={iconColor} />
                {!collapsed && <div className="flex-1 min-w-0"><div className="text-[13px] font-medium truncate" style={{ color: on ? "#fff" : "#C7CAE0" }}>{a.name}</div></div>}
              </button>
            );
          })}
          {collapsed && <div className="border-t border-[#242A45] my-2" />}
          {!collapsed && <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C6290] px-3 pt-3 pb-1.5">Operations</div>}
          <button onClick={() => goTo(-2)} className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left" style={{ background: view === -2 ? "linear-gradient(135deg,#4F46E5,#6D28D9)" : "transparent", justifyContent: collapsed ? "center" : "flex-start" }} title={collapsed ? "Approvals" : undefined}><ClipboardList size={collapsed ? 20 : 16} color={view === -2 ? "#E0E4FF" : "#9AA0C0"} />{!collapsed && <span className="text-[13px] font-medium flex-1" style={{ color: view === -2 ? "#fff" : "#C7CAE0" }}>Approvals</span>}</button>
          <button onClick={() => goTo(-3)} className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left" style={{ background: view === -3 ? "linear-gradient(135deg,#4F46E5,#6D28D9)" : "transparent", justifyContent: collapsed ? "center" : "flex-start" }} title={collapsed ? "Audit Trail" : undefined}><History size={collapsed ? 20 : 16} color={view === -3 ? "#E0E4FF" : "#9AA0C0"} />{!collapsed && <span className="text-[13px] font-medium" style={{ color: view === -3 ? "#fff" : "#C7CAE0" }}>Audit Trail</span>}</button>
        </nav>
        {!collapsed && (
        <div className="relative z-10 px-5 py-4 border-t text-[11px] text-[#8A90C0]" style={{ borderColor: "#242A45" }}>7 agents · 1 operating layer</div>
        )}
        <img src={sidebarBg} alt="" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[340px] h-[300px] object-cover object-bottom max-w-none pointer-events-none select-none" style={{ opacity: 0.8, maskImage: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 100%)", WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 100%)" }} />
      </aside>
      <main className="flex-1 min-w-0 flex flex-col rounded-2xl overflow-hidden">
        {isAgent && (
          <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 bg-white border-b border-[#E7E8F0]">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#9599AC] mb-1"><Mono>UC-{String(view + 1).padStart(2, "0")}</Mono><span>·</span><span className={meta.priority === "High" ? "text-[#B45309] font-semibold" : "text-[#4F46E5] font-semibold"}>{meta.priority} priority</span><span>·</span><span>{meta.complexity} complexity</span></div>
                <h1 className="text-xl font-bold text-[#12172B]" style={{ fontFamily: DISPLAY }}>{meta.name}</h1>
                <p className="text-sm text-[#6B7280] mt-1 max-w-2xl">{meta.trigger}</p>
              </div>
              <HitlBadge hitl={meta.hitl} />
            </div>
            <SystemsFlow systems={meta.systems} />
          </div>
        )}
        {isAgent && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4 bg-white border-b border-[#E7E8F0] flex gap-1 overflow-x-auto">
            {screenLabels.map((label, i) => {
              const locked = view === 5 && i === 2; // Agent 6's Opportunity + Outreach tab only opens via the Run Agent redirect
              return (
                <button
                  key={label}
                  onClick={() => !locked && setScreenIdx(i)}
                  disabled={locked}
                  title={locked ? "Run the agent from Account Product Gap to open this" : undefined}
                  className="px-4 py-2.5 text-sm font-medium relative disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ color: i === screenIdx ? "#4F46E5" : "#8A90A6" }}
                >
                  <span className="mr-1.5 text-[11px] font-mono text-[#B7BACC]">{i + 1}</span>{label}
                  {i === screenIdx && <div className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full" style={{ background: "#4F46E5" }} />}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{content}</div>
      </main>
      </div>
    </div>
    </DetailContext.Provider>
  );
}
