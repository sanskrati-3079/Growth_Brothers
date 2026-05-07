import React from "react";

const TYPE_STYLES = {
  hook:    "bg-rose-50 text-rose-700 ring-rose-200",
  insight: "bg-sky-50 text-sky-700 ring-sky-200",
  quote:   "bg-violet-50 text-violet-700 ring-violet-200",
  tip:     "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cta:     "bg-amber-50 text-amber-700 ring-amber-200",
};

/**
 * Renders carousel slides. Accepts either:
 *   - array of strings (legacy)
 *   - array of { slide_number, headline, body, type } (new)
 */
export default function CarouselPreview({ slides = [], loading = false, error = "" }) {
  const empty = !slides || slides.length === 0;

  return (
    <div className="card">
      <p className="card-title">Carousel Preview</p>
      {loading && <p className="mt-3 text-sm text-slate-500">Generating slides...</p>}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {empty && !loading ? (
        <p className="mt-3 text-sm text-slate-500">Generate a carousel to see slides here.</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((s, i) => {
            const isObj = typeof s === "object" && s !== null;
            const headline = isObj ? s.headline : s;
            const body = isObj ? s.body : "";
            const type = isObj ? (s.type || "insight") : "insight";
            const number = isObj ? s.slide_number : i + 1;
            return (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-2xl border bg-white p-4 ring-1 ring-secondary/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Slide {number}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${TYPE_STYLES[type] || TYPE_STYLES.insight}`}>
                    {type}
                  </span>
                </div>
                <p className="text-base font-semibold text-primary-dark">{headline}</p>
                {body && <p className="text-sm text-slate-600">{body}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
