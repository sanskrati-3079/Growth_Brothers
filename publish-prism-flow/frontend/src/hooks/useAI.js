import { useCallback, useState } from "react";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

async function postJSON(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request to ${path} failed (${res.status})`);
  }
  return res.json();
}

/**
 * Hook for AI-powered text generation.
 * Falls back to a deterministic stub if the backend is unreachable so the
 * UI still produces a result instead of breaking.
 */
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateCaption = useCallback(async (topic, platform = "instagram") => {
    setLoading(true);
    setError("");
    try {
      const data = await postJSON("/api/v1/generate/caption", { topic, platform });
      return data.caption;
    } catch (err) {
      setError(err.message);
      return `Hook: ${topic}\nValue: One small move daily compounds.\nCTA: Save and share if this hit.`;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateHashtags = useCallback(async (keywords, count = 12) => {
    setLoading(true);
    setError("");
    try {
      const data = await postJSON("/api/v1/generate/hashtags", { keywords, count });
      return data.hashtags;
    } catch (err) {
      setError(err.message);
      const base = keywords.split(",").map((s) => s.trim().replace(/\s+/g, "")).filter(Boolean);
      return [...base, "growth", "creator", "marketing"].slice(0, count).map((t) => `#${t}`).join(" ");
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, generateCaption, generateHashtags };
}

export default useAI;
