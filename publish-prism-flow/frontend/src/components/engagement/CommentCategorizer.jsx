import React, { useMemo } from "react";

const CATEGORY_STYLES = {
  praise:   "bg-emerald-50 text-emerald-700 ring-emerald-200",
  question: "bg-sky-50 text-sky-700 ring-sky-200",
  feedback: "bg-amber-50 text-amber-700 ring-amber-200",
  spam:     "bg-rose-50 text-rose-700 ring-rose-200",
};

export default function CommentCategorizer({ comments = [], loading = false }) {
  const grouped = useMemo(() => {
    const out = {};
    for (const c of comments) {
      const key = c.category || "uncategorized";
      (out[key] ||= []).push(c);
    }
    return out;
  }, [comments]);

  return (
    <div className="card">
      <p className="card-title">Comment Categories</p>

      {loading ? (
        <p className="mt-3 text-sm text-slate-500">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No comments yet</p>
      ) : (
        <div className="mt-3 space-y-4">
          {Object.entries(grouped).map(([category, list]) => (
            <div key={category}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {category} <span className="text-slate-400">({list.length})</span>
              </p>
              <ul className="space-y-2 text-sm">
                {list.map((c) => (
                  <li key={c.id} className="rounded-xl border p-3 ring-1 ring-secondary/20">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-primary">{c.author || c.user || "anonymous"}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {c.platform && <span className="capitalize">{c.platform}</span>}
                        {c.createdAt && <span>{new Date(c.createdAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="mt-1 text-slate-700">{c.text}</div>
                    <div className="mt-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${CATEGORY_STYLES[category] || "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                        {category}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
