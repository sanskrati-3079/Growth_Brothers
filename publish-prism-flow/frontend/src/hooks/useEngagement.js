import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPut } from "../api/client";

export function useEngagement() {
  const [comments, setComments] = useState([]);
  const [template, setTemplate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiGet("/engagement/overview");
      setComments(payload?.comments ?? []);
      setTemplate(payload?.template ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveTemplate = useCallback(async (message) => {
    const payload = await apiPut("/engagement/template", { template: message });
    setTemplate(payload?.template ?? message);
    return payload;
  }, []);

  return { comments, template, loading, error, refresh: load, saveTemplate };
}

export default useEngagement;
