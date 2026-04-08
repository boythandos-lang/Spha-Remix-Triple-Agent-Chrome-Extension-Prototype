import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Zap, 
  AlertTriangle, 
  Play, 
  Terminal, 
  Layout, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Settings,
  History,
  Info,
  User,
  Brain,
  Database
} from "lucide-react";
import { Orchestrator } from "./orchestrator";
import { executeMission } from "./extension/background";
import { USER_PROFILE as INITIAL_PROFILE } from "./profile";

// Agent Colors
const AGENT_COLORS = {
  BLUE: "text-blue-400 border-blue-400 bg-blue-400/10",
  RED: "text-red-400 border-red-400 bg-red-400/10",
  BLACK: "text-zinc-400 border-zinc-400 bg-zinc-400/10",
};

export default function App() {
  const [userInput, setUserInput] = useState("");
  const [isMissionRunning, setIsMissionRunning] = useState(false);
  const [visionMode, setVisionMode] = useState("off");
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [logs, setLogs] = useState<{ type: "BLUE" | "RED" | "BLACK" | "SYSTEM"; message: string; timestamp: string }[]>([]);
  const [missionSteps, setMissionSteps] = useState<any[]>([]);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("https://www.google.com");
  const [orchestrator, setOrchestrator] = useState<Orchestrator | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mistralKey = import.meta.env.VITE_MISTRAL_API_KEY;
    if (mistralKey) {
      setOrchestrator(new Orchestrator(mistralKey));
    }
    
    // Initial screenshot
    fetch("/api/browser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "screenshot", params: {} })
    }).then(res => res.json()).then(data => {
      if (data.success) setCurrentScreenshot(`data:image/png;base64,${data.data}`);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (type: "BLUE" | "RED" | "BLACK" | "SYSTEM", message: string) => {
    setLogs(prev => [...prev, { 
      type, 
      message, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const startMission = async () => {
    const mistralKey = import.meta.env.VITE_MISTRAL_API_KEY;
    if (!userInput.trim() || !mistralKey) {
      addLog("SYSTEM", "Error: Missing Mistral API Key. Please set VITE_MISTRAL_API_KEY in Settings.");
      return;
    }

    setIsMissionRunning(true);
    setLogs([]);
    setMissionSteps([]);
    setFinalResult(null);

    addLog("SYSTEM", `Initiating mission: "${userInput}"`);

    try {
      addLog("BLUE", "Accessing Survey Profile Brain...");
      addLog("BLUE", `Identity Loaded: ${profile.name} (${profile.job_title})`);
      
      // 1. Execute Mission via Background Script Simulation
      const result = await executeMission(userInput, mistralKey, profile, "Current Page DOM Content (Simulated)");
      
      setMissionSteps(result.steps || []);
      setFinalResult(result.finalResult);

      // Update screenshot if available from the last step
      const lastStep = result.steps?.[result.steps.length - 1];
      if (lastStep?.result?.result?.screenshot) {
        setCurrentScreenshot(`data:image/png;base64,${lastStep.result.result.screenshot}`);
        if (lastStep.step.toLowerCase().includes("navigate to")) {
          const urlMatch = lastStep.step.match(/https?:\/\/[^\s]+/);
          if (urlMatch) setCurrentUrl(urlMatch[0]);
        }
      }
      
      if (result.success) {
        addLog("SYSTEM", "Mission accomplished successfully. Identity consistency maintained.");
      } else if (result.finalResult?.action === "GEMINI_ULTIMATE_FALLBACK") {
        addLog("SYSTEM", "CRITICAL FAILURE: All primary agents failed.");
        addLog("SYSTEM", "INITIATING ULTIMATE FALLBACK: GEMINI...");
        addLog("SYSTEM", `Gemini Resolution: ${result.finalResult.status}`);
      } else {
        addLog("BLACK", "Mission encountered critical failure. Fallback executed.");
      }
    } catch (error) {
      addLog("BLACK", `Fatal error: ${String(error)}`);
    } finally {
      setIsMissionRunning(false);
    }
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              SurveyBrain <span className="text-zinc-500 font-medium">Mission Control</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-zinc-800" />
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800/50 rounded-full border border-zinc-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Profile Active</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Live Browser Viewport */}
        <div className="flex-1 bg-zinc-900 flex flex-col border-r border-zinc-800">
          {/* Browser Chrome */}
          <div className="h-12 bg-zinc-800/50 border-b border-zinc-700 flex items-center px-4 gap-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <div className="flex-1 max-w-2xl bg-zinc-950 border border-zinc-700 rounded-md h-8 flex items-center px-3 gap-2">
              <Shield className="w-3 h-3 text-zinc-500" />
              <span className="text-xs text-zinc-400 truncate">{currentUrl}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-500">
              <button 
                onClick={async () => {
                  const response = await fetch("/api/browser", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "screenshot", params: {} })
                  });
                  if (response.ok) {
                    const data = await response.json();
                    setCurrentScreenshot(`data:image/png;base64,${data.data}`);
                  }
                }}
                className="p-1 hover:bg-zinc-700 rounded transition-colors"
              >
                <History className="w-4 h-4" />
              </button>
              <button onClick={() => setIsSettingsModalOpen(true)} className="p-1 hover:bg-zinc-700 rounded transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Browser Content */}
          <div className="flex-1 relative overflow-hidden bg-zinc-950 flex items-center justify-center p-8">
            {currentScreenshot ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full h-full max-w-5xl shadow-2xl rounded-lg overflow-hidden border border-zinc-800"
              >
                <img 
                  src={currentScreenshot} 
                  alt="Browser Viewport" 
                  className="w-full h-full object-contain bg-white"
                  referrerPolicy="no-referrer"
                />
                {isMissionRunning && (
                  <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-zinc-900/90 border border-blue-500/30 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl">
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Agent Controlling Page...</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="text-center space-y-4 max-w-md">
                <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto border border-zinc-800">
                  <Layout className="w-10 h-10 text-zinc-700" />
                </div>
                <h3 className="text-lg font-bold text-zinc-400">No Active Session</h3>
                <p className="text-sm text-zinc-500">Initiate a mission to start the server-side browser and see the live navigation view.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Sidebar Extension UI */}
        <div className="w-[400px] bg-zinc-950 flex flex-col border-l border-zinc-800 shadow-2xl z-20">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              <span className="font-bold text-sm">SurveyBrain Sidebar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] font-bold text-blue-400 uppercase">v1.0</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
            {/* Active Profile Mini-Card */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <User className="w-12 h-12" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Database className="w-3 h-3" />
                  Identity
                </h2>
                <button onClick={() => setIsEditModalOpen(true)} className="text-[10px] text-blue-400 hover:underline">Edit</button>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-zinc-200">{profile.name}</div>
                <div className="text-xs text-zinc-500">{profile.job_title}</div>
              </div>
            </section>

            {/* Command Input */}
            <section className="space-y-3">
              <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Terminal className="w-3 h-3" />
                Command
              </h2>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., 'Navigate to google.com and search for AI news'"
                className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none placeholder:text-zinc-700"
              />
              <button
                onClick={startMission}
                disabled={isMissionRunning || !userInput.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                {isMissionRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                {isMissionRunning ? "Executing..." : "Start Mission"}
              </button>
            </section>

            {/* Logs */}
            <section className="flex-1 flex flex-col min-h-[300px]">
              <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <History className="w-3 h-3" />
                Activity
              </h2>
              <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 space-y-3 font-mono text-[10px] overflow-y-auto max-h-[400px]">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-700 italic">No activity logged</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className={`shrink-0 font-bold ${
                        log.type === "BLUE" ? "text-blue-400" :
                        log.type === "RED" ? "text-red-400" :
                        log.type === "BLACK" ? "text-zinc-400" :
                        "text-zinc-600"
                      }`}>
                        {log.type.charAt(0)}:
                      </span>
                      <span className="text-zinc-400 leading-tight">{log.message}</span>
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </section>

            {/* Mission Steps */}
            {missionSteps.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Steps
                </h2>
                <div className="space-y-2">
                  {missionSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                      {step.result.success ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                      <span className="text-[10px] text-zinc-400 truncate">{step.step}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              System Ready
            </div>
            <button onClick={() => setIsSettingsModalOpen(true)} className="p-1.5 text-zinc-500 hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-400" />
                  Edit Profile Brain
                </h2>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(profile).map(([key, value]) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                        {key.replace(/_/g, ' ')}
                      </label>
                      {Array.isArray(value) ? (
                        <input
                          type="text"
                          value={value.join(', ')}
                          onChange={(e) => setProfile(prev => ({ ...prev, [key]: e.target.value.split(',').map(s => s.trim()) }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      ) : typeof value === 'number' ? (
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => setProfile(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setProfile(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    addLog("SYSTEM", "Profile Brain updated successfully.");
                    setIsEditModalOpen(false);
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-zinc-400" />
                  System Settings
                </h2>
                <button 
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Agent Configuration</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300">Agent Verbosity</span>
                      <select className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300">
                        <option>Standard</option>
                        <option>High (Debug)</option>
                        <option>Minimal</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300">Mission Mode</span>
                      <select className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300">
                        <option>Balanced</option>
                        <option>Stealth</option>
                        <option>Aggressive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">API Configuration</h3>
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Info className="w-4 h-4" />
                      <span className="text-xs font-bold">Mistral AI Key</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      The Mistral API Key is managed via the platform's <span className="text-zinc-300 font-medium">Settings</span> menu. 
                      Ensure <span className="text-zinc-300 font-mono">VITE_MISTRAL_API_KEY</span> is correctly set in your environment.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Info</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="block text-[9px] text-zinc-600 uppercase">Version</span>
                      <span className="text-xs font-mono text-zinc-400">v1.0.4-alpha</span>
                    </div>
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="block text-[9px] text-zinc-600 uppercase">Status</span>
                      <span className="text-xs font-mono text-green-500">Operational</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-lg transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
