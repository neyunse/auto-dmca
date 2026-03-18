"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/components/SocketProvider";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();
  const { isRegistered, login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isRegistered) {
      router.push("/auth/login");
    }
  }, [isRegistered, router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!socket) return;

    if (password !== confirmPassword) {
      return showToast("Passwords do not match", "error");
    }

    setLoading(true);
    socket.emit("register", { username, password }, (res) => {
      setLoading(false);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        showToast("Initial Admin Access Established. Identity Verified.", "success");
        // Redirect to login
        router.push("/auth/login");
      }
    });
  };

  if (isRegistered) return null;

  return (
    <div className="w-full max-w-md space-y-12 animate-in fade-in slide-in-from-top-10 duration-1000">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black uppercase tracking-tighter italic text-glow">Identity Setup</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Protocol: Initial Node Admin Establishment</p>
      </div>

      <div className="glass-panel p-10 rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center text-white/20 border-b border-white/5 pb-6 mb-8 italic">
          CRITICAL: This is a one-time operation. Subsequent registration attempts will be void.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">Master Identifier</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-black tracking-widest outline-none focus:border-white/40 focus:bg-white/10 transition-all font-mono"
              placeholder="ROOT_ADMIN"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">Access Key Override</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-black tracking-widest outline-none focus:border-white/40 focus:bg-white/10 transition-all font-mono"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 px-2">Verify Access Key</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-black tracking-widest outline-none focus:border-white/40 focus:bg-white/10 transition-all font-mono"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black p-6 rounded-2xl font-black uppercase tracking-[0.3em] hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Synchronising Identity..." : "Finalise Protocol"}
          </button>
        </form>
      </div>

      <p className="text-[9px] text-center text-white/10 font-mono uppercase tracking-[0.2em] leading-relaxed">
        System lockdown will occur immediately after this operation. Ensure identifier and access key are stored securely.
      </p>
    </div>
  );
}
