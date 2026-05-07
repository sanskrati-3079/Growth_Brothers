/**
 * Tiny fetch wrapper that:
 *   - prefixes every call with VITE_API_BASE_URL
 *   - attaches the bearer token from localStorage when present
 *   - parses JSON responses (and throws an Error with `detail` from FastAPI)
 *
 * Usage:
 *   import { apiGet, apiPost, apiPut, apiDelete } from "../api/client";
 *   const me = await apiGet("/users/me");
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

const TOKEN_KEY = "gb_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request(method, path, body, opts = {}) {
  const headers = { ...authHeaders(), ...(opts.headers || {}) };
  const init = { method, headers, ...opts };

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, init);

  // Best-effort JSON parse
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }

  if (!res.ok) {
    const detail =
      (data && (data.detail || data.message || data.error)) ||
      `Request failed (${res.status})`;
    const err = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const apiGet = (path, opts) => request("GET", path, undefined, opts);
export const apiPost = (path, body, opts) => request("POST", path, body, opts);
export const apiPut = (path, body, opts) => request("PUT", path, body, opts);
export const apiDelete = (path, opts) => request("DELETE", path, undefined, opts);
