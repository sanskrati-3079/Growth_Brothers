import React from "react";

export default function CalendarView({ items = [] }) {
  return (
    <div className="card">
      <p className="card-title">Upcoming</p>
      <ul className="mt-3 space-y-2 text-sm">
        {items.length ? items.map((it) => (
          <li key={it.id} className="rounded-xl border p-3 ring-1 ring-secondary/20">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">{it.time} • {it.platform}</span>
              <span className="font-medium text-primary-dark">{it.title}</span>
            </div>
          </li>
        )) : <li className="text-slate-500">No scheduled items</li>}
      </ul>
    </div>
  );
}
