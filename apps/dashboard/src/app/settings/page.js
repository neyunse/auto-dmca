"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/SocketProvider";
import { useToast } from "@/components/ToastProvider";

export default function Settings() {
  const { socket } = useSocket();
  const { showToast } = useToast();
  const [config, setConfig] = useState({ userAgent: "Loading...", cronInterval: "1", serpapiKey: "", hl: "en", gl: "us", location: "" });
  const [exclusions, setExclusions] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("get-config", (res) => {
      if (!res.error && res) setConfig(res);
    });

    socket.emit("get-exclusions", (res) => {
      if (!res.error) setExclusions(res);
    });

    socket.on("config-updated", (updatedConfigs) => {
      setConfig((prev) => {
         const newConf = { ...prev };
         updatedConfigs.forEach(c => newConf[c.key] = c.value);
         return newConf;
      });
    });

    socket.on("exclusion-added", (e) => setExclusions(prev => [...prev, e]));
    socket.on("exclusion-deleted", (id) => setExclusions(prev => prev.filter(e => e._id !== id)));

    return () => {
      socket.off("config-updated");
      socket.off("exclusion-added");
      socket.off("exclusion-deleted");
    };
  }, [socket]);

  const saveConfig = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = [
      { key: "userAgent", value: formData.get("userAgent") },
      { key: "cronInterval", value: formData.get("cronInterval") },
      { key: "serpapiKey", value: formData.get("serpapiKey") },
      { key: "hl", value: formData.get("hl") },
      { key: "gl", value: formData.get("gl") },
      { key: "location", value: formData.get("location") }
    ];
    
    socket.emit("save-config", updates, (res) => {
      if (res.error) showToast(res.error, "error");
      else showToast("Central Matrix Protocol Updated", "success");
    });
  };

  const addExclusion = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    socket.emit("add-exclusion", { value: formData.get("value"), type: formData.get("type") }, (res) => {
      if (res.error) showToast(res.error, "error");
      else {
        e.target.reset();
        showToast("Signal filtered", "success");
      }
    });
  };

  const deleteExclusion = (id) => {
    socket.emit("delete-exclusion", id, (res) => {
      if (res.error) showToast(res.error, "error");
      else showToast("Exclusion revoked", "success");
    });
  };

  return (
    <div className="space-y-20 animate-in fade-in duration-700">
      <header className="flex justify-between items-end pb-12 border-b border-white/5">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-px w-12 bg-white/20"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">System Architecture</p>
          </div>
          <h2 className="text-6xl font-black uppercase tracking-tighter italic text-glow">System Protocols</h2>
          <p className="text-white/30 text-xs font-medium tracking-wide">Configure identity spoofing, execution cycles, and global filtering.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
        
        {/* Core Config Section */}
        <div className="space-y-12">
           <div className="flex items-center gap-8">
              <span className="text-5xl font-black opacity-10 tracking-tighter">01</span>
              <h3 className="text-2xl font-black uppercase tracking-widest italic pt-2">Identity & Timing</h3>
           </div>
           
           <form onSubmit={saveConfig} className="glass-panel p-12 rounded-[2.5rem] space-y-12 relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-1000"></div>
              
              <div className="space-y-4 relative z-10">
                <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
                   <span className="w-1.5 h-1.5 bg-white/20"></span>
                   Master User-Agent
                </label>
                <div className="relative group/input">
                  <input 
                    type="text" 
                    name="userAgent" 
                    required 
                    defaultValue={config.userAgent}
                    key={config.userAgent}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-white font-mono text-sm focus:outline-none focus:border-white/40 focus:bg-black/80 transition-all"
                  />
                  <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity text-[8px] font-mono text-white/20 uppercase tracking-widest">EDIT_MODE</div>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
                   <span className="w-1.5 h-1.5 bg-white/20"></span>
                   SerpApi Intelligence Key
                </label>
                <div className="relative group/input">
                  <input 
                    type="password" 
                    name="serpapiKey" 
                    defaultValue={config.serpapiKey}
                    key={config.serpapiKey}
                    placeholder="Enter API Key for Google Dorking"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-white font-mono text-sm focus:outline-none focus:border-white/40 focus:bg-black/80 transition-all"
                  />
                  <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity text-[8px] font-mono text-white/20 uppercase tracking-widest">PRIVATE_KEY</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 relative z-10">
                <div className="space-y-4">
                  <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
                     <span className="w-1.5 h-1.5 bg-white/20"></span>
                     Host Language (hl)
                  </label>
                  <input 
                    type="text" 
                    name="hl" 
                    defaultValue={config.hl}
                    key={config.hl}
                    placeholder="all"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-white font-mono text-sm focus:outline-none focus:border-white/40 transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
                     <span className="w-1.5 h-1.5 bg-white/20"></span>
                     Geolocation (gl)
                  </label>
                  <input 
                    type="text" 
                    name="gl" 
                    defaultValue={config.gl}
                    key={config.gl}
                    placeholder="all"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-white font-mono text-sm focus:outline-none focus:border-white/40 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
                   <span className="w-1.5 h-1.5 bg-white/20"></span>
                   Specific Location
                </label>
                <div className="relative group/input">
                  <input 
                    type="text" 
                    name="location" 
                    defaultValue={config.location}
                    key={config.location}
                    placeholder="e.g. Austin, Texas, United States"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-white font-mono text-sm focus:outline-none focus:border-white/40 focus:bg-black/80 transition-all"
                  />
                  <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity text-[8px] font-mono text-white/20 uppercase tracking-widest">GEO_TARGET</div>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
                   <span className="w-1.5 h-1.5 bg-white/20"></span>
                   Pulse Frequency (Min)
                </label>
                <div className="flex gap-6">
                   <input 
                    type="number" 
                    name="cronInterval" 
                    min="1"
                    required 
                    defaultValue={config.cronInterval}
                    key={config.cronInterval}
                    className="flex-1 bg-black/50 border border-white/10 rounded-2xl p-6 text-white font-mono text-2xl font-black focus:outline-none focus:border-white/40 transition-all text-center italic"
                  />
                  <button 
                    type="submit" 
                    className="px-10 bg-white text-black font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:bg-gray-200 transition-all"
                  >
                    Sync Protocols
                  </button>
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-6">
                 <div className="text-3xl text-white/30">⚙️</div>
                 <p className="text-[10px] font-medium leading-relaxed text-white/40 uppercase tracking-wide italic">Protocol updates are emitted across all active worker instances immediately upon synchronization.</p>
              </div>
           </form>
        </div>

        {/* Exclusions Section */}
        <div className="space-y-12">
           <div className="flex items-center gap-8">
              <span className="text-5xl font-black opacity-10 tracking-tighter">02</span>
              <h3 className="text-2xl font-black uppercase tracking-widest italic pt-2">Signal Filter</h3>
           </div>

           <div className="glass-panel p-12 rounded-[2.5rem] flex flex-col min-h-[500px]">
              <form onSubmit={addExclusion} className="flex gap-4 mb-12">
                <div className="relative group/sel">
                   <select name="type" className="h-full bg-black border border-white/10 px-6 rounded-2xl text-white text-[10px] font-black uppercase appearance-none cursor-pointer pr-12 focus:border-white/40">
                    <option value="keyword">Keyword</option>
                    <option value="domain">Domain</option>
                  </select>
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none opacity-20 group-hover/sel:opacity-40 select-none">▼</div>
                </div>
                <input 
                  type="text" 
                  name="value" 
                  required 
                  placeholder="Intercept Value"
                  className="flex-1 bg-black border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-white/40 transition-all font-mono text-sm placeholder:text-white/10"
                />
                <button type="submit" className="bg-white text-black px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all">Add</button>
              </form>

              <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                {exclusions.length === 0 ? (
                  <div className="h-full flex flex-row items-center justify-center opacity-5 grayscale py-20 text-center">
                     <p className="text-[10px] font-black tracking-[0.5em] uppercase italic">Filter Matrix Empty</p>
                  </div>
                ) : (
                  exclusions.map(e => (
                    <div key={e._id} className="glass-card p-6 flex justify-between items-center group/item">
                      <div className="flex items-center gap-8">
                        <div className="px-4 py-1.5 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest group-hover/item:text-white/80 transition-colors">
                           {e.type}
                        </div>
                        <span className="font-mono text-sm tracking-tight font-medium">{e.value}</span>
                      </div>
                      <button 
                        onClick={() => deleteExclusion(e._id)} 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white/10 hover:text-white hover:bg-red-900/50 transition-all text-2xl font-light hover:rotate-90 duration-300"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
