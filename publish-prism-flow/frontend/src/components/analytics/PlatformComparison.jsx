import React from "react";

export default function PlatformComparison({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-slate-500">No analytics data available</p>
      </div>
    );
  }


  const entries = Object.entries(data);

  // Total value
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  // Pie chart size
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  // Colors from your theme
  const colors = [
    "var(--tw-color-primary)",
    "var(--tw-color-secondary)",
    "#10B981", // emerald
    "#F59E0B", // amber
    "#EC4899", // pink
  ];

  // Prepare segments for pie chart
  let offset = 0;
  const segments = entries.map(([platform, value], i) => {
    const percentage = value / total;
    const strokeLength = percentage * circumference;
    const strokeDasharray = `${strokeLength} ${circumference}`;

    const segment = {
      platform,
      value,
      percentage: (percentage * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset: offset,
      color: colors[i % colors.length],
    };

    offset -= strokeLength;
    return segment;
  });

  return (
    <div className="card">
      <h2 className="card-title">Platform Distribution</h2>
      <p className="text-sm text-slate-600">Pie chart comparison</p>

      <div className="mt-5 flex flex-col items-center lg:flex-row lg:items-start lg:gap-10">

        {/* PIE CHART */}
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth="18"
          />
          {segments.map((s, i) => (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={s.strokeDasharray}
              strokeDashoffset={s.strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
          ))}
        </svg>

        {/* LEGEND */}
        <div className="mt-6 lg:mt-0 space-y-3 text-sm">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: s.color }}
              ></div>
              <div>
                <p className="font-medium capitalize">{s.platform}</p>
                <p className="text-slate-500">
                  {s.value} • {s.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
