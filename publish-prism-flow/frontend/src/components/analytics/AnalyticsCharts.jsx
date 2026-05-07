import React from "react";

export default function AnalyticsCharts({ data = { views: [], likes: [] }, loading = false }) {
  const views = data?.views ?? [];
  const likes = data?.likes ?? [];

  const maxViews = Math.max(...views, 1);
  const maxLikes = Math.max(...likes, 1);

  const chartWidth = 240;
  const chartHeight = 150;

  const isEmpty = !views.length && !likes.length;

  return (
    <div className="card">
      <p className="card-title mb-4">Analytics Overview</p>

      {loading ? (
        <p className="text-sm text-slate-500">Loading latest analytics...</p>
      ) : isEmpty ? (
        <p className="text-sm text-slate-500">No analytics available for the selected range.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="font-medium text-primary-dark mb-2">Views</p>

            <svg
              width="100%"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full border border-slate-200 rounded-xl bg-white"
            >
              {[1, 2, 3, 4].map((n) => (
                <line
                  key={n}
                  x1="0"
                  y1={(chartHeight / 5) * n}
                  x2={chartWidth}
                  y2={(chartHeight / 5) * n}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              ))}

              {views.map((v, i) => {
                const barWidth = chartWidth / views.length - 10;
                const barHeight = (v / maxViews) * (chartHeight - 30);
                const x = i * (chartWidth / views.length) + 5;
                const y = chartHeight - barHeight - 10;

                return (
                  <g key={i}>
                    <rect x={x} y={y} width={barWidth} height={barHeight} fill="#6C63FF" rx="3" />
                    <text x={x + barWidth / 2} y={chartHeight - 2} fontSize="8" fill="#64748B" textAnchor="middle">
                      {v}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div>
            <p className="font-medium text-secondary-dark mb-2">Engagements</p>

            <svg
              width="100%"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full border border-slate-200 rounded-xl bg-white"
            >
              {[1, 2, 3, 4].map((n) => (
                <line
                  key={n}
                  x1="0"
                  y1={(chartHeight / 5) * n}
                  x2={chartWidth}
                  y2={(chartHeight / 5) * n}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              ))}

              <polyline
                fill="none"
                stroke="#4F8BFF"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={likes
                  .map((like, index) => {
                    const x = (index / (likes.length - 1 || 1)) * (chartWidth - 20) + 10;
                    const y = chartHeight - (like / maxLikes) * (chartHeight - 30) - 10;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />

              {likes.map((like, index) => {
                const x = (index / (likes.length - 1 || 1)) * (chartWidth - 20) + 10;
                const y = chartHeight - (like / maxLikes) * (chartHeight - 30) - 10;

                return <circle key={index} cx={x} cy={y} r="4" fill="#6C63FF" stroke="#fff" strokeWidth="2" />;
              })}
            </svg>

            <div className="mt-2 flex justify-between text-[10px] text-slate-600">
              {likes.map((v, i) => (
                <span key={i}>{v}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
