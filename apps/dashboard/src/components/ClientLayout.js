"use client";

import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/components/AuthProvider";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  const isAuthPage = pathname.startsWith("/auth");

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center space-y-8 bg-black">
        <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Initialising Neural Link...</p>
      </div>
    );
  }

  // If it's an auth page or not logged in, don't show the sidebar
  if (isAuthPage || !user) {
    return (
      <div className="min-h-screen relative z-10 flex items-center justify-center p-6 bg-black">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen relative z-10 bg-black">
      <Sidebar />
      <main className="flex-1 ml-72 p-12 max-w-[1600px] mx-auto w-full relative">
         <div className="absolute top-0 right-0 p-8 opacity-5 font-mono text-[10px] tracking-[0.5em] pointer-events-none">DMCA // CORE_MODULE_v2.4</div>
         {children}
      </main>
    </div>
  );
}
