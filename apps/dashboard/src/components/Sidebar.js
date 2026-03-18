"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const navItems = [
  { name: "Command Center", icon: "💎", path: "/" },
  { name: "Active Operatives", icon: "🛰️", path: "/targets" },
  { name: "System Protocols", icon: "🧠", path: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-72 bg-black/80 backdrop-blur-xl border-r border-white/10 flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-10 mb-4">
        <div className="relative group cursor-default">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none text-white">
            OVERWATCH
          </h1>
          <p className="text-[9px] font-mono tracking-[0.4em] text-white/40 mt-1 uppercase">Advanced DMCA AI</p>
          <div className="absolute -bottom-4 left-0 w-12 h-1 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
        </div>
      </div>
      
      <nav className="flex-1 px-6 space-y-4">
        <p className="px-4 text-[9px] uppercase font-bold tracking-[0.3em] text-white/20 mb-6">Main Navigation</p>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`group flex items-center justify-between px-5 py-4 rounded-xl transition-all duration-300 relative overflow-hidden ${
                isActive 
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <span className={`text-lg transition-transform duration-300 group-hover:scale-125 ${isActive ? "" : "grayscale"}`}>{item.icon}</span>
                <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-black rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-8 space-y-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-white/10 bg-gradient-to-tr from-white/5 to-white/20 p-1">
                 <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-black font-black text-xs italic">
                   {user?.username?.charAt(0).toUpperCase() || 'A'}
                 </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-black flex items-center justify-center">
                 <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white truncate max-w-[120px]">{user?.username || 'Administrator'}</p>
              <p className="text-[9px] font-mono text-white/30 uppercase">{user?.role || 'Level 4'} Access</p>
            </div>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full p-4 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/5 transition-all text-center"
        >
          Terminate Session
        </button>
      </div>
    </aside>
  );
}
