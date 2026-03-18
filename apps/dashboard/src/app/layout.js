import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SocketProvider } from "@/components/SocketProvider";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "Overwatch DMCA | Command Center",
  description: "Autonomous Intelligence Unit for IP Protection",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-black text-white selection:bg-white selection:text-black overflow-x-hidden antialiased`}>
        {/* Ambient background effect */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-white/5 rounded-full blur-[100px]"></div>
        </div>

        <SocketProvider>
          <ToastProvider>
            <div className="flex min-h-screen relative z-10">
              <Sidebar />
              <main className="flex-1 ml-72 p-12 max-w-[1600px] mx-auto w-full relative">
                 <div className="absolute top-0 right-0 p-8 opacity-5 font-mono text-[10px] tracking-[0.5em] pointer-events-none">DMCA // CORE_MODULE_v2.4</div>
                 {children}
              </main>
            </div>
          </ToastProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
