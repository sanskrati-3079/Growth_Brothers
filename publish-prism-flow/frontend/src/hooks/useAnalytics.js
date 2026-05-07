import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api/client";

const DEFAULT_RANGE = "30d";

export function useAnalytics(range = DEFAULT_RANGE) {
  const [summary, setSummary] = useState({ range, data: [] });
  const [highlights, setHighlights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(
    async (nextRange = range, signal) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ range: nextRange });
        const [summaryPayload, highlightPayload] = await Promise.all([
          apiGet(`/analytics/summary?${params.toString()}`, { signal }),
          apiGet(`/analytics/highlights?${params.toString()}`, { signal }),
        ]);

        if (!signal?.aborted) {
          setSummary({
            range: summaryPayload?.range ?? nextRange,
            data: summaryPayload?.data ?? [],
          });
          setHighlights(highlightPayload ?? null);
        }
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load analytics");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [range],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchAnalytics(range, controller.signal);
    return () => controller.abort();
  }, [range, fetchAnalytics]);

  const refresh = useCallback(() => {
    const controller = new AbortController();
    fetchAnalytics(range, controller.signal);
  }, [fetchAnalytics, range]);

  return {
    summary,
    highlights,
    loading,
    error,
    refresh,
  };
}

export default useAnalytics;
