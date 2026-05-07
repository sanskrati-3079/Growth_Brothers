import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api/client";

const defaultState = {
  recentActivity: [],
  schedule: [],
  logs: [],
  engagement: null,
};

export function useDashboardOverview() {
  const [data, setData] = useState(defaultState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiGet("/dashboard/overview");
      setData({
        recentActivity: payload?.recentActivity ?? [],
        schedule: payload?.schedule ?? [],
        logs: payload?.logs ?? [],
        engagement: payload?.engagement ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { data, loading, error, refresh: fetchOverview };
}

export default useDashboardOverview;
