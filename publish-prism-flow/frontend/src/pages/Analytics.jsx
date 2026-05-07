import React, { useMemo } from "react";
import AnalyticsCharts from "../components/analytics/AnalyticsCharts";
import PlatformComparison from "../components/analytics/PlatformComparison";
import { useAnalytics } from "../hooks/useAnalytics";

export default function Analytics() {
  const { summary, highlights, loading, error } = useAnalytics("30d");

  const chartData = useMemo(() => {
    const views = summary?.data?.map((entry) => entry.impressions ?? 0) ?? [];
    const likes = summary?.data?.map((entry) => entry.engagements ?? 0) ?? [];
    return { views, likes };
  }, [summary]);

  const platformData = highlights?.platformTotals ?? {};

  const statCards = [
    { label: "Total Uploads", value: highlights?.cards?.uploads ?? "--" },
    { label: "Scheduled", value: highlights?.cards?.scheduled ?? "--" },
    { label: "Platforms", value: highlights?.cards?.platforms ?? "--" },
    {
      label: "Engagement",
      value:
        typeof highlights?.cards?.engagementRate === "number"
          ? `${highlights?.cards?.engagementRate}%`
          : "--",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-primary/10">
        <h1 className="text-xl font-semibold text-primary-dark">Analytics</h1>
        <p className="text-sm text-slate-600">Track performance & comparisons.</p>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="card">
            <p className="text-sm text-secondary-dark">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-primary">{card.value}</p>
          </div>
        ))}
      </section>

      <AnalyticsCharts data={chartData} loading={loading} />

      <PlatformComparison data={platformData} />
    </div>
  );
}
