import { useState, useEffect } from "react";

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser]   = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("token", token); else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user)); else localStorage.removeItem("user");
  }, [user]);

  const logout = () => { setToken(null); setUser(null); };

  return { token, setToken, user, setUser, logout };
}
