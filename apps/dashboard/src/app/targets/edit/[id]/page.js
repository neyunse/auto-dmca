"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/SocketProvider";
import { useToast } from "@/components/ToastProvider";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditTarget() {
  const { socket } = useSocket();
  const { showToast } = useToast();
  const router = useRouter();
  const { id } = useParams();
  const [type, setType] = useState("query");
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("get-targets", (res) => {
      if (!res.error) {
        const found = res.find(t => t._id === id);
        if (found) {
          setTarget(found);
          setType(found.type);
        }
      }
    });
  }, [socket, id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      id: id,
      name: formData.get("name"),
      type: formData.get("type"),
      value: formData.get("value"),
      queryParam: formData.get("queryParam") || "q",
      active: formData.get("active") === "on"
    };

    socket.emit("update-target", data, (res) => {
      if (res.error) showToast(res.error, "error");
      else {
        showToast("Intelligence target reconfigured", "success");
        router.push("/targets");
      }
    });
  };

  if (!target) return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-8 animate-pulse">
       <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Accessing Node Data...</p>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-16 animate-in slide-in-from-bottom-10 fade-in duration-1000">
      <header className="space-y-4">
        <Link href="/targets" className="group flex items-center gap-4 text-white/30 hover:text-white transition-all uppercase text-[10px] font-black tracking-[0.4em] mb-12">
           <span className="w-10 h-px bg-white/10 group-hover:w-16 group-hover:bg-white transition-all"></span>
           Return to Grid
        </Link>
        <div className="flex items-center gap-3">
           <div className="h-px w-12 bg-white/40"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Configuration Override</p>
        </div>
        <h2 className="text-7xl font-black uppercase tracking-tighter italic text-glow">Modify Unit</h2>
        <p className="text-white/30 text-xs font-medium tracking-wide">Target Node ID: <span className="font-mono text-white/60">{id}</span></p>
      </header>

      <form onSubmit={handleSubmit} className="glass-panel p-16 rounded-[3rem] space-y-16 group relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="space-y-12 relative z-10">
          
          <div className="flex justify-between items-center p-8 bg-black/40 border border-white/5 rounded-2xl group/status hover:border-white/20 transition-all">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30">Deployment Status</label>
              <p className="text-xs text-white/60 uppercase font-bold tracking-widest">{target.active ? 'Operational' : 'Paused'}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="active" defaultChecked={target.active} className="sr-only peer" />
              <div className="w-14 h-7 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white/20 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-black peer-checked:after:translate-x-7"></div>
            </label>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
               <span className="w-1.5 h-1.5 bg-white/20"></span>
               Operative Alias
            </label>
            <input 
              type="text" 
              name="name" 
              required 
              defaultValue={target.name}
              className="w-full bg-black/50 border border-white/10 rounded-2xl p-8 text-white focus:outline-none focus:border-white/40 focus:bg-black/80 transition-all uppercase font-black tracking-widest text-xl"
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
            
            <div className={`space-y-4 transition-all duration-500`}>
              <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
                 <span className="w-1.5 h-1.5 bg-white/20"></span>
                 Logic Parameter
              </label>
              <input 
                type="text" 
                name="queryParam" 
                defaultValue={target.queryParam || "q"}
                className="w-full bg-black border border-white/10 rounded-2xl p-8 text-white focus:outline-none focus:border-white/40 transition-all font-mono text-sm uppercase"
              />
            </div>
          </div>

          <div className="space-y-4">
             <label className="flex items-center gap-4 text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">
                <span className="w-1.5 h-1.5 bg-white/20"></span>
                Vector Value
             </label>
             <input 
               type="text" 
               name="value" 
               required 
               defaultValue={target.value}
               className="w-full bg-black border border-white/10 rounded-2xl p-8 text-white focus:outline-none focus:border-white/40 transition-all font-mono text-lg font-bold"
             />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-white text-black hover:bg-gray-200 transition-all py-10 rounded-[2rem] font-black uppercase text-sm tracking-[1em] indent-[1em] hover:scale-[1.02] shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95"
        >
          Update Deployment Protocol
        </button>
      </form>
    </div>
  );
}
