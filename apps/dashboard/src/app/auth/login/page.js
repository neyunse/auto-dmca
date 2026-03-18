"use client";

import { useState } from "react";
import { useSocket } from "@/components/SocketProvider";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();
  const { login, isRegistered } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!socket) return;

    setLoading(true);
    socket.emit("login", { username, password }, (res) => {
      setLoading(false);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        showToast("Authentication Successful. Welcome back, Admin.", "success");
        login(res);
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-12 animate-in fade-in zoom-in duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black uppercase tracking-tighter italic text-glow">Access Denied</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Secure Intelligence Portal</p>
      </div>

      <div className="glass-panel p-10 rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">Identifier</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-black tracking-widest outline-none focus:border-white/40 focus:bg-white/10 transition-all"
              placeholder="USERNAME"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">Encryption Key</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-black tracking-widest outline-none focus:border-white/40 focus:bg-white/10 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black p-6 rounded-2xl font-black uppercase tracking-[0.3em] hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Decrypting..." : "Initialise Auth"}
          </button>
        </form>

        {!isRegistered && (
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">No active admin detected</p>
            <Link href="/auth/register" className="text-[10px] font-black uppercase tracking-widest text-white hover:text-glow transition-all">
              Establish Initial Protocol →
            </Link>
          </div>
        )}
      </div>

      <p className="text-[9px] text-center text-white/10 font-mono uppercase tracking-[0.2em]">
        Authorized access only. All connection attempts are logged into the matrix.
      </p>
    </div>
  );
}
