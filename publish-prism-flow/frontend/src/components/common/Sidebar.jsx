import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Wand2,
  RefreshCw,
  CalendarDays,
  BarChart2,
  Heart,
  Link2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";

const GROUPS = [
  {
    label: "Content",
    items: [
      { label: "Dashboard",  href: "/",         icon: LayoutDashboard },
      { label: "Upload",     href: "/upload",   icon: Upload },
      { label: "AI Studio",  href: "/ai",       icon: Wand2 },
    ],
  },
  {
    label: "Distribution",
    items: [
      { label: "Repurpose",  href: "/repurpose",  icon: RefreshCw },
      { label: "Scheduler",  href: "/scheduler",  icon: CalendarDays },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics",  href: "/analytics",  icon: BarChart2 },
      { label: "Engagement", href: "/engagement", icon: Heart },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Accounts",   href: "/accounts",   icon: Link2 },
      { label: "Admin",      href: "/admin",      icon: ShieldCheck },
    ],
  },
];

const linkBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group";
const linkIdle =
  "text-slate-600 hover:bg-primary/8 hover:text-primary-dark";
const linkActive =
  "bg-primary/10 text-primary-dark shadow-sm ring-1 ring-primary/20";

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`flex flex-col h-full transition-all duration-200 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Brand row */}
      <div className="flex items-center justify-between px-3 py-4 mb-1">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary shadow-soft">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-primary-dark tracking-tight">
              Growth Bros
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <NavLink
                    to={href}
                    end={href === "/"}
                    className={({ isActive }) =>
                      `${linkBase} ${isActive ? linkActive : linkIdle} ${
                        collapsed ? "justify-center" : ""
                      }`
                    }
                    title={collapsed ? label : undefined}
                  >
                    <Icon
                      size={17}
                      className="shrink-0 transition-transform group-hover:scale-110"
                    />
                    {!collapsed && <span>{label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
