import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, getToken, setToken } from "../api/client";

const AuthCtx = createContext(null);

/**
 * Real auth backed by the FastAPI `/users/*` endpoints.
 * Token lives in localStorage; user object is hydrated from /users/me on mount.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'init' = checking existing token, 'idle' = ready, 'authenticating' = in flight
  const [status, setStatus] = useState(getToken() ? "init" : "idle");
  const [error, setError] = useState("");

  // Rehydrate session from token on mount
  useEffect(() => {
    if (!getToken()) {
      setStatus("idle");
      return;
    }
    let cancelled = false;
    apiGet("/users/me")
      .then((data) => {
        if (!cancelled) setUser(data?.user || null);
      })
      .catch(() => {
        if (!cancelled) {
          setToken("");
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setStatus("idle");
      });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    setStatus("authenticating");
    setError("");
    try {
      const data = await apiPost("/users/login", { email, password });
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setStatus("idle");
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setStatus("authenticating");
    setError("");
    try {
      const data = await apiPost("/users/register", { name, email, password });
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setStatus("idle");
    }
  }, []);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, status, error, login, register, logout, isAuthenticated: !!user }),
    [user, status, error, login, register, logout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
