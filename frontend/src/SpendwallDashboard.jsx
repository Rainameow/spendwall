import React, { useState, useEffect, useRef } from 'react';
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
  Cpu
} from 'lucide-react';

const initialRules = [
  { id: 'sub_block', name: 'Block Recurring Subscriptions', description: 'Automatically halt any checkout containing hidden or recurring monthly billing traps.', enabled: true, type: 'toggle', mlConfidenceWeight: 98 },
  { id: 'max_spend', name: 'Hard Spending Limit ($120)', description: 'Maximum allowed total for any single autonomous shopping agent purchase.', enabled: true, type: 'limit', value: 120, mlConfidenceWeight: 99 },
  { id: 'final_sale', name: 'No Final-Sale Items', description: 'Prevent non-refundable clearance merchandise from being authorized.', enabled: true, type: 'toggle', mlConfidenceWeight: 94 },
  { id: 'shipping_fee', name: 'Max Unexpected Shipping ($15)', description: 'Flag or block checkouts where hidden freight or surge shipping exceeds tolerance.', enabled: true, type: 'limit', value: 15, mlConfidenceWeight: 91 },
  { id: 'unknown_merchant', name: 'Verify Unknown Merchants', description: 'Pause agents instantly if purchasing from unverified or low-trust domains.', enabled: true, type: 'toggle', mlConfidenceWeight: 96 }
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

export default function SpendwallApp() {
  const [rules, setRules] = useState(initialRules);
  const [logs, setLogs] = useState(initialLogs);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your Spendwall ML Safety Copilot. I continuously analyze your active agent checkouts and guardrails. How can I assist you today?",
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

    const handleSendChat = async (e) => {
    e.preventDefault();

    if (!chatInput.trim()) return;

    const message = chatInput.trim();

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: 'Just now'
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI request failed');
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          timestamp: 'Just now'
        }
      ]);
    } catch (error) {
      console.error('Spendwall AI error:', error);

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not reach the Spendwall AI. Make sure the backend is running.',
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-bounce duration-300">
          <div className={`flex items-center space-x-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${
            notification.type === 'danger' ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' :
            notification.type === 'warning' ? 'bg-amber-950/90 border-amber-500/50 text-amber-200' :
            'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
          }`}>
            {notification.type === 'danger' ? <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" /> :
             notification.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" /> :
             <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {activeSimulation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 border-2 border-rose-500/60 rounded-2xl shadow-[0_0_60px_rgba(244,63,94,0.3)] overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 bg-rose-950/60 border-b border-rose-500/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/40 animate-pulse">
                  <ShieldAlert className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-semibold">Spendwall ML Interceptor Active</span>
                  <h3 className="text-lg font-bold text-white">AI Agent Checkout Violation Detected!</h3>
                </div>
              </div>
              <button 
                onClick={() => setActiveSimulation(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Target Agent: <strong className="text-white">{activeSimulation.agent}</strong></span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                      ML Confidence: {activeSimulation.mlConfidence}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-semibold">
                      {activeSimulation.violation}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-3">{activeSimulation.description}</p>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>Merchant: <strong className="text-slate-200">{activeSimulation.merchant}</strong></span>
                  <span>•</span>
                  <span>Item: <strong className="text-slate-200">{activeSimulation.item}</strong></span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" /> Checkout Diff-Checker (Intent vs. Execution)
                </h4>
                <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  {activeSimulation.diffs.map((diff, idx) => (
                    <div key={idx} className={`flex items-center justify-between text-sm p-2 rounded-lg ${diff.changed ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-slate-900/50'}`}>
                      <span className="font-medium text-slate-300">{diff.label}</span>
                      <div className="flex items-center space-x-3 font-mono text-xs">
                        <span className="text-slate-400 line-through">{diff.original}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className={diff.changed ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
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
                  className="w-full sm:flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Override & Proceed</span>
                </button>
                <button
                  onClick={() => { setActiveSimulation(null); setActiveTab('dashboard'); showToast('Adjust rules in firewall engine.', 'info'); }}
                  className="w-full sm:w-auto py-3 px-4 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 font-semibold rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Modify Guardrails</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Spendwall
              </span>
              <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE ML FIREWALL
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Sliders className="w-4 h-4" />
              <span>Control Center</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${activeTab === 'logs' ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Activity className="w-4 h-4" />
              <span>Audit Trail ({logs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${activeTab === 'simulator' ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Zap className="w-4 h-4" />
              <span>Checkout Simulator</span>
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsChatOpen(true)}
              className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/10"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center text-slate-950 font-bold text-sm shadow">
              US
            </div>
          </div>
        </div>
      </header>

      <div className="md:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 p-2">
        <button onClick={() => setActiveTab('dashboard')} className={`text-xs px-3 py-1.5 rounded-lg ${activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}>Control Center</button>
        <button onClick={() => setActiveTab('logs')} className={`text-xs px-3 py-1.5 rounded-lg ${activeTab === 'logs' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}>Audit Trail</button>
        <button onClick={() => setActiveTab('simulator')} className={`text-xs px-3 py-1.5 rounded-lg ${activeTab === 'simulator' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}>Simulator</button>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-400">
                  <ShieldCheck className="w-16 h-16" />
                </div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">ML Classification Engine</span>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">Active (99.2%)</span>
                </div>
                <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <Cpu className="w-3.5 h-3.5" /> Zero-Shot Transformers Loaded
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-400">
                  <ShieldAlert className="w-16 h-16" />
                </div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Traps Blocked (24h)</span>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">14 Intercepts</span>
                </div>
                <p className="mt-1 text-xs text-cyan-400 flex items-center gap-1 font-medium">
                  <Shield className="w-3.5 h-3.5" /> Saved ~$342 in hidden charges
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-400">
                  <DollarSign className="w-16 h-16" />
                </div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Hard Spending Limit</span>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">$120.00</span>
                  <span className="text-xs text-slate-400 font-mono">per order</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Configured in guardrails</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-purple-400">
                  <Terminal className="w-16 h-16" />
                </div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Connected Agents</span>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">3 Agents</span>
                </div>
                <p className="mt-1 text-xs text-purple-400 font-medium">ShopAI, LlamaBuy, AutoCart</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" /> Personal Financial Firewall Rules & ML Confidence
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Define your exact purchasing boundaries. Spendwall evaluates every agent checkout against these rules using real-time ML classification before funds are authorized.
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('simulator')}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2 shrink-0"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Test Checkout Simulator</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {rules.map((rule) => (
                <div 
                  key={rule.id}
                  className={`p-6 rounded-2xl border transition duration-200 ${
                    rule.enabled 
                      ? 'bg-slate-900/80 border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.05)]' 
                      : 'bg-slate-950/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${rule.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                        <h3 className="text-base font-bold text-white">{rule.name}</h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${rule.enabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          ML Precision: {rule.mlConfidenceWeight}%
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 pl-5">{rule.description}</p>
                    </div>

                    <div className="flex items-center space-x-4 pl-5 md:pl-0">
                      {rule.type === 'limit' && rule.enabled && (
                        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                          <span className="text-xs text-slate-400 font-mono">$</span>
                          <input 
                            type="number" 
                            value={rule.value} 
                            onChange={(e) => handleUpdateLimit(rule.id, e.target.value)}
                            className="w-16 bg-transparent text-white font-mono text-sm focus:outline-none"
                          />
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          rule.enabled ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            rule.enabled ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" /> Transparent Agent Transaction Audit Trail
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Verifiable record of every decision made by your AI shopping agents and evaluated by Spendwall's ML engine.
                </p>
              </div>
              <button 
                onClick={() => { setLogs(initialLogs); showToast('Audit trail refreshed', 'success'); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Trail</span>
              </button>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 uppercase bg-slate-950/40">
                      <th className="p-4">Status</th>
                      <th className="p-4">Agent & Merchant</th>
                      <th className="p-4">Item & Amount</th>
                      <th className="p-4">Violation / Reason & ML Score</th>
                      <th className="p-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold ${
                            log.status === 'Blocked' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                            log.status.includes('Warned') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {log.status === 'Blocked' ? <XCircle className="w-3.5 h-3.5" /> :
                             log.status.includes('Warned') ? <AlertTriangle className="w-3.5 h-3.5" /> :
                             <CheckCircle2 className="w-3.5 h-3.5" />}
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-white">{log.agent}</div>
                          <div className="text-xs text-slate-400">{log.merchant}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-200 font-medium">{log.item}</div>
                          <div className="text-xs font-mono text-emerald-400">{log.amount}</div>
                        </td>
                        <td className="p-4 text-slate-300 text-xs max-w-xs truncate">
                          {log.reason}
                        </td>
                        <td className="p-4 text-right text-xs font-mono text-slate-400">
                          {log.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Interactive Agent Checkout Simulator
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Test how Spendwall intercepts rogue AI shopping attempts in real time using transformer classification. Choose a scenario below to trigger the Interceptor Overlay.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockSimulations.map((sim) => (
                <div key={sim.id} className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 flex flex-col justify-between transition group shadow-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                        {sim.violation}
                      </span>
                      <span className="text-xs text-cyan-400 font-mono">{sim.mlConfidence} ML</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition">{sim.title}</h3>
                    <p className="text-sm text-slate-300">{sim.description}</p>
                    <div className="pt-2 text-xs text-slate-400 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono">
                      <div>Merchant: <strong className="text-slate-200">{sim.merchant}</strong></div>
                      <div>Intended: <span className="text-slate-300">{sim.intendedPrice}</span></div>
                      <div>Checkout: <span className="text-rose-400 font-bold">{sim.checkoutPrice}</span></div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => setActiveSimulation(sim)}
                      className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Simulate Agent Checkout</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Want to trigger an instant browser extension interception?</h3>
                <p className="text-xs text-slate-400">Simulate a high-risk dark pattern checkout scenario instantly.</p>
              </div>
              <button
                onClick={() => setActiveSimulation(mockSimulations[0])}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl transition flex items-center space-x-2 shrink-0"
              >
                <Terminal className="w-4 h-4" />
                <span>Trigger Instant Intercept</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full font-sans">
            
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Spendwall ML Copilot</h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Transformer Model Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
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
                        : 'bg-slate-800 border border-slate-700 text-indigo-400'
                    }`}
                  >
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`max-w-[75%] rounded-2xl p-3.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                    <span
                      className={`text-[10px] block mt-1.5 ${
                        msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-none p-3.5 text-slate-400 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/50 flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setChatInput('What are my active safety rules?')}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition"
              >
                🛡️ Check active rules
              </button>
              <button
                onClick={() => setChatInput('Show recent blocks')}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition"
              >
                📊 Recent blocks summary
              </button>
            </div>

            <form onSubmit={handleSendChat} className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Copilot or query ML logs..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
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

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
        Spendwall • The AI-Powered Safety & Audit Layer for Agentic Commerce • Hackathon Edition 2026
      </footer>

    </div>
  );
}
    
    

  
     
                             
                      
