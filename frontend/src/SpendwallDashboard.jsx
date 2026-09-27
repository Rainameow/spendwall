import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Activity,
  Zap,
  RefreshCw,
  Sparkles,
  Plus,
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { BrandMark } from './components/Brand.jsx';
import RuleCard from './components/RuleCard.jsx';
import AuditRow from './components/AuditRow.jsx';
import ProtectionCard from './components/ProtectionCard.jsx';
import AddRuleModal from './components/AddRuleModal.jsx';
import InterceptModal from './components/InterceptModal.jsx';
import CopilotDrawer from './components/CopilotDrawer.jsx';
import { DecisionChip } from './components/Decision.jsx';
import { DECISIONS, decisionFromStatus, decisionFromSeverity } from './components/decisions.js';

const initialRules = [
  { id: 'sub_block', name: 'Block Recurring Subscriptions', description: 'Automatically halt any checkout containing hidden or recurring monthly billing traps.', enabled: true, type: 'toggle', custom: false },
  { id: 'max_spend', name: 'Hard Spending Limit', description: 'Maximum allowed total for any single purchase, including ones made by AI shopping assistants.', enabled: true, type: 'limit', value: 120, custom: false },
  { id: 'final_sale', name: 'No Final-Sale Items', description: 'Prevent non-refundable clearance merchandise from being authorized.', enabled: true, type: 'toggle', custom: false },
  { id: 'shipping_fee', name: 'Max Unexpected Shipping', description: 'Flag or block checkouts where hidden freight or surge shipping exceeds tolerance.', enabled: true, type: 'limit', value: 15, custom: false },
  { id: 'unknown_merchant', name: 'Verify Unknown Merchants', description: 'Pause the purchase if it comes from an unverified or low-trust domain.', enabled: true, type: 'toggle', custom: false }
];

const initialLogs = [
  { id: 'tx_9812', agent: 'ShopAI Assistant', merchant: 'TechHaven.io', item: 'Mechanical Keyboard Pro', amount: '$149.00', status: 'Blocked', reason: 'Total exceeded your hard spending limit', timestamp: '2 mins ago', severity: 'danger' },
  { id: 'tx_9811', agent: 'LlamaBuy Agent', merchant: 'CloudSaaS Hub', item: 'Workspace Pro (Annual Tier)', amount: '$240.00', status: 'Blocked', reason: 'Recurring subscription detected at checkout', timestamp: '14 mins ago', severity: 'danger' },
  { id: 'tx_9810', agent: 'AutoCart Agent', merchant: 'UrbanThreads', item: 'Designer Hoodie (Clearance)', amount: '$65.00', status: 'Warned & Approved', reason: 'Final-sale rule triggered; you chose to proceed', timestamp: '1 hour ago', severity: 'warning' },
  { id: 'tx_9809', agent: 'ShopAI Assistant', merchant: 'GadgetStore Direct', item: 'Wireless Earbuds X', amount: '$89.00', status: 'Approved', reason: 'Passed every active Spendwall rule', timestamp: '3 hours ago', severity: 'success' }
];

const mockSimulations = [
  {
    id: 'sim_1',
    title: 'Subscription Trap Injection',
    agent: 'ShopAI Assistant',
    merchant: 'MegaStream & Goods',
    item: 'Smart Home Hub Bundle',
    intendedPrice: '$99.00',
    checkoutPrice: '$99.00 + $29/mo VIP Club',
    violation: 'Recurring Subscription Detected',
    description: 'The shopping assistant went to check out, but the merchant slipped a pre-checked $29/month membership box onto the final payment screen.',
    diffs: [
      { label: 'Item Base Cost', original: '$99.00', final: '$99.00', changed: false },
      { label: 'Billing Terms', original: 'One-time payment', final: 'One-time + $29.00/mo subscription', changed: true },
      { label: 'Refund Policy', original: '30-Day Money Back', final: 'All digital fees non-refundable', changed: true }
    ],
    severity: 'danger'
  },
  {
    id: 'sim_2',
    title: 'Over Budget & Hidden Freight',
    agent: 'LlamaBuy Agent',
    merchant: 'GlobalParts Express',
    item: 'Ergonomic Desk Frame',
    intendedPrice: '$110.00',
    checkoutPrice: '$135.00 (+$25 Express Freight)',
    violation: 'Spending Limit Exceeded & High Shipping',
    description: 'The final invoice went over your $120 hard cap and included a $25 freight fee that was not in the original quote.',
    diffs: [
      { label: 'Item Price', original: '$110.00', final: '$110.00', changed: false },
      { label: 'Shipping Fee', original: 'Free Shipping', final: '$25.00 express freight', changed: true },
      { label: 'Total Charge', original: '$110.00', final: '$135.00 (limit: $120)', changed: true }
    ],
    severity: 'danger'
  },
  {
    id: 'sim_3',
    title: 'Final-Sale Policy Switch',
    agent: 'AutoCart Agent',
    merchant: 'StyleOutlet Co.',
    item: 'Limited Edition Sneakers',
    intendedPrice: '$85.00',
    checkoutPrice: '$85.00 (Final Sale)',
    violation: 'Final-Sale Item Detected',
    description: 'The merchant re-labelled the sneakers as "Final Sale — No Returns" on the last screen. That conflicts with your final-sale rule.',
    diffs: [
      { label: 'Item Price', original: '$85.00', final: '$85.00', changed: false },
      { label: 'Return Policy', original: 'Free 30-Day Returns', final: 'Final sale (non-returnable)', changed: true }
    ],
    severity: 'warning'
  }
];

const emptyDraft = { name: '', description: '', type: 'toggle', value: '' };

const marqueeItems = ['Hidden subscriptions', 'Surprise shipping', 'Final-sale switches', 'Over-budget carts', 'Unknown merchants', 'AI agents going rogue'];

const navItems = [
  { key: 'dashboard', label: 'Control Center', icon: Sliders },
  { key: 'simulator', label: 'TrueCost Simulator', icon: Zap },
  { key: 'logs', label: 'Audit Trail', icon: Activity },
];

export default function SpendwallApp() {
  const [rules, setRules] = useState(initialRules);
  const [logs, setLogs] = useState(initialLogs);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logFilter, setLogFilter] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // --- Custom rule modal state ---
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [ruleDraft, setRuleDraft] = useState(emptyDraft);
  const [ruleFormError, setRuleFormError] = useState('');

  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your Spendwall copilot. Ask me about your rules, recent decisions, or how a checkout would be judged.",
      timestamp: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleRule = (id) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    const target = rules.find(r => r.id === id);
    showToast(`Rule "${target.name}" ${!target.enabled ? 'Enabled' : 'Disabled'}`, 'info');
  };

  const handleUpdateLimit = (id, newVal) => {
    setRules(rules.map(r => r.id === id ? { ...r, value: Number(newVal) } : r));
  };

  const handleDeleteRule = (id) => {
    const target = rules.find(r => r.id === id);
    setRules(rules.filter(r => r.id !== id));
    showToast(`Custom rule "${target.name}" removed`, 'info');
  };

  // --- Custom rule modal handlers ---
  const openAddRuleModal = () => {
    setRuleDraft(emptyDraft);
    setRuleFormError('');
    setShowAddRuleModal(true);
  };

  const closeAddRuleModal = () => {
    setShowAddRuleModal(false);
    setRuleDraft(emptyDraft);
    setRuleFormError('');
  };

  const handleCreateRule = (e) => {
    e.preventDefault();
    const name = ruleDraft.name.trim();
    const description = ruleDraft.description.trim();

    if (!name) {
      setRuleFormError('Give the rule a name.');
      return;
    }
    if (!description) {
      setRuleFormError('Add a short description so you remember what it does.');
      return;
    }
    if (ruleDraft.type === 'limit') {
      const num = Number(ruleDraft.value);
      if (!ruleDraft.value || Number.isNaN(num) || num <= 0) {
        setRuleFormError('Enter a valid positive dollar amount for this limit.');
        return;
      }
    }

    const newRule = {
      id: `custom_${Date.now()}`,
      name,
      description,
      enabled: true,
      type: ruleDraft.type,
      value: ruleDraft.type === 'limit' ? Number(ruleDraft.value) : undefined,
      custom: true
    };

    setRules(prev => [...prev, newRule]);
    showToast(`Custom rule "${name}" created`, 'success');
    closeAddRuleModal();
  };

  const handleBlockTransaction = (sim) => {
    const newLog = {
      id: `tx_${Math.floor(Math.random() * 9000 + 1000)}`,
      agent: sim.agent,
      merchant: sim.merchant,
      item: sim.item,
      amount: sim.checkoutPrice.split(' ')[0],
      status: 'Blocked',
      reason: `Blocked by your rules: ${sim.violation}`,
      timestamp: 'Just now',
      severity: 'danger'
    };
    setLogs([newLog, ...logs]);
    setActiveSimulation(null);
    showToast('Purchase blocked before payment. Logged to your audit trail.', 'danger');
  };

  const handleOverrideTransaction = (sim) => {
    const newLog = {
      id: `tx_${Math.floor(Math.random() * 9000 + 1000)}`,
      agent: sim.agent,
      merchant: sim.merchant,
      item: sim.item,
      amount: sim.checkoutPrice.split(' ')[0],
      status: 'Warned & Approved',
      reason: `User manually authorized override for: ${sim.violation}`,
      timestamp: 'Just now',
      severity: 'warning'
    };
    setLogs([newLog, ...logs]);
    setActiveSimulation(null);
    showToast('User override recorded. Transaction completed.', 'warning');
  };

  const buildCopilotReply = (query) => {
    const enabledRules = rules.filter(r => r.enabled);
    const subRule = rules.find(r => r.id === 'sub_block');
    const limitRule = rules.find(r => r.id === 'max_spend');
    const blocked = logs.filter(l => l.status === 'Blocked');

    if (query.includes('subscription') || query.includes('recurring')) {
      if (!subRule) return "You don't have a subscription rule right now. Add a custom rule to catch recurring charges.";
      return subRule.enabled
        ? "Your 'Block Recurring Subscriptions' rule is ON. Any checkout with a recurring charge will be blocked before payment."
        : "Your 'Block Recurring Subscriptions' rule is currently OFF. Turn it on in the Control Center to catch recurring charges.";
    }
    if (query.includes('limit') || query.includes('spend')) {
      if (!limitRule) return "You don't have a hard spending limit set.";
      return limitRule.enabled
        ? `Your hard spending limit is $${limitRule.value} per purchase. Anything above that gets blocked.`
        : `Your hard spending limit ($${limitRule.value}) is currently turned off.`;
    }
    if (query.includes('block') || query.includes('status') || query.includes('audit') || query.includes('recent')) {
      if (blocked.length === 0) return 'Nothing has been blocked in your audit trail yet.';
      const latest = blocked[0];
      return `Your audit trail has ${blocked.length} blocked ${blocked.length === 1 ? 'purchase' : 'purchases'}. The latest: ${latest.item} at ${latest.merchant} (${latest.amount}) — ${latest.reason}.`;
    }
    if (query.includes('rule') || query.includes('active') || query.includes('safety')) {
      if (enabledRules.length === 0) return 'All your rules are paused right now, so nothing is being checked.';
      return `You have ${enabledRules.length} active ${enabledRules.length === 1 ? 'rule' : 'rules'}: ${enabledRules.map(r => r.name).join(', ')}.`;
    }
    return 'I can explain your rules, recent decisions, or how a checkout would be judged. Try asking about subscriptions, your spending limit, or recent blocks.';
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput, timestamp: 'Just now' };
    setChatMessages((prev) => [...prev, userMessage]);
    const query = chatInput.toLowerCase();
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = buildCopilotReply(query);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: aiResponse, timestamp: 'Just now' }
      ]);
      setIsTyping(false);
    }, 1000);
  };

  const decisionCounts = logs.reduce(
    (acc, log) => {
      acc[decisionFromStatus(log.status)] += 1;
      return acc;
    },
    { ALLOW: 0, WARN: 0, BLOCK: 0 }
  );

  const filteredLogs = logs.filter((log) => logFilter === 'all' || log.status === logFilter);

  const goTo = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toastStyles = {
    danger: { bg: 'bg-coral', icon: ShieldAlert },
    warning: { bg: 'bg-sun', icon: AlertTriangle },
    success: { bg: 'bg-lime', icon: CheckCircle2 },
    info: { bg: 'bg-white', icon: Info },
  };

  return (
    <div className="min-h-screen bg-paper font-sans text-ink antialiased">

      {notification && (() => {
        const t = toastStyles[notification.type] || toastStyles.info;
        const Icon = t.icon;
        return (
          <div className="fixed right-4 top-4 z-[60] animate-slide-in-right sm:right-6 sm:top-6" role="status" aria-live="polite">
            <div className={`flex max-w-sm items-center gap-3 rounded-2xl border-2 border-ink px-4 py-3 shadow-pop ${t.bg}`}>
              <Icon className="h-5 w-5 shrink-0 text-ink" aria-hidden="true" />
              <span className="text-sm font-bold text-ink">{notification.message}</span>
            </div>
          </div>
        );
      })()}

      {showAddRuleModal && (
        <AddRuleModal
          ruleDraft={ruleDraft}
          setRuleDraft={setRuleDraft}
          ruleFormError={ruleFormError}
          onSubmit={handleCreateRule}
          onClose={closeAddRuleModal}
        />
      )}

      {activeSimulation && (
        <InterceptModal
          sim={activeSimulation}
          onBlock={handleBlockTransaction}
          onOverride={handleOverrideTransaction}
          onClose={() => setActiveSimulation(null)}
          onModify={() => { setActiveSimulation(null); setActiveTab('dashboard'); showToast('Adjust rules in firewall engine.', 'info'); }}
        />
      )}

      <header className="sticky top-0 z-40 border-b-2 border-ink/5 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => goTo('dashboard')} className="group" aria-label="Spendwall home">
            <BrandMark />
          </button>

          <nav aria-label="Main" className="hidden items-center gap-1 rounded-full border-2 border-ink/10 bg-white p-1 lg:flex">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => goTo(key)}
                aria-current={activeTab === key ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                  activeTab === key ? 'bg-ink text-paper' : 'text-muted hover:bg-paper hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
                {key === 'logs' && (
                  <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${activeTab === key ? 'bg-lime text-ink' : 'bg-paper text-muted'}`}>
                    {logs.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-2 rounded-full border-2 border-ink bg-lime px-4 py-2 text-sm font-bold text-ink shadow-pop transition hover:-translate-y-0.5 hover:shadow-pop-lg"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-full border-2 border-ink/10 bg-white p-2 text-ink transition hover:border-ink lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 animate-fade bg-ink/30 backdrop-blur-sm" aria-label="Close menu" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative flex h-full w-80 max-w-[85vw] animate-slide-in-right flex-col gap-6 border-l-2 border-ink bg-paper p-5">
            <div className="flex items-center justify-between">
              <BrandMark />
              <button type="button" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu" className="rounded-full border-2 border-ink bg-white p-1.5 transition hover:rotate-90">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex flex-col gap-2">
              {navItems.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => goTo(key)}
                  aria-current={activeTab === key ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-display text-lg font-bold transition ${
                    activeTab === key ? 'border-ink bg-lime shadow-pop' : 'border-transparent bg-white hover:border-ink/20'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                  {key === 'logs' && <span className="ml-auto text-sm tabular-nums text-muted">{logs.length}</span>}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="overflow-hidden border-y-2 border-ink bg-lime" aria-hidden="true">
        <div className="flex w-max animate-marquee items-center gap-8 py-2.5">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="flex items-center gap-8 whitespace-nowrap font-display text-sm font-extrabold uppercase tracking-wider text-ink">
              {item}
              <span className="h-2 w-2 rounded-full bg-coral" />
            </span>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        {activeTab === 'dashboard' && (
          <div className="space-y-10">

            <div className="grid animate-rise grid-cols-1 gap-5 lg:grid-cols-12">
              <section className="relative overflow-hidden rounded-[32px] bg-white p-7 shadow-card sm:p-10 lg:col-span-8">
                <p className="inline-flex items-center gap-2 rounded-full border-2 border-ink/10 bg-paper px-3 py-1 text-xs font-bold text-ink">
                  <span className="h-2 w-2 rounded-full bg-coral" aria-hidden="true" />
                  Personal financial firewall
                </p>
                <h1 className="mt-6 font-display text-[clamp(3.25rem,9vw,7rem)] font-extrabold leading-[0.88] tracking-[-0.045em] text-ink">
                  Your money.
                  <br />
                  <span className="bg-[linear-gradient(transparent_58%,var(--color-lime)_58%,var(--color-lime)_92%,transparent_92%)] px-1">
                    Your rules.
                  </span>
                </h1>
                <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
                  Spendwall checks every online and AI-assisted purchase against the rules you set — before checkout — and gives it a clear call.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <DecisionChip decision="ALLOW" />
                  <DecisionChip decision="WARN" />
                  <DecisionChip decision="BLOCK" />
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => goTo('simulator')}
                    className="group flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-6 py-3.5 font-bold text-paper transition hover:-translate-y-0.5"
                  >
                    Test a checkout
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={openAddRuleModal}
                    className="flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-6 py-3.5 font-bold text-ink transition hover:bg-lime"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add a rule
                  </button>
                </div>

                <div className="pointer-events-none absolute -right-4 top-10 hidden animate-float rounded-3xl border-2 border-ink bg-coral px-5 py-4 shadow-pop-lg md:block" aria-hidden="true">
                  <p className="font-display text-3xl font-extrabold leading-none tracking-tight">BLOCK</p>
                  <p className="mt-1 text-xs font-bold">+$29/mo sneaky add-on</p>
                </div>
              </section>

              <ProtectionCard rules={rules} decisionCounts={decisionCounts} className="lg:col-span-4" />
            </div>

            <section aria-labelledby="decisions-title" className="animate-rise [animation-delay:80ms]">
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 id="decisions-title" className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Three possible answers<span className="text-coral">.</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {['ALLOW', 'WARN', 'BLOCK'].map((key, i) => {
                  const d = DECISIONS[key];
                  const Icon = d.icon;
                  return (
                    <article
                      key={key}
                      className={`group relative flex flex-col justify-between gap-10 overflow-hidden rounded-[28px] border-2 border-ink p-6 transition duration-300 hover:-translate-y-1 hover:shadow-pop-lg ${d.chip} ${i === 1 ? 'md:translate-y-4 md:hover:translate-y-3' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="h-7 w-7 transition-transform duration-300 group-hover:rotate-12" aria-hidden="true" />
                        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold tabular-nums text-paper">
                          {decisionCounts[key]} logged
                        </span>
                      </div>
                      <div>
                        <h3 className="font-display text-6xl font-extrabold leading-none tracking-tight">{d.label}</h3>
                        <p className="mt-3 max-w-xs text-sm font-medium leading-relaxed text-ink/80">{d.blurb}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 pt-4 lg:grid-cols-12">
              <section aria-labelledby="rules-title" className="animate-rise [animation-delay:140ms] lg:col-span-8">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Firewall rules</p>
                    <h2 id="rules-title" className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                      The lines you drew<span className="text-coral">.</span>
                    </h2>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                      Spendwall checks every checkout against these before any money moves.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddRuleModal}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-ink bg-lime px-5 py-2.5 font-bold text-ink shadow-pop transition hover:-translate-y-0.5 hover:shadow-pop-lg"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add custom rule
                  </button>
                </div>
                <ul className="space-y-3">
                  {rules.map((rule, index) => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      index={index}
                      onToggle={handleToggleRule}
                      onUpdateLimit={handleUpdateLimit}
                      onDelete={handleDeleteRule}
                    />
                  ))}
                </ul>
              </section>

              <aside className="flex animate-rise flex-col gap-6 [animation-delay:200ms] lg:col-span-4">
                <section aria-labelledby="recent-title" className="rounded-[28px] bg-white p-6 shadow-card">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 id="recent-title" className="font-display text-xl font-extrabold tracking-tight">Recent checks</h2>
                    <button type="button" onClick={() => goTo('logs')} className="flex items-center gap-1 text-sm font-bold text-ink underline decoration-lime decoration-2 underline-offset-4 hover:decoration-ink">
                      Audit trail <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <ul className="divide-y-2 divide-paper">
                    {logs.slice(0, 4).map((log) => (
                      <AuditRow key={log.id} log={log} compact />
                    ))}
                  </ul>
                </section>

                <section aria-labelledby="copilot-card-title" className="relative overflow-hidden rounded-[28px] bg-ink p-6 text-paper">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime text-ink">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 id="copilot-card-title" className="mt-5 font-display text-2xl font-extrabold leading-tight tracking-tight">
                    Ask your copilot anything about your rules.
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-paper/70">
                    {'"What\'s my spending limit?" "Why was that blocked?" Plain answers, pulled from your rules and audit trail.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 font-bold text-ink transition hover:-translate-y-0.5"
                  >
                    Open Copilot
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </section>
              </aside>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="animate-rise space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Audit trail</p>
                <h1 className="mt-1 font-display text-5xl font-extrabold leading-none tracking-tight sm:text-6xl">
                  Every call, on record<span className="text-coral">.</span>
                </h1>
                <p className="mt-3 max-w-xl text-muted">Every purchase Spendwall reviewed, and the decision it made.</p>
              </div>
              <button
                type="button"
                onClick={() => { setLogs(initialLogs); setLogFilter('all'); showToast('Audit trail refreshed', 'success'); }}
                className="group flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-5 py-2.5 font-bold text-ink transition hover:bg-lime"
              >
                <RefreshCw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" aria-hidden="true" />
                Refresh
              </button>
            </div>

            <div className="no-scrollbar flex w-full gap-2 overflow-x-auto" role="tablist" aria-label="Filter by decision">
              {[
                { key: 'all', label: 'All', count: logs.length, active: 'bg-ink text-paper' },
                { key: 'Blocked', label: 'BLOCK', count: decisionCounts.BLOCK, active: 'bg-coral text-ink' },
                { key: 'Warned & Approved', label: 'WARN', count: decisionCounts.WARN, active: 'bg-sun text-ink' },
                { key: 'Approved', label: 'ALLOW', count: decisionCounts.ALLOW, active: 'bg-lime text-ink' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={logFilter === tab.key}
                  onClick={() => setLogFilter(tab.key)}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border-2 px-4 py-2 font-display text-sm font-extrabold tracking-wide transition ${
                    logFilter === tab.key ? `border-ink shadow-pop ${tab.active}` : 'border-ink/10 bg-white text-muted hover:border-ink/40'
                  }`}
                >
                  {tab.label}
                  <span className="tabular-nums opacity-70">{tab.count}</span>
                </button>
              ))}
            </div>

            <ul className="space-y-3">
              {filteredLogs.map((log) => (
                <AuditRow key={log.id} log={log} />
              ))}
            </ul>

            {filteredLogs.length === 0 && (
              <div className="rounded-[28px] border-2 border-dashed border-ink/20 py-16 text-center">
                <p className="font-display text-2xl font-extrabold">Nothing here yet.</p>
                <p className="mt-1 text-sm text-muted">No transactions in this category yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="animate-rise space-y-8">
            <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">TrueCost simulator</p>
                <h1 className="mt-1 font-display text-[clamp(3rem,7vw,5.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em]">
                  What you <span className="text-coral">see</span> vs. what you <span className="bg-lime px-2">pay</span>.
                </h1>
                <p className="mt-4 max-w-xl text-lg text-muted">
                  Pick a checkout scenario and watch Spendwall compare the expected price with the real one — then make the call.
                </p>
              </div>
              <a
                href="/checkout"
                className="group flex items-center justify-between gap-4 rounded-[28px] border-2 border-ink bg-white p-5 shadow-pop transition hover:-translate-y-0.5 hover:shadow-pop-lg lg:col-span-4"
              >
                <span>
                  <span className="block font-display text-lg font-extrabold">Live checkout demo</span>
                  <span className="block text-sm text-muted">A merchant page the extension can intercept.</span>
                </span>
                <ExternalLink className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {mockSimulations.map((sim) => {
                const decision = decisionFromSeverity(sim.severity);
                return (
                  <article
                    key={sim.id}
                    className="group flex flex-col justify-between gap-6 rounded-[28px] border-2 border-transparent bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-pop-lg"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-muted">{sim.merchant}</span>
                        <DecisionChip decision={decision} />
                      </div>
                      <h2 className="font-display text-2xl font-extrabold leading-tight tracking-tight">{sim.title}</h2>
                      <p className="text-sm leading-relaxed text-muted">{sim.description}</p>
                      <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-paper p-3">
                        <div>
                          <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">Expected</dt>
                          <dd className="font-display text-xl font-extrabold tabular-nums">{sim.intendedPrice}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">At checkout</dt>
                          <dd className="font-display text-sm font-extrabold leading-snug text-coral">{sim.checkoutPrice}</dd>
                        </div>
                      </dl>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSimulation(sim)}
                      className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-5 py-3 font-bold text-paper transition group-hover:bg-lime group-hover:text-ink"
                    >
                      <Zap className="h-4 w-4" aria-hidden="true" />
                      Run TrueCost check
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="flex flex-col items-start justify-between gap-4 rounded-[28px] bg-ink p-6 text-paper sm:flex-row sm:items-center sm:p-8">
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight">Want to see an instant intercept?</h2>
                <p className="mt-1 text-sm text-paper/70">Fire the subscription-trap scenario straight away.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSimulation(mockSimulations[0])}
                className="flex shrink-0 items-center gap-2 rounded-full border-2 border-lime bg-lime px-5 py-3 font-bold text-ink transition hover:-translate-y-0.5"
              >
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                Trigger instant intercept
              </button>
            </div>
          </div>
        )}

      </main>

      {isChatOpen && (
        <CopilotDrawer
          messages={chatMessages}
          input={chatInput}
          setInput={setChatInput}
          isTyping={isTyping}
          onSend={handleSendChat}
          onClose={() => setIsChatOpen(false)}
          messagesEndRef={messagesEndRef}
        />
      )}

      <footer className="mx-auto mt-10 max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 border-t-2 border-ink/10 pt-8 sm:flex-row sm:items-center">
          <BrandMark />
          <p className="font-display text-lg font-extrabold tracking-tight">
            Your money. <span className="bg-lime px-1">Your rules.</span>
          </p>
          <p className="text-xs text-muted">Hackathon Edition 2026</p>
        </div>
      </footer>
    </div>
  );
}
