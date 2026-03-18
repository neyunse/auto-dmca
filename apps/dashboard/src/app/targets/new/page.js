"use client";

import { useState } from "react";
import { useSocket } from "@/components/SocketProvider";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTarget() {
  const { socket } = useSocket();
  const { showToast } = useToast();
  const router = useRouter();
  const [type, setType] = useState("query");

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      type: formData.get("type"),
      value: formData.get("value"),
      queryParam: formData.get("queryParam") || "q",
    };

    socket.emit("add-target", data, (res) => {
      if (res.error) showToast(res.error, "error");
      else {
        showToast("Intelligence target deployed successfully", "success");
        router.push("/targets");
      }
    });
  };

  return (
    <div className="max-w-4xl space-y-16 animate-in slide-in-from-bottom-10 fade-in duration-1000">
      <header className="space-y-4">
        <Link href="/targets" className="group flex items-center gap-4 text-white/30 hover:text-white transition-all uppercase text-[10px] font-black tracking-[0.4em] mb-12">
           <span className="w-10 h-px bg-white/10 group-hover:w-16 group-hover:bg-white transition-all"></span>
           Return to Grid
        </Link>
        <div className="flex items-center gap-3">
           <div className="h-px w-12 bg-white/40"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Deployment Protocol</p>
        </div>
        <h2 className="text-7xl font-black uppercase tracking-tighter italic text-glow">Initialize Unit</h2>
        <p className="text-white/30 text-xs font-medium tracking-wide">Establishing a new intelligence tracking node within the global matrix.</p>
      </header>

      <form onSubmit={handleSubmit} className="glass-panel p-16 rounded-[3rem] space-y-16 group relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="space-y-12 relative z-10">
          
          <div className="space-y-4">
            <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
               <span className="w-1.5 h-1.5 bg-white/20"></span>
               Operative Alias
            </label>
            <input 
              type="text" 
              name="name" 
              required 
              placeholder="e.g. PROJECT_TITAN_WATCH"
              className="w-full bg-black/50 border border-white/10 rounded-2xl p-8 text-white focus:outline-none focus:border-white/40 focus:bg-black/80 transition-all uppercase font-black tracking-widest text-xl placeholder:text-white/5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
                 <span className="w-1.5 h-1.5 bg-white/20"></span>
                 Intelligence Strategy
              </label>
              <div className="relative group/sel">
                <select 
                  name="type" 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-24 bg-black border border-white/10 px-8 rounded-2xl text-white text-xs font-black uppercase appearance-none cursor-pointer pr-16 focus:border-white/40"
                >
                  <option value="query">Search Analysis (Piracy)</option>
                  <option value="domain">Market Scan (Gray Market)</option>
                </select>
                <div className="absolute top-1/2 right-6 -translate-y-1/2 pointer-events-none opacity-20">▼</div>
              </div>
            </div>
            
            <div className={`space-y-4 transition-all duration-500 ${type === "domain" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
              <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
                 <span className="w-1.5 h-1.5 bg-white/20"></span>
                 Query Hook Parameter
              </label>
              <input 
                type="text" 
                name="queryParam" 
                defaultValue="q"
                placeholder="search_param"
                className="w-full bg-black border border-white/10 rounded-2xl p-8 text-white focus:outline-none focus:border-white/40 transition-all font-mono text-sm uppercase"
              />
            </div>
          </div>

          <div className="space-y-4">
             <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
                <span className="w-1.5 h-1.5 bg-white/20"></span>
                Target Vector (Keyword / Domain)
             </label>
             <div className="relative group/input">
                <input 
                  type="text" 
                  name="value" 
                  required 
                  placeholder={type === "query" ? "e.g. MyGame Full Download" : "e.g. g2a.com"}
                  className="w-full bg-black border border-white/10 rounded-2xl p-8 text-white focus:outline-none focus:border-white/40 transition-all font-mono text-lg font-bold placeholder:text-white/5"
                />
                <div className="absolute top-1/2 right-8 -translate-y-1/2 flex gap-1 opacity-20 group-hover/input:opacity-100 transition-opacity">
                   {[1,2,3].map(i => <div key={i} className="w-1 h-4 bg-white"></div>)}
                </div>
             </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-white text-black hover:bg-gray-200 transition-all py-10 rounded-[2rem] font-black uppercase text-sm tracking-[1em] indent-[1em] hover:scale-[1.02] shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95"
        >
          Authorize Deployment
        </button>
      </form>
      
      <div className="flex justify-center gap-12 opacity-10">
         <span className="text-[10px] font-mono uppercase tracking-[0.5em]">Auth_Cert: 987-AXL-0</span>
         <span className="text-[10px] font-mono uppercase tracking-[0.5em]">Status: Verified</span>
         <span className="text-[10px] font-mono uppercase tracking-[0.5em]">Mode: Stealth</span>
      </div>
    </div>
  );
}
