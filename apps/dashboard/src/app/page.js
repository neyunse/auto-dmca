"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/SocketProvider";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";

export default function Overview() {
  const { socket, isConnected } = useSocket();
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [targets, setTargets] = useState([]);
  const [serpapiUsage, setSerpapiUsage] = useState({ hour: 0, month: 0 });
  const [filterTarget, setFilterTarget] = useState("all");

  useEffect(() => {
    if (!socket) return;

    socket.emit("get-alerts", (res) => {
      if (!res.error) setAlerts(res);
    });
    socket.emit("get-targets", (res) => {
      if (!res.error) setTargets(res);
    });
    socket.emit("get-config", (res) => {
      if (!res.error && res) {
        setSerpapiUsage({
          hour: parseInt(res.serpapiHitsHour || "0", 10),
          month: parseInt(res.serpapiHitsMonth || "0", 10)
        });
      }
    });

    socket.on("new-alert", (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 100));
      showToast("Violation Blocked & Recorded", "error");
    });

    socket.on("alert-deleted", (id) => {
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    });

    socket.on("alerts-purged", (targetId) => {
      setAlerts((prev) => {
        if (!targetId || targetId === "all") return [];
        return prev.filter((a) => a.targetId !== targetId);
      });
    });

    socket.on("config-updated", (updated) => {
      const h = updated.find(c => c.key === 'serpapiHitsHour');
      const m = updated.find(c => c.key === 'serpapiHitsMonth');
      if (h || m) {
        setSerpapiUsage(prev => ({
          hour: h ? parseInt(h.value, 10) : prev.hour,
          month: m ? parseInt(m.value, 10) : prev.month
        }));
      }
    });

    return () => {
      socket.off("new-alert");
      socket.off("alert-deleted");
      socket.off("alerts-purged");
      socket.off("config-updated");
    };
  }, [socket]);

  const deleteAlert = (id) => {
    socket.emit("delete-alert", id, (res) => {
      if (res.error) showToast(res.error, "error");
      else showToast("Intelligence record purged", "success");
    });
  };

  const purgeAllAlerts = () => {
    if (!window.confirm(`Are you sure you want to purge ${filterTarget === 'all' ? 'ALL' : 'filtered'} alerts?`)) return;
    socket.emit("purge-alerts", filterTarget, (res) => {
      if (res.error) showToast(res.error, "error");
      else showToast("Intelligence stream cleared", "success");
    });
  };

  const [isScanning, setIsScanning] = useState(false);

  const manualScan = () => {
    setIsScanning(true);
    socket.emit("manual-scan", (res) => {
      setIsScanning(false);
      if (res.error) showToast(res.error, "error");
      else showToast("Manual sweep initiated", "success");
    });
  };

  const filteredAlerts = filterTarget === "all" 
    ? alerts 
    : alerts.filter(a => a.targetId === filterTarget);

  return (
    <div className="space-y-16 animate-in fade-in duration-1000">
      <header className="flex justify-between items-end pb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="h-px w-8 bg-white/30"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Operation Status</p>
          </div>
          <h2 className="text-6xl font-black uppercase tracking-tighter text-glow italic">Command Center</h2>
          <p className="text-white/30 text-xs font-medium tracking-wide">Autonomous monitoring active across global network nodes.</p>
        </div>
        
        <div className="flex items-center gap-10">
           <div className="text-right">
              <p className="text-[9px] text-white/20 uppercase font-black tracking-[0.3em] mb-1">Intelligence Quota</p>
              <div className="flex items-center gap-4 group">
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-white/40 uppercase">Hr: {serpapiUsage.hour}/50</span>
                    <span className="text-[10px] font-mono text-white/40 uppercase">Mo: {serpapiUsage.month}/250</span>
                 </div>
                 <div className="w-1.5 h-8 bg-white/10 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute bottom-0 w-full bg-white transition-all duration-700" 
                      style={{ height: `${Math.min((serpapiUsage.month / 250) * 100, 100)}%` }}
                    ></div>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={manualScan}
                disabled={isScanning || !isConnected}
                className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all
                  ${isScanning 
                    ? 'bg-white/10 text-white/40 cursor-not-allowed animate-pulse' 
                    : 'bg-white/5 text-white/60 hover:bg-white hover:text-black hover:scale-105 active:scale-95 border border-white/10'}
                `}
              >
                 {isScanning ? "SWEEPING..." : "MANUAL SWEEP"}
              </button>
              <div className={`p-1 rounded-full border-2 transition-colors duration-500 ${isConnected ? 'border-white/20' : 'border-red-900/50'}`}>
                 <div className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${isConnected ? 'bg-white text-black' : 'bg-red-600 text-white'}`}>
                    {isConnected ? "NETWORK ALIGNED" : "SIGNAL COLLAPSED"}
                 </div>
              </div>
           </div>
        </div>
      </header>

      {/* Stats Grid - Rich Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: "Detected Infractions", val: alerts.length, desc: "Total confirmed violations", icon: "⚠️" },
          { label: "Active Operatives", val: targets.length, desc: "Units currently deployed", icon: "🎯" },
          { label: "Network Coverage", val: "Global", desc: "Cross-platform monitoring", icon: "🌐" }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-10 group relative">
             <div className="absolute top-0 left-0 w-2 h-0 group-hover:h-full bg-white transition-all duration-500"></div>
             <div className="flex justify-between items-start mb-10">
                <div>
                   <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.3em] mb-2">{stat.label}</p>
                   <p className="text-6xl font-black italic tracking-tighter group-hover:scale-105 transition-transform origin-left text-glow">{stat.val}</p>
                </div>
                <span className="text-3xl opacity-20 filter grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">{stat.icon}</span>
             </div>
             <p className="text-xs text-white/20 font-medium tracking-wide uppercase">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Live Feed - High Tech List */}
      <div className="glass-panel p-12 rounded-[2rem] relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="scanline"></div>
        
        <div className="flex justify-between items-center mb-16 relative z-10">
          <div className="flex items-center gap-6">
             <h3 className="text-2xl font-black uppercase tracking-widest">Incident Stream</h3>
             <div className="px-3 py-1 border border-white/20 rounded-md">
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest animate-pulse">Live Buffer</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="relative group/sel">
                <select 
                  value={filterTarget} 
                  onChange={(e) => setFilterTarget(e.target.value)}
                  className="bg-black/40 border border-white/10 px-6 py-2 rounded-xl text-[10px] font-black uppercase appearance-none cursor-pointer pr-12 focus:border-white/40 transition-all text-white/60"
                >
                  <option value="all">All Targets</option>
                  {targets.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none opacity-20 group-hover/sel:opacity-40 select-none text-[8px]">▼</div>
             </div>
             <div className="h-8 w-px bg-white/5"></div>
             <div className="flex gap-4">
                <button className="text-[10px] font-black uppercase text-white/20 hover:text-white transition-colors">Export Log</button>
                <button 
                  onClick={purgeAllAlerts}
                  className="text-[10px] font-black uppercase text-red-900/40 hover:text-red-500 transition-colors"
                >
                  Purge {filterTarget === 'all' ? 'All' : 'Filtered'}
                </button>
             </div>
          </div>
        </div>
        
        <div className="space-y-6 max-h-[700px] overflow-y-auto pr-8 custom-scrollbar relative z-10">
          {filteredAlerts.length === 0 ? (
            <div className="py-40 flex flex-col items-center justify-center space-y-8 opacity-10 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
               <div className="text-9xl mb-4">🔍</div>
               <p className="text-lg font-black uppercase tracking-[1em] indent-[1em]">Scanning System</p>
               <div className="flex gap-2">
                  {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white animate-bounce" style={{animationDelay: `${i*0.2}s`}}></div>)}
               </div>
            </div>
          ) : (
            filteredAlerts.map((alert, i) => (
              <div key={i} className="glass-card p-8 group flex items-center justify-between hover:bg-white/5 transition-all duration-300">
                <div className="flex items-center gap-10 flex-1 min-w-0">
                  <div className="flex flex-col items-center justify-center min-w-[100px] border-r border-white/10 pr-10">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Type</span>
                    <span className="bg-white text-black text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">{alert.type}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                       <p className="text-xs font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                         <span className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_5px_#f00]"></span>
                         ID: {alert._id.slice(-12).toUpperCase()}
                       </p>
                       <span className="text-[10px] font-black text-white/10 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5 truncate max-w-[150px]">
                          Node: {targets.find(t => t._id === alert.targetId)?.name || "Unknown"}
                       </span>
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${alert.status === 'takedown' ? 'bg-green-500/20 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500/50 border border-yellow-500/10'}`}>
                          {alert.status}
                       </span>
                    </div>
                    <p className="text-2xl font-black tracking-tight truncate group-hover:text-glow transition-all">{alert.url}</p>
                    <div className="flex items-center gap-6 mt-3">
                       <p className="text-[10px] font-mono text-white/10 uppercase tracking-tighter group-hover:text-white/40 transition-colors">Detected // {new Date(alert.detectedAt).toLocaleString()}</p>
                       <div className="h-1 w-1 rounded-full bg-white/10"></div>
                       <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-2">
                          <span className="opacity-50">📧 Abuse Contact:</span>
                          <span className="text-white/60 font-black italic">{alert.abuseEmail || 'Resolving...'}</span>
                       </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 pl-10 border-l border-white/5 group-hover:border-white/20 transition-all">
                  <Link 
                    href={`/file/${alert._id}`}
                    className="p-4 rounded-xl bg-white text-black hover:bg-gray-200 transition-all group/dmca relative overflow-hidden text-center"
                  >
                     <span className="relative z-10 text-[10px] font-black uppercase tracking-widest leading-none">Open Case File</span>
                  </Link>
                  <a href={alert.url} target="_blank" className="p-4 rounded-xl border border-white/10 hover:border-white hover:text-white transition-all group/btn">
                     <span className="text-xs font-black uppercase tracking-widest">Audit Signal</span>
                  </a>
                  <button 
                    onClick={() => deleteAlert(alert._id)}
                    className="p-4 rounded-xl border border-white/10 hover:border-red-600 hover:bg-red-600/20 hover:text-red-500 transition-all text-white/20"
                    title="Purge Intelligence"
                  >
                     <span className="text-xs font-black uppercase tracking-widest">Dismiss</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
