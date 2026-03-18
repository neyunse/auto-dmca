"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSocket } from "./SocketProvider";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(true); // Default to true to avoid flashing register page
  const { socket } = useSocket();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = localStorage.getItem("dmca_token");
    const storedUser = localStorage.getItem("dmca_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit("check-registration-status", (res) => {
      if (res && res.hasOwnProperty("registered")) {
        setIsRegistered(res.registered);
      }
    });
  }, [socket]);

  useEffect(() => {
    if (loading) return;

    const publicPages = ["/auth/login", "/auth/register"];
    const isPublicPage = publicPages.includes(pathname);

    if (!user && !isPublicPage) {
      if (!isRegistered) {
        router.push("/auth/register");
      } else {
        router.push("/auth/login");
      }
    } else if (user && isPublicPage) {
      router.push("/");
    }
  }, [user, loading, pathname, isRegistered, router]);

  const login = (data) => {
    localStorage.setItem("dmca_token", data.token);
    localStorage.setItem("dmca_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("dmca_token");
    localStorage.removeItem("dmca_user");
    setToken(null);
    setUser(null);
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isRegistered, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
