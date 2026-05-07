import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  downloadUrl,
  getRepurposeJob,
  listRepurposeJobs,
  repurposeUpload,
  repurposeYoutube,
} from "../api/repurpose";

const TABS = [
  { key: "youtube", label: "YouTube URL" },
  { key: "upload", label: "Upload Video / Audio" },
];

const formatTimestamp = (s) => {
  if (typeof s !== "number" || Number.isNaN(s)) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function Repurpose() {
  const [tab, setTab] = useState("youtube");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [generateClips, setGenerateClips] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");

  const [activeJobId, setActiveJobId] = useState("");
  const [activeJob, setActiveJob] = useState(null);
  const [activeJobLoading, setActiveJobLoading] = useState(false);
  const [activeJobError, setActiveJobError] = useState("");

  const refreshJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError("");
    try {
      const list = await listRepurposeJobs();
      setJobs(Array.isArray(list) ? list : []);
    } catch (e) {
      setJobsError(e.message || "Failed to load jobs");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  const loadJob = useCallback(async (jobId) => {
    if (!jobId) {
      setActiveJob(null);
      setActiveJobId("");
      return;
    }
    setActiveJobId(jobId);
    setActiveJobLoading(true);
    setActiveJobError("");
    try {
      const data = await getRepurposeJob(jobId);
      setActiveJob(data);
    } catch (e) {
      setActiveJobError(e.message || "Failed to load job");
      setActiveJob(null);
    } finally {
      setActiveJobLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");
      setResult(null);

      if (tab === "youtube" && !url.trim()) {
        setError("Enter a YouTube URL");
        return;
      }
      if (tab === "upload" && !file) {
        setError("Choose a video or audio file");
        return;
      }

      setSubmitting(true);
      try {
        const data =
          tab === "youtube"
            ? await repurposeYoutube({ url: url.trim(), generateClips })
            : await repurposeUpload({ file, generateClips });
        setResult(data);
        await refreshJobs();
        if (data?.job_id) {
          await loadJob(data.job_id);
        }
      } catch (e) {
        setError(e.message || "Repurpose request failed");
      } finally {
        setSubmitting(false);
      }
    },
    [tab, url, file, generateClips, refreshJobs, loadJob]
  );

  const analysis = activeJob?.analysis || (result ? extractAnalysisFromResult(result) : null);
  const headerJobId = activeJobId || result?.job_id || "";

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-primary/10">
        <h1 className="text-xl font-semibold text-primary-dark">Repurpose Studio</h1>
        <p className="text-sm text-slate-600">
          Drop a YouTube link or upload your own video/audio. We transcribe it, pull the
          best highlights, and generate a blog, newsletter, and carousel — all downloadable.
        </p>
      </header>

      <section className="card space-y-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                tab === t.key
                  ? "btn btn-primary"
                  : "btn btn-secondary"
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "youtube" ? (
            <div>
              <label className="text-xs font-medium text-slate-500">YouTube URL</label>
              <input
                className="input mt-1"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={submitting}
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-slate-500">Video / audio file</label>
              <input
                type="file"
                accept="video/*,audio/*"
                className="input mt-1"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={submitting}
              />
              {file && (
                <p className="mt-1 text-xs text-slate-500">
                  {file.name} • {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={generateClips}
              onChange={(e) => setGenerateClips(e.target.checked)}
              disabled={submitting}
            />
            Render highlight clips and audio snippets
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Processing…" : "Repurpose"}
            </button>
            {submitting && (
              <span className="text-xs text-slate-500">
                This can take a few minutes for long videos.
              </span>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <p className="card-title">Jobs</p>
          <button
            type="button"
            onClick={refreshJobs}
            className="btn btn-secondary text-xs"
            disabled={jobsLoading}
          >
            {jobsLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {jobsError && <p className="text-sm text-red-500">{jobsError}</p>}

        {jobs.length === 0 && !jobsLoading ? (
          <p className="text-sm text-slate-500">
            No jobs yet. Run a repurpose above to get started.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {jobs.map((j) => (
              <li
                key={j.job_id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm text-slate-700">{j.job_id}</p>
                  <p className="truncate text-xs text-slate-500">
                    {(j.files || []).slice(0, 4).join(", ")}
                    {(j.files || []).length > 4 ? " …" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadJob(j.job_id)}
                  className={
                    activeJobId === j.job_id
                      ? "btn btn-primary text-xs"
                      : "btn btn-secondary text-xs"
                  }
                >
                  {activeJobId === j.job_id ? "Selected" : "Open"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(headerJobId || activeJobLoading) && (
        <section className="card space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="card-title">Job {headerJobId}</p>
              {result?.status && (
                <span className="badge badge-success mt-1">{result.status}</span>
              )}
            </div>
            <DownloadButtons jobId={headerJobId} analysis={analysis} />
          </div>

          {activeJobError && <p className="text-sm text-red-500">{activeJobError}</p>}
          {activeJobLoading && <p className="text-sm text-slate-500">Loading job…</p>}

          {result && (
            <div className="grid gap-3 sm:grid-cols-3 text-xs text-slate-600">
              <Stat label="Clips" value={result.clips_generated ?? 0} />
              <Stat label="Audio snippets" value={result.audio_snippets_generated ?? 0} />
              <Stat
                label="Highlights"
                value={Array.isArray(result.highlights) ? result.highlights.length : 0}
              />
            </div>
          )}

          {analysis && (
            <>
              <Highlights
                jobId={headerJobId}
                highlights={analysis.highlights || []}
                hasClips={Boolean(result?.clips_generated)}
                hasSnippets={Boolean(result?.audio_snippets_generated)}
              />
              <BlogSection blog={analysis.blog_summary} />
              <NewsletterSection newsletter={analysis.newsletter} />
              <CarouselSection carousel={analysis.carousel} />
            </>
          )}

          {result?.transcript && (
            <details className="rounded-xl border border-slate-200 p-3 text-sm">
              <summary className="cursor-pointer font-semibold text-slate-700">
                Transcript preview
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-slate-600">{result.transcript}</p>
            </details>
          )}
        </section>
      )}
    </div>
  );
}

function extractAnalysisFromResult(result) {
  if (!result) return null;
  const { highlights, blog_summary, newsletter, carousel } = result;
  if (!highlights && !blog_summary && !newsletter && !carousel) return null;
  return { highlights, blog_summary, newsletter, carousel };
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-base font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function DownloadButtons({ jobId, analysis }) {
  if (!jobId) return null;
  const links = [
    analysis?.blog_summary && { label: "Blog .md", href: downloadUrl.blog(jobId) },
    analysis?.newsletter && { label: "Newsletter .txt", href: downloadUrl.newsletter(jobId) },
    analysis?.carousel && { label: "Carousel .md", href: downloadUrl.carousel(jobId) },
    { label: "Transcript", href: downloadUrl.transcript(jobId) },
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary text-xs"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

function Highlights({ jobId, highlights, hasClips, hasSnippets }) {
  if (!highlights || highlights.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="card-title">Highlights</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {highlights.map((h, idx) => {
          const n = idx + 1;
          return (
            <div
              key={`${h.title}-${idx}`}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-800">
                  {n}. {h.title}
                </p>
                <span className="text-xs text-slate-500">
                  {formatTimestamp(h.start)} → {formatTimestamp(h.end)}
                </span>
              </div>
              {h.quote && (
                <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic text-slate-600">
                  {h.quote}
                </blockquote>
              )}
              {h.hook && (
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-medium">Hook:</span> {h.hook}
                </p>
              )}
              {h.why && (
                <p className="mt-1 text-xs text-slate-500">Why: {h.why}</p>
              )}

              {jobId && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {hasClips && (
                    <a
                      href={downloadUrl.clip(jobId, n)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary text-xs"
                    >
                      Clip
                    </a>
                  )}
                  {hasSnippets && (
                    <a
                      href={downloadUrl.snippet(jobId, n)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary text-xs"
                    >
                      Audio
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlogSection({ blog }) {
  if (!blog) return null;
  return (
    <div className="space-y-2">
      <p className="card-title">Blog summary</p>
      <article className="rounded-2xl border border-dashed border-primary/30 bg-slate-50/50 p-4 text-sm text-slate-700">
        <h3 className="text-base font-semibold text-slate-900">{blog.title}</h3>
        {blog.intro && <p className="mt-2">{blog.intro}</p>}
        {Array.isArray(blog.sections) &&
          blog.sections.map((s, i) => (
            <div key={i} className="mt-3">
              <p className="font-semibold text-slate-800">{s.heading}</p>
              <p className="text-slate-600">{s.body}</p>
            </div>
          ))}
        {blog.conclusion && <p className="mt-3 italic">{blog.conclusion}</p>}
      </article>
    </div>
  );
}

function NewsletterSection({ newsletter }) {
  if (!newsletter) return null;
  const body = Array.isArray(newsletter.body)
    ? newsletter.body.join("\n\n")
    : newsletter.body;
  return (
    <div className="space-y-2">
      <p className="card-title">Newsletter</p>
      <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
        <p>
          <span className="text-xs uppercase tracking-wide text-slate-400">Subject</span>
          <br />
          <span className="font-semibold">{newsletter.subject_line}</span>
        </p>
        {newsletter.preview_text && (
          <p className="mt-2 text-xs text-slate-500">
            Preview: {newsletter.preview_text}
          </p>
        )}
        <p className="mt-3 whitespace-pre-wrap">{body}</p>
        {newsletter.cta && (
          <p className="mt-3 text-sm font-semibold text-primary-dark">{newsletter.cta}</p>
        )}
      </div>
    </div>
  );
}

function CarouselSection({ carousel }) {
  if (!carousel || carousel.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="card-title">Carousel</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {carousel.map((slide) => (
          <div
            key={slide.slide_number}
            className="rounded-2xl border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              <span>Slide {slide.slide_number}</span>
              <span>{slide.type}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-800">{slide.headline}</p>
            <p className="mt-1 text-sm text-slate-600">{slide.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
