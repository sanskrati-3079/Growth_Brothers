import React from "react";
import { useDashboardOverview } from "../hooks/useDashboard";

export default function Admin() {
  const { data, loading, error } = useDashboardOverview();
  const items = data?.logs ?? [];

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-primary-dark">System Logs</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {loading ? (
            <li className="text-slate-500">Loading logs...</li>
          ) : items.length ? (
            items.map((i) => (
              <li key={i.id} className="rounded-xl border p-3 ring-1 ring-secondary/20">
                <span className="mr-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs uppercase text-primary">
                  {i.level}
                </span>
                <span>{i.message}</span>
                <span className="ml-2 text-xs text-slate-500">{new Date(i.timestamp).toLocaleString()}</span>
              </li>
            ))
          ) : (
            <li className="text-slate-500">No logs available</li>
          )}
        </ul>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
