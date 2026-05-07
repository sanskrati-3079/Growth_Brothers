import React from "react";
import { useAnalytics } from "../hooks/useAnalytics";
import { useDashboardOverview } from "../hooks/useDashboard";

export default function Home() {
  const { highlights, loading, error } = useAnalytics();
  const {
    data: dashboard,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDashboardOverview();

  const stats = [
    { label: "Total Uploads", value: highlights?.cards?.uploads },
    { label: "Scheduled", value: highlights?.cards?.scheduled },
    { label: "Platforms", value: highlights?.cards?.platforms },
    {
      label: "Engagement",
      value:
        typeof highlights?.cards?.engagementRate === "number"
          ? `${highlights?.cards?.engagementRate}%`
          : undefined,
    },
  ];

  const activityRows = dashboard?.recentActivity ?? [];
  const upcoming = dashboard?.schedule ?? [];

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary p-6 shadow-sm ring-1 ring-primary/20">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back 👋</h1>
        <p className="mt-1 text-sm text-white/90">
          Your distribution cockpit — upload, repurpose, schedule, and track.
        </p>
        <div className="mt-4 flex gap-2">
          <a href="/upload" className="btn btn-secondary bg-white text-primary hover:bg-slate-100">
            New Upload
          </a>
          <a href="/ai" className="btn btn-primary border border-white/30">
            Open AI Studio
          </a>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-secondary-dark">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold text-primary">
              {loading ? "..." : s.value ?? "--"}
            </p>
          </div>
        ))}
        {error && (
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Recent Activity</h2>
            <a href="/upload" className="text-sm font-medium text-secondary hover:text-secondary-dark">
              View all
            </a>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {dashboardLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm" colSpan={4}>
                      Loading activity...
                    </td>
                  </tr>
                ) : activityRows.length ? (
                  activityRows.map((item) => (
                    <tr key={item.id} className="hover:bg-primary/5">
                      <td className="px-4 py-3 text-sm">{item.title}</td>
                      <td className="px-4 py-3 text-sm capitalize">{item.type}</td>
                      <td className="px-4 py-3 text-sm text-secondary-dark capitalize">{item.status}</td>
                      <td className="px-4 py-3 text-sm">{new Date(item.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm" colSpan={4}>
                      No recent activity
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {dashboardError && <p className="mt-3 text-sm text-red-500">{dashboardError}</p>}
        </div>

        <div className="card">
          <h2 className="card-title">Schedule Overview</h2>
          <ul className="mt-4 space-y-3">
            {dashboardLoading ? (
              <li className="text-sm text-slate-500">Loading schedule...</li>
            ) : upcoming.length ? (
              upcoming.map((u) => (
                <li key={u.id} className="rounded-xl border border-slate-200 p-4 hover:bg-secondary/5">
                  <p className="text-sm text-slate-500">
                    {new Date(u.time).toLocaleString()} • {u.platform}
                  </p>
                  <p className="mt-1 font-medium text-primary-dark">{u.title}</p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No scheduled items</li>
            )}
          </ul>
          <a href="/scheduler" className="btn btn-secondary mt-4">Open Scheduler →</a>
        </div>
      </section>
    </div>
  );
}
