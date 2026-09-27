import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Sliders, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  DollarSign, 
  RefreshCw, 
  ShoppingBag, 
  Terminal, 
  Eye, 
  ArrowRight, 
  ChevronRight, 
  HelpCircle,
  FileText,
  Radio,
  ExternalLink,
  Settings,
  Bell,
  Sparkles,
  Send,
  Bot,
  User,
  Cpu,
  Plus,
  Trash2,
  Globe,
  Sun,
  Moon,
  Menu
} from 'lucide-react';

const initialRules = [
  { id: 'sub_block', name: 'Block Recurring Subscriptions', description: 'Automatically halt any checkout containing hidden or recurring monthly billing traps.', enabled: true, type: 'toggle', mlConfidenceWeight: 98, custom: false },
  { id: 'max_spend', name: 'Hard Spending Limit ($120)', description: 'Maximum allowed total for any single autonomous shopping agent purchase.', enabled: true, type: 'limit', value: 120, mlConfidenceWeight: 99, custom: false },
  { id: 'final_sale', name: 'No Final-Sale Items', description: 'Prevent non-refundable clearance merchandise from being authorized.', enabled: true, type: 'toggle', mlConfidenceWeight: 94, custom: false },
  { id: 'shipping_fee', name: 'Max Unexpected Shipping ($15)', description: 'Flag or block checkouts where hidden freight or surge shipping exceeds tolerance.', enabled: true, type: 'limit', value: 15, mlConfidenceWeight: 91, custom: false },
  { id: 'unknown_merchant', name: 'Verify Unknown Merchants', description: 'Pause agents instantly if purchasing from unverified or low-trust domains.', enabled: true, type: 'toggle', mlConfidenceWeight: 96, custom: false }
];

const initialLogs = [
  { id: 'tx_9812', agent: 'ShopAI Assistant v4', merchant: 'TechHaven.io', item: 'Mechanical Keyboard Pro', amount: '$149.00', status: 'Blocked', reason: 'Exceeded Max Spending Limit ($120) [ML Confidence: 99.4%]', timestamp: '2 mins ago', severity: 'danger' },
  { id: 'tx_9811', agent: 'LlamaBuy Agent', merchant: 'CloudSaaS Hub', item: 'Workspace Pro (Annual Tier)', amount: '$240.00', status: 'Blocked', reason: 'Recurring Subscription Detected [ML Confidence: 98.7%]', timestamp: '14 mins ago', severity: 'danger' },
  { id: 'tx_9810', agent: 'AutoCart Agent', merchant: 'UrbanThreads', item: 'Designer Hoodie (Clearance)', amount: '$65.00', status: 'Warned & Approved', reason: 'Final-Sale policy triggered; Manual user override', timestamp: '1 hour ago', severity: 'warning' },
  { id: 'tx_9809', agent: 'ShopAI Assistant v4', merchant: 'GadgetStore Direct', item: 'Wireless Earbuds X', amount: '$89.00', status: 'Approved', reason: 'Passed all Spendwall ML safety classifiers', timestamp: '3 hours ago', severity: 'success' }
];

const mockSimulations = [
  {
    id: 'sim_1',
    title: 'Subscription Trap Injection',
    agent: 'ShopAI Assistant v4',
    merchant: 'MegaStream & Goods',
    item: 'Smart Home Hub Bundle',
    intendedPrice: '$99.00',
    checkoutPrice: '$99.00 + $29/mo VIP Club',
    violation: 'Recurring Subscription Detected',
    mlConfidence: '98.9%',
    description: 'Autonomous agent attempted checkout, but merchant dynamically injected a pre-checked $29/month recurring membership box during final payment authorization.',
    diffs: [
      { label: 'Item Base Cost', original: '$99.00', final: '$99.00', changed: false },
      { label: 'Billing Terms', original: 'One-time payment', final: 'One-time + Monthly $29.00 Subscription', changed: true },
      { label: 'Refund Policy', original: '30-Day Money Back', final: 'All Digital Fees Non-Refundable', changed: true }
    ],
    severity: 'danger'
  },
  {
    id: 'sim_2',
    title: 'Over Budget & Hidden Freight Surcharge',
    agent: 'LlamaBuy Agent',
    merchant: 'GlobalParts Express',
    item: 'Ergonomic Desk Frame',
    intendedPrice: '$110.00',
    checkoutPrice: '$135.00 (+$25 Express Freight)',
    violation: 'Spending Limit Exceeded & High Shipping',
    mlConfidence: '99.2%',
    description: 'Final invoice exceeded your $120 hard cap and included an unexpected $25 freight fee not present in initial agent prompt quote.',
    diffs: [
      { label: 'Item Price', original: '$110.00', final: '$110.00', changed: false },
      { label: 'Shipping Fee', original: 'Free Shipping', final: '$25.00 Express Freight Surcharge', changed: true },
      { label: 'Total Charge', original: '$110.00', final: '$135.00 (Limit: $120)', changed: true }
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
    mlConfidence: '95.6%',
    description: 'Merchant re-classified the merchandise as "Final Sale - No Returns" on the final payment screen, violating your negative constraint guardrail.',
    diffs: [
      { label: 'Item Price', original: '$85.00', final: '$85.00', changed: false },
      { label: 'Return Policy', original: 'Free 30-Day Returns', final: 'FINAL SALE (Strictly Non-Returnable)', changed: true }
    ],
    severity: 'warning'
  }
];

const emptyDraft = { name: '', description: '', type: 'toggle', value: '' };

const weeklySavingsData = [
  { day: 'Mon', saved: 42 },
  { day: 'Tue', saved: 18 },
  { day: 'Wed', saved: 96 },
  { day: 'Thu', saved: 34 },
  { day: 'Fri', saved: 71 },
  { day: 'Sat', saved: 55 },
  { day: 'Sun', saved: 26 },
];

const liveTickerEvents = [
  '🛡️ Blocked a $29/mo subscription trap at MegaStream & Goods',
  '⚡ ShopAI Assistant v4 cleared a checkout at GadgetStore Direct',
  '🛡️ Flagged unexpected $25 freight fee at GlobalParts Express',
  '⚡ AutoCart Agent verified TechHaven.io as a trusted merchant',
  '🛡️ Blocked final-sale item at StyleOutlet Co.',
  '⚡ LlamaBuy Agent completed a $89.00 purchase within limits',
];

function AnimatedNumber({ value, duration = 1200, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = null;
    let frame;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

export default function SpendwallApp() {
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const [rules, setRules] = useState(initialRules);
  const [logs, setLogs] = useState(initialLogs);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logFilter, setLogFilter] = useState('all');
  const [tickerIndex, setTickerIndex] = useState(0);
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
      content: "Hi! I'm your Spendwall copilot. Ask me about your rules, recent blocks, or anything your shopping agents have been up to.",
      timestamp: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((i) => (i + 1) % liveTickerEvents.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

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
      mlConfidenceWeight: 75,
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
      reason: `Blocked by Spendwall ML Classifier (${sim.violation}) [Confidence: ${sim.mlConfidence}]`,
      timestamp: 'Just now',
      severity: 'danger'
    };
    setLogs([newLog, ...logs]);
    setActiveSimulation(null);
    showToast('Transaction successfully intercepted and blocked by ML engine!', 'danger');
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

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput, timestamp: 'Just now' };
    setChatMessages((prev) => [...prev, userMessage]);
    const query = chatInput.toLowerCase();
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let aiResponse = "I've checked your parameters. All active shopping agents are operating within safe guardrail parameters.";
      if (query.includes('subscription') || query.includes('recurring')) {
        aiResponse = "Your 'Block Recurring Subscriptions' rule is ACTIVE. Our Zero-Shot classifier is scanning DOM text with 98.9% precision.";
      } else if (query.includes('limit') || query.includes('spend')) {
        aiResponse = "Your hard spending limit is configured to $120.00 per transaction.";
      } else if (query.includes('status') || query.includes('audit')) {
        aiResponse = "In the last 24 hours, Spendwall has intercepted 14 suspicious checkouts and saved $342 in hidden charges.";
      }

      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: aiResponse, timestamp: 'Just now' }
      ]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-violet-500 selection:text-slate-950 transition-colors duration-200">
      
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-bounce duration-300">
          <div className={`flex items-center space-x-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${
            notification.type === 'danger' ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-200' :
            notification.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/90 border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-200' :
            'bg-violet-50 dark:bg-violet-950/90 border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-200'
          }`}>
            {notification.type === 'danger' ? <ShieldAlert className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" /> :
             notification.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" /> :
             <CheckCircle2 className="w-5 h-5 text-violet-500 dark:text-violet-400 shrink-0" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-violet-50 dark:from-violet-950/30 via-white dark:via-slate-900 to-white dark:to-slate-950 border-2 border-violet-300 dark:border-violet-500/40 rounded-2xl shadow-[0_0_60px_rgba(16,185,129,0.2)] overflow-hidden">

            <div className="flex items-center justify-between px-6 py-4 bg-violet-100/60 dark:bg-violet-950/40 border-b border-violet-200 dark:border-violet-500/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-violet-500/20 rounded-xl border border-violet-500/40">
                  <Plus className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold">Firewall Engine</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Custom Guardrail</h3>
                </div>
              </div>
              <button
                onClick={closeAddRuleModal}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Rule Name</label>
                <input
                  type="text"
                  value={ruleDraft.name}
                  onChange={(e) => setRuleDraft({ ...ruleDraft, name: e.target.value })}
                  placeholder="e.g. Block Gambling Merchants"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500/60 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  value={ruleDraft.description}
                  onChange={(e) => setRuleDraft({ ...ruleDraft, description: e.target.value })}
                  placeholder="What should Spendwall watch for, and what happens when it triggers?"
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500/60 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Rule Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRuleDraft({ ...ruleDraft, type: 'toggle' })}
                    className={`p-3 rounded-xl border text-left transition ${
                      ruleDraft.type === 'toggle'
                        ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-400 dark:border-violet-500/50 text-violet-700 dark:text-violet-300'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <Lock className="w-4 h-4" /> On/Off Block
                    </div>
                    <p className="text-xs mt-1 opacity-80">Blocks any match outright, no threshold.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleDraft({ ...ruleDraft, type: 'limit' })}
                    className={`p-3 rounded-xl border text-left transition ${
                      ruleDraft.type === 'limit'
                        ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-400 dark:border-violet-500/50 text-violet-700 dark:text-violet-300'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <DollarSign className="w-4 h-4" /> Dollar Limit
                    </div>
                    <p className="text-xs mt-1 opacity-80">Blocks only when a dollar cap is exceeded.</p>
                  </button>
                </div>
              </div>

              {ruleDraft.type === 'limit' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Limit Amount</label>
                  <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 focus-within:border-violet-500/60 transition">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ruleDraft.value}
                      onChange={(e) => setRuleDraft({ ...ruleDraft, value: e.target.value })}
                      placeholder="50.00"
                      className="w-full bg-transparent text-slate-900 dark:text-white font-mono text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {ruleFormError && (
                <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{ruleFormError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                <Cpu className="w-3.5 h-3.5 shrink-0 text-sky-500 dark:text-sky-400" />
                <span>New rules start out cautious and get sharper the more checkouts they see.</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  className="w-full sm:flex-1 py-3 px-4 bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-violet-500/20 transition flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Create Guardrail</span>
                </button>
                <button
                  type="button"
                  onClick={closeAddRuleModal}
                  className="w-full sm:w-auto py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeSimulation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-rose-50 dark:from-rose-950/40 via-white dark:via-slate-900 to-white dark:to-slate-950 border-2 border-rose-400 dark:border-rose-500/60 rounded-2xl shadow-[0_0_60px_rgba(244,63,94,0.3)] overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 bg-rose-100/60 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-500/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/40 animate-pulse">
                  <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-rose-600 dark:text-rose-400 font-semibold">Spendwall ML Interceptor Active</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Agent Checkout Violation Detected!</h3>
                </div>
              </div>
              <button 
                onClick={() => setActiveSimulation(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Target Agent: <strong className="text-slate-900 dark:text-white">{activeSimulation.agent}</strong></span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-mono">
                      {activeSimulation.mlConfidence} sure
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 font-mono font-semibold">
                      {activeSimulation.violation}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{activeSimulation.description}</p>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                  <span>Merchant: <strong className="text-slate-700 dark:text-slate-200">{activeSimulation.merchant}</strong></span>
                  <span>•</span>
                  <span>Item: <strong className="text-slate-700 dark:text-slate-200">{activeSimulation.item}</strong></span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-500 dark:text-sky-400" /> Checkout Diff-Checker (Intent vs. Execution)
                </h4>
                <div className="space-y-2 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  {activeSimulation.diffs.map((diff, idx) => (
                    <div key={idx} className={`flex items-center justify-between text-sm p-2 rounded-lg ${diff.changed ? 'bg-rose-100/60 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20' : 'bg-white dark:bg-slate-900/50'}`}>
                      <span className="font-medium text-slate-600 dark:text-slate-300">{diff.label}</span>
                      <div className="flex items-center space-x-3 font-mono text-xs">
                        <span className="text-slate-400 line-through">{diff.original}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span className={diff.changed ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-violet-600 dark:text-violet-400 font-bold'}>
                          {diff.final}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => handleBlockTransaction(activeSimulation)}
                  className="w-full sm:flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center justify-center space-x-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Block Transaction</span>
                </button>
                <button
                  onClick={() => handleOverrideTransaction(activeSimulation)}
                  className="w-full sm:flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Override & Proceed</span>
                </button>
                <button
                  onClick={() => { setActiveSimulation(null); setActiveTab('dashboard'); showToast('Adjust rules in firewall engine.', 'info'); }}
                  className="w-full sm:w-auto py-3 px-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-400 dark:border-sky-500/30 font-semibold rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Modify Guardrails</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-500 to-sky-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Shield className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                Spendwall
              </span>
              <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                ACTIVE ML FIREWALL
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${activeTab === 'dashboard' ? 'bg-violet-500 text-slate-950 font-semibold shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Sliders className="w-4 h-4" />
              <span>Control Center</span>
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${activeTab === 'simulator' ? 'bg-violet-500 text-slate-950 font-semibold shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Zap className="w-4 h-4" />
              <span>Checkout Simulator</span>
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsChatOpen(true)}
              className="px-3.5 py-2 bg-indigo-500/10 dark:bg-indigo-600/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 border border-indigo-400 dark:border-indigo-500/40 rounded-xl text-xs font-semibold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/10"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-sky-600 flex items-center justify-center text-slate-950 font-bold text-sm shadow">
              US
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Menu</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              <button
                onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Sliders className="w-4 h-4" /> Control Center
              </button>
              <button
                onClick={() => { setActiveTab('simulator'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'simulator' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Zap className="w-4 h-4" /> Checkout Simulator
              </button>
              <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => { setActiveTab('logs'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'logs' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Activity className="w-4 h-4" /> Audit Trail
                  <span className="ml-auto text-xs font-mono text-slate-400 dark:text-slate-500">{logs.length}</span>
                </button>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Live activity ticker */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-violet-600 dark:text-violet-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
            Live
          </span>
          <div key={tickerIndex} className="text-xs text-slate-600 dark:text-slate-400 animate-fade-in truncate">
            {liveTickerEvents[tickerIndex]}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-ticker {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in-ticker 0.4s ease-out; }
      `}</style>

      <div className="md:hidden flex items-center justify-around bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2">
        <button onClick={() => setActiveTab('dashboard')} className={`text-xs px-3 py-1.5 rounded-lg ${activeTab === 'dashboard' ? 'bg-violet-500 text-slate-950 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>Control Center</button>
        <button onClick={() => setActiveTab('simulator')} className={`text-xs px-3 py-1.5 rounded-lg ${activeTab === 'simulator' ? 'bg-violet-500 text-slate-950 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>Simulator</button>
      </div>


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">

            <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
              <p className="text-sm text-violet-800 dark:text-violet-200">
                Spendwall watches every purchase your AI shopping agents try to make and steps in before checkout completes if something looks off — a surprise fee, a sneaky subscription, or a price over your limit.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-violet-500 dark:text-violet-400">
                  <ShieldCheck className="w-16 h-16" />
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Protection Status</span>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">Active</span>
                </div>
                <p className="mt-1 text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1 font-medium">
                  <Cpu className="w-3.5 h-3.5" /> Watching every checkout, live
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-sky-500 dark:text-sky-400">
                  <ShieldAlert className="w-16 h-16" />
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Traps Blocked (24h)</span>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={14} suffix=" Intercepts" /></span>
                </div>
                <p className="mt-1 text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1 font-medium">
                  <Shield className="w-3.5 h-3.5" /> Saved ~<AnimatedNumber value={342} prefix="$" /> in hidden charges
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500 dark:text-amber-400">
                  <DollarSign className="w-16 h-16" />
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hard Spending Limit</span>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={120} prefix="$" /></span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">per order</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Configured in guardrails</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-purple-500 dark:text-purple-400">
                  <Terminal className="w-16 h-16" />
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Connected Agents</span>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={3} suffix=" Agents" /></span>
                </div>
                <p className="mt-1 text-xs text-purple-600 dark:text-purple-400 font-medium">ShopAI, LlamaBuy, AutoCart</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-500 dark:text-violet-400" /> This Week's Savings
                </h3>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">Last 7 days</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklySavingsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} className="text-slate-400 dark:text-slate-500" />
                    <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} className="text-slate-400 dark:text-slate-500" tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(value) => [`$${value}`, 'Saved']}
                      contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Area type="monotone" dataKey="saved" stroke="#8b5cf6" strokeWidth={2} fill="url(#savingsGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-violet-500 dark:text-violet-400" /> Your Shopping Rules
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Set the boundaries your shopping agents have to stay inside. Spendwall checks every checkout against these before any money moves.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={openAddRuleModal}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-violet-600 dark:text-violet-400 border border-violet-400 dark:border-violet-500/30 font-bold rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Custom Rule</span>
                </button>
                <button 
                  onClick={() => setActiveTab('simulator')}
                  className="px-4 py-2.5 bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-violet-500/20 transition flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Test Checkout Simulator</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {rules.map((rule) => (
                <div 
                  key={rule.id}
                  className={`p-6 rounded-2xl border transition duration-200 ${
                    rule.enabled 
                      ? 'bg-white dark:bg-slate-900/80 border-violet-300 dark:border-violet-500/30 shadow-[0_0_25px_rgba(16,185,129,0.05)]' 
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                        <span className={`h-2.5 w-2.5 rounded-full ${rule.enabled ? 'bg-violet-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{rule.name}</h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${rule.enabled ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'}`}>
                          {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                          title="How confident Spendwall is when it catches this"
                        >
                          {rule.mlConfidenceWeight}% accuracy
                        </span>
                        {rule.custom && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-400 dark:border-indigo-500/30">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 pl-5">{rule.description}</p>
                    </div>

                    <div className="flex items-center space-x-3 pl-5 md:pl-0">
                      {rule.type === 'limit' && rule.enabled && (
                        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">$</span>
                          <input 
                            type="number" 
                            value={rule.value} 
                            onChange={(e) => handleUpdateLimit(rule.id, e.target.value)}
                            className="w-16 bg-transparent text-slate-900 dark:text-white font-mono text-sm focus:outline-none"
                          />
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          rule.enabled ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            rule.enabled ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {rule.custom && (
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-300 dark:hover:border-rose-500/30 transition"
                          title="Delete custom rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-500 dark:text-violet-400" /> Audit Trail
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Every decision your AI shopping agents made, reviewed by Spendwall.
                </p>
              </div>
              <button 
                onClick={() => { setLogs(initialLogs); setLogFilter('all'); showToast('Audit trail refreshed', 'success'); }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition flex items-center justify-center space-x-2 shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-fit overflow-x-auto">
              {[
                { key: 'all', label: 'All', count: logs.length },
                { key: 'Blocked', label: 'Blocked', count: logs.filter(l => l.status === 'Blocked').length },
                { key: 'Warned & Approved', label: 'Warned', count: logs.filter(l => l.status.includes('Warned')).length },
                { key: 'Approved', label: 'Approved', count: logs.filter(l => l.status === 'Approved').length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setLogFilter(tab.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    logFilter === tab.key
                      ? 'bg-violet-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label} <span className="opacity-70">({tab.count})</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {logs
                .filter((log) => logFilter === 'all' || log.status === logFilter)
                .map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold w-fit shrink-0 ${
                      log.status === 'Blocked' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30' :
                      log.status.includes('Warned') ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30' :
                      'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-500/30'
                    }`}>
                      {log.status === 'Blocked' ? <XCircle className="w-3.5 h-3.5" /> :
                       log.status.includes('Warned') ? <AlertTriangle className="w-3.5 h-3.5" /> :
                       <CheckCircle2 className="w-3.5 h-3.5" />}
                      {log.status}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{log.item}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{log.agent} · {log.merchant}</div>
                    </div>

                    <div className="text-sm font-mono text-slate-700 dark:text-slate-200 shrink-0">{log.amount}</div>

                    <div className="hidden md:block text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">{log.reason}</div>

                    <div className="text-xs font-mono text-slate-400 dark:text-slate-500 shrink-0 sm:ml-auto">{log.timestamp}</div>
                  </div>
                ))}

              {logs.filter((log) => logFilter === 'all' || log.status === logFilter).length === 0 && (
                <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">
                  No transactions in this category yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" /> Try It: See Spendwall Catch a Bad Checkout
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Pick one of the scenarios below to see exactly how Spendwall would step in before your money moved.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockSimulations.map((sim) => (
                <div key={sim.id} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-500/50 rounded-2xl p-6 flex flex-col justify-between transition group shadow-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20 font-semibold">
                        {sim.violation}
                      </span>
                      <span className="text-xs text-sky-600 dark:text-sky-400 font-mono">{sim.mlConfidence} ML</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">{sim.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{sim.description}</p>
                    <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 font-mono">
                      <div>Merchant: <strong className="text-slate-700 dark:text-slate-200">{sim.merchant}</strong></div>
                      <div>Intended: <span className="text-slate-600 dark:text-slate-300">{sim.intendedPrice}</span></div>
                      <div>Checkout: <span className="text-rose-600 dark:text-rose-400 font-bold">{sim.checkoutPrice}</span></div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => setActiveSimulation(sim)}
                      className="w-full py-3 px-4 bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-violet-500/20 transition flex items-center justify-center space-x-2"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Simulate Agent Checkout</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-50 dark:from-violet-950/30 via-white dark:via-slate-900 to-sky-50 dark:to-sky-950/30 border border-violet-300 dark:border-violet-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Want to trigger an instant browser extension interception?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Simulate a high-risk dark pattern checkout scenario instantly.</p>
              </div>
              <button
                onClick={() => setActiveSimulation(mockSimulations[0])}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-violet-600 dark:text-violet-400 border border-violet-400 dark:border-violet-500/30 font-bold rounded-xl transition flex items-center space-x-2 shrink-0"
              >
                <Terminal className="w-4 h-4" />
                <span>Trigger Instant Intercept</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 dark:bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full font-sans">
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 border border-indigo-400 dark:border-indigo-500/30 rounded-lg text-indigo-500 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Spendwall ML Copilot</h3>
                  <p className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                    Ready to help
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-indigo-500 dark:text-indigo-400'
                    }`}
                  >
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`max-w-[75%] rounded-2xl p-3.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                    <span
                      className={`text-[10px] block mt-1.5 ${
                        msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl rounded-tl-none p-3.5 text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800/50 flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setChatInput('What are my active safety rules?')}
                className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-300 dark:border-slate-700 transition"
              >
                🛡️ Check active rules
              </button>
              <button
                onClick={() => setChatInput('Show recent blocks')}
                className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-300 dark:border-slate-700 transition"
              >
                📊 Recent blocks summary
              </button>
            </div>

            <form onSubmit={handleSendChat} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Copilot or query ML logs..."
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">
        Spendwall • The AI-Powered Safety & Audit Layer for Agentic Commerce • Hackathon Edition 2026
      </footer>

    </div>
    </div>
  );
}