import React from "react";

const items = [
  { label: "Dashboard", href: "/" },
  { label: "Upload", href: "/upload" },
  { label: "AI Studio", href: "/ai" },
  { label: "Repurpose", href: "/repurpose" },
  { label: "Scheduler", href: "/scheduler" },
  { label: "Analytics", href: "/analytics" },
  { label: "Engagement", href: "/engagement" },
  { label: "Accounts", href: "/accounts" },
  { label: "Admin", href: "/admin" },
];

export default function Sidebar() {
  return (
    <aside className="card p-4">
      <p className="mb-3 text-sm font-semibold text-primary-dark">Navigate</p>
      <ul className="space-y-1 text-sm">
        {items.map((it) => (
          <li key={it.href}>
            <a
              href={it.href}
              className="block rounded-lg px-3 py-2 hover:bg-primary/5 hover:text-primary"
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
