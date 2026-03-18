"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/SocketProvider";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";

export default function Targets() {
  const { socket } = useSocket();
  const { showToast } = useToast();
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("get-targets", (res) => {
      if (!res.error) setTargets(res);
    });

    socket.on("target-added", (newTarget) => {
      setTargets((prev) => [...prev, newTarget]);
    });

    socket.on("target-deleted", (id) => {
      setTargets((prev) => prev.filter(t => t._id !== id));
    });

    socket.on("target-updated", (updated) => {
      setTargets(prev => prev.map(t => t._id === updated._id ? updated : t));
    });

    return () => {
      socket.off("target-added");
      socket.off("target-deleted");
      socket.off("target-updated");
    };
  }, [socket]);

  const deleteTarget = (id) => {
    socket.emit("delete-target", id, (res) => {
      if (res.error) showToast(res.error, "error");
      else showToast("Operative decommissioned", "success");
    });
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <header className="flex justify-between items-end pb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-px w-12 bg-white/20"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Deployment Ops</p>
          </div>
          <h2 className="text-6xl font-black uppercase tracking-tighter italic text-glow">Intelligence Grid</h2>
          <p className="text-white/30 text-xs font-medium tracking-wide">Managing active monitoring nodes and signal interception units.</p>
        </div>
        
        <Link 
          href="/targets/new"
          className="group relative px-10 py-5 bg-white text-black font-black uppercase text-xs tracking-[0.3em] overflow-hidden transition-all hover:pr-14"
        >
          <span className="relative z-10">Deploy New Unit</span>
          <span className="absolute right-[-20px] top-1/2 -translate-y-1/2 transition-all group-hover:right-6">→</span>
          <div className="absolute inset-0 bg-gray-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </Link>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {targets.length === 0 ? (
          <div className="col-span-2 py-60 glass-panel rounded-[3rem] text-center flex flex-col items-center justify-center gap-10 group">
             <div className="relative">
                <div className="w-32 h-32 rounded-full border border-white/5 flex items-center justify-center text-7xl grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000">🔭</div>
                <div className="absolute inset-0 border-2 border-white/10 rounded-full animate-ping pointer-events-none"></div>
             </div>
             <div className="space-y-3">
                <p className="text-white/40 font-black uppercase tracking-[0.8em] text-sm indent-[0.8em]">No Active Signals</p>
                <p className="text-white/10 font-mono text-[9px] uppercase tracking-widest">Waiting for initial target deployment protocol...</p>
             </div>
          </div>
        ) : (
          targets.map((t, i) => (
            <div key={t._id} className="glass-card p-10 group relative flex flex-col justify-between min-h-[400px]">
               {/* Decorative Tech Elements */}
               <div className="absolute top-8 right-8 text-[8px] font-mono text-white/10 uppercase tracking-[0.5em] group-hover:text-white/30 transition-colors">NODE_0{i + 1} // SYNC_ACTIVE</div>
               <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-white/40 transition-all duration-700"></div>

               <div>
                 <div className="flex justify-between items-start mb-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full ${t.active ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{t.type} Strategy</span>
                      </div>
                      <h3 className="text-4xl font-black uppercase tracking-tighter italic group-hover:text-glow transition-all">{t.name}</h3>
                    </div>
                 </div>

                 <div className="space-y-8 bg-black/40 p-8 rounded-2xl border border-white/5 group-hover:border-white/10 transition-all">
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Target Vector</span>
                      <p className="font-mono text-sm break-all font-bold tracking-tight text-white/80">{t.value}</p>
                    </div>
                    {t.queryParam && t.queryParam !== 'q' && (
                      <div className="flex flex-col gap-2 pt-6 border-t border-white/5">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Logic Parameter</span>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-white/60 font-mono">?{t.queryParam}=</span>
                           <span className="text-[9px] text-white/30 italic uppercase">Custom search hook</span>
                        </div>
                      </div>
                    )}
                 </div>
               </div>

               <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-8">
                  <div className="flex gap-10">
                    <Link href={`/targets/edit/${t._id}`} className="group/link flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">
                       <span className="w-1 h-3 bg-white/10 group-hover/link:bg-white transition-colors"></span>
                       Edit Node
                    </Link>
                    <button onClick={() => deleteTarget(t._id)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-900 hover:text-red-500 transition-all">
                       Terminate
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-mono text-white/10 uppercase tracking-widest">Operational Hash</p>
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">{t._id}</p>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
