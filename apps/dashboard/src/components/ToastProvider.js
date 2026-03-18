"use client";

import { useState, useEffect, createContext, useContext } from "react";

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.show && (
        <div className={`fixed top-8 right-8 z-50 px-8 py-5 font-mono text-xs uppercase tracking-[0.3em] border-2 shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)] transition-all animate-in fade-in slide-in-from-right-10 duration-300 ${
          toast.type === 'error' ? 'bg-red-600 text-white border-red-800' : 'bg-white text-black border-white'
        }`}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};
