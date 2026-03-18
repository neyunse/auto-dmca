"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/SocketProvider";
import { useToast } from "@/components/ToastProvider";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function CaseFile() {
  const { socket } = useSocket();
  const { showToast } = useToast();
  const router = useRouter();
  const { id } = useParams();
  const [alert, setAlert] = useState(null);
  const [emailBody, setEmailBody] = useState("");

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("get-alert-detail", id, (res) => {
      if (!res || res.error) {
        showToast(res?.error || "Case file not found or inaccessible", "error");
        router.push("/");
      } else {
        setAlert(res);
        if (res.sentBody) {
          setEmailBody(res.sentBody);
        } else {
          // Generate default template
          setEmailBody(`DMCA Takedown Notice\n\nAsset: ${res.targetId?.name || 'Protected Content'}\nViolation URL: ${res.url}\n\nPlease remove this content immediately as it infringes upon our intellectual property rights.`);
        }
      }
    });

    socket.on("alert-deleted", (deletedId) => {
      if (deletedId === id) {
        showToast("Intelligence record purged from central matrix", "success");
        router.push("/");
      }
    });

    return () => {
      socket.off("alert-deleted");
    };
  }, [socket, id, router, showToast]);

  const handleDelete = () => {
    socket.emit("delete-alert", id, (res) => {
      if (res.error) showToast(res.error, "error");
    });
  };

  const handleExclude = () => {
    try {
      const url = new URL(alert.url);
      const domain = url.hostname;
      socket.emit("exclude-domain-and-delete", { domain, url: alert.url, alertId: id }, (res) => {
        if (res.error) showToast(res.error, "error");
      });
    } catch (e) {
      showToast("Invalid URL for exclusion", "error");
    }
  };

  const handleMarkSent = () => {
    socket.emit("mark-sent", { id, body: emailBody }, (res) => {
      if (res.error) showToast(res.error, "error");
      else {
        showToast("DMCA Execution Logged", "success");
        setAlert(res);
      }
    });
  };

  if (!alert) return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-8 animate-pulse text-white/20">
       <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
       <p className="text-[10px] font-black uppercase tracking-[0.5em]">Decrypting Case File...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in slide-in-from-bottom-10 fade-in duration-1000">
      <header className="space-y-4">
        <Link href="/" className="group flex items-center gap-4 text-white/30 hover:text-white transition-all uppercase text-[10px] font-black tracking-[0.4em] mb-12">
           <span className="w-10 h-px bg-white/10 group-hover:w-16 group-hover:bg-white transition-all"></span>
           Return to Intelligence Stream
        </Link>
        <div className="flex items-center gap-3">
           <div className="h-px w-12 bg-white/40"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Evidence Audit</p>
        </div>
        <h2 className="text-7xl font-black uppercase tracking-tighter italic text-glow">Case File</h2>
        <p className="text-white/30 text-xs font-medium tracking-wide flex items-center gap-4">
           Ref ID: <span className="font-mono text-white/60">{id.toUpperCase()}</span>
           <span className="h-1 w-1 rounded-full bg-white/20"></span>
           Status: <span className={`font-black uppercase tracking-widest ${alert.status === 'takedown' ? 'text-green-500 shadow-[0_0_10px_#22c55e44]' : 'text-yellow-500'}`}>{alert.status}</span>
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Main Intelligence Card */}
        <div className="lg:col-span-2 space-y-12">
          <div className="glass-panel p-12 rounded-[3rem] space-y-12 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            
            <div className="space-y-6">
              <label className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 flex items-center gap-4">
                 <span className="w-1.5 h-1.5 bg-white/20"></span>
                 Confirmed Infraction URL
              </label>
              <div className="p-8 bg-black/40 border border-white/5 rounded-2xl group/url overflow-hidden">
                 <p className="text-2xl font-black text-white group-hover:text-glow transition-all break-all">{alert.url}</p>
                 <a href={alert.url} target="_blank" className="inline-block mt-4 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                    External Audit ↗
                 </a>
              </div>
            </div>

            <div className="space-y-6">
               <label className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 flex items-center gap-4">
                  <span className="w-1.5 h-1.5 bg-white/20"></span>
                  Action Content (Stored Email)
               </label>
               <textarea 
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  readOnly={alert.status === 'takedown'}
                  className="w-full h-64 bg-black/60 border border-white/5 rounded-2xl p-8 font-mono text-xs text-white/60 focus:border-white/20 focus:text-white focus:bg-black transition-all outline-none resize-none custom-scrollbar"
                  placeholder="Drafting infringement notice content..."
               />
            </div>

            <div className="grid grid-cols-2 gap-12">
               <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">Assigned Node</label>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                     <p className="text-sm font-black uppercase tracking-widest text-white/60">{alert.targetId?.name || "Unknown Asset"}</p>
                     <p className="text-[10px] font-mono text-white/20 mt-1">{alert.targetId?.type || 'query'}</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">Detection Cycle</label>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                     <p className="text-sm font-black text-white/60">{new Date(alert.detectedAt).toLocaleString()}</p>
                     <p className="text-[10px] font-mono text-white/20 mt-1 uppercase tracking-tighter italic">Automatic Intercept</p>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <label className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 flex items-center gap-4">
                  <span className="w-1.5 h-1.5 bg-white/20"></span>
                  Host Intelligence (WHOIS)
               </label>
               <div className="glass-card p-10 flex items-center justify-between group/host">
                  <div className="space-y-2">
                     <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Abuse Contact Email</p>
                     <p className="text-3xl font-black italic tracking-tight text-glow">{alert.abuseEmail || 'UNRESOLVED'}</p>
                  </div>
                  <div className="text-5xl opacity-10 group-hover/host:opacity-30 transition-opacity">🛡️</div>
               </div>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-12">
          <div className="flex items-center gap-8">
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Directives</p>
          </div>
          
          <div className="space-y-6">
            <a 
              href={`mailto:${alert.abuseEmail}?subject=DMCA Notice: ${alert.targetId?.name}&body=${encodeURIComponent(emailBody)}`}
              onClick={handleMarkSent}
              className={`w-full p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all group/btn text-center
                ${alert.status === 'takedown' 
                  ? 'bg-green-900/10 border border-green-500/20 text-green-500/40 pointer-events-none' 
                  : 'bg-white text-black hover:bg-gray-200 active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]'}
              `}
            >
               <span className="text-xs font-black uppercase tracking-[0.3em]">{alert.status === 'takedown' ? 'DMCAs SENT' : 'EXECUTE & STORE'}</span>
               {alert.sentAt && <span className="text-[9px] font-mono opacity-40 uppercase">Logged at: {new Date(alert.sentAt).toLocaleString()}</span>}
            </a>

            <div className="p-8 glass-panel rounded-[2rem] space-y-8">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center text-white/20 border-b border-white/5 pb-6">Asset Security</p>
               
               <div className="space-y-4">
                  <button 
                    onClick={handleExclude}
                    className="w-full p-6 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:border-white hover:bg-white/5 transition-all text-left flex items-center justify-between group/ex"
                  >
                     Exclude Domain
                     <span className="opacity-0 group-hover/ex:opacity-100 transition-opacity text-xs">🚫</span>
                  </button>

                  <button 
                    onClick={handleDelete}
                    className="w-full p-6 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-red-900/60 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all text-left flex items-center justify-between group/del"
                  >
                     Purge Evidence
                     <span className="opacity-0 group-hover/del:opacity-100 transition-opacity text-xs">🗑️</span>
                  </button>
               </div>

               <div className="pt-6 border-t border-white/5">
                  <p className="text-[9px] font-medium leading-relaxed text-white/20 uppercase tracking-widest italic text-center">
                     Changes to domain exclusion parameters are applied globally across the network.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
