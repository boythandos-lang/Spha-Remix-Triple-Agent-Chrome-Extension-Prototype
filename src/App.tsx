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
  const [orchestrator, setOrchestrator] = useState<Orchestrator | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mistralKey = import.meta.env.VITE_MISTRAL_API_KEY;
    if (mistralKey) {
      setOrchestrator(new Orchestrator(mistralKey));
    }
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
      
      if (result.success) {
        addLog("SYSTEM", "Mission accomplished successfully. Identity consistency maintained.");
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
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

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile & Input */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile Card */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <User className="w-24 h-24" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Active Profile
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-xs text-zinc-500">Identity</span>
                <span className="text-sm font-medium text-blue-400">{profile.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-xs text-zinc-500">Occupation</span>
                <span className="text-sm font-medium text-zinc-300">{profile.job_title}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-xs text-zinc-500">Income</span>
                <span className="text-sm font-medium text-green-400">{profile.income}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-zinc-500">Location</span>
                <span className="text-sm font-medium text-zinc-300">{profile.location.split(',')[1]}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="w-full mt-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="w-3 h-3" />
              Edit Profile Brain
            </button>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Survey Command
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Vision Mode:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="vision-mode" 
                    value="on" 
                    checked={visionMode === "on"}
                    onChange={(e) => setVisionMode(e.target.value)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-xs font-medium">ON</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="vision-mode" 
                    value="off" 
                    checked={visionMode === "off"}
                    onChange={(e) => setVisionMode(e.target.value)}
                    className="w-4 h-4 accent-zinc-500"
                  />
                  <span className="text-xs font-medium">OFF</span>
                </label>
              </div>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., 'Complete the demographic section of this survey'"
                className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none placeholder:text-zinc-600"
              />
              <button
                onClick={startMission}
                disabled={isMissionRunning || !userInput.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                {isMissionRunning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing Identity...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Execute Survey Mission
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Logs & Execution */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col h-[600px] shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Mission Log & Identity Verification
              </h2>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs scrollbar-thin scrollbar-thumb-zinc-800">
              <AnimatePresence mode="popLayout">
                {logs.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                    <History className="w-12 h-12 opacity-20" />
                    <p>Waiting for mission initiation...</p>
                  </div>
                )}
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 group"
                  >
                    <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 h-fit ${
                      log.type === "BLUE" ? "bg-blue-500/20 text-blue-400" :
                      log.type === "RED" ? "bg-red-500/20 text-red-400" :
                      log.type === "BLACK" ? "bg-zinc-500/20 text-zinc-400" :
                      "bg-zinc-800 text-zinc-500"
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-zinc-300 leading-relaxed">{log.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>

            {/* Execution Steps Visualization */}
            {missionSteps.length > 0 && (
              <div className="p-6 border-t border-zinc-800 bg-zinc-950/50">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Identity Mapping Steps</h3>
                <div className="flex flex-wrap gap-3">
                  {missionSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        step.result.success 
                          ? "bg-green-500/5 border-green-500/20 text-green-400" 
                          : "bg-red-500/5 border-red-500/20 text-red-400"
                      }`}
                    >
                      {step.result.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span className="text-xs font-medium truncate max-w-[150px]">{step.step}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {finalResult && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Final Mission Result
              </h2>
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-zinc-300 font-mono">
                {typeof finalResult === 'string' ? finalResult : JSON.stringify(finalResult, null, 2)}
              </div>
            </motion.section>
          )}
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
