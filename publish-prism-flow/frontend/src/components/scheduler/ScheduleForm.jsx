import React, { useState } from "react";
import { apiPost } from "../../api/client";

export default function ScheduleForm({ onSchedule }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [time, setTime] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dates = [];
  for (let i = 0; i < firstDay; i++) dates.push(null);
  for (let i = 1; i <= daysInMonth; i++) dates.push(i);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedDate) return setError("Please select a date");
    if (!time) return setError("Please select a time");

    const localIso = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}T${time}`;
    const utcIso = new Date(localIso).toISOString();

    setSubmitting(true);
    try {
      const data = await apiPost("/scheduler/slot", {
        platform,
        when: utcIso,
        title: title || `Scheduled ${platform} slot`,
      });

      onSchedule?.({ when: utcIso, platform, title, jobId: data.job_id });
      setSuccess(`Scheduled for ${new Date(utcIso).toLocaleString()}`);
      setTitle("");
    } catch (err) {
      setError(err.message || "Failed to schedule");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="card">
      <p className="card-title">Schedule Post</p>

      <div className="mt-4">
        <p className="font-medium text-primary-dark mb-2">
          {today.toLocaleString("default", { month: "long", year: "numeric" })}
        </p>

        <div className="grid grid-cols-7 text-center text-slate-600 text-sm mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="font-medium">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {dates.map((d, i) => {
            if (!d) return <div key={i} className="p-2 rounded-lg" />;
            const isSelected = selectedDate === d;
            const isToday = d === today.getDate();
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`p-2 rounded-lg text-sm transition
                  ${isSelected
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"}
                  ${isToday && !isSelected ? "ring-2 ring-primary/40" : ""}
                `}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-slate-500">Title (optional)</label>
        <input
          className="input mt-1"
          placeholder="What's this about?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          type="time"
          className="input"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <select
          className="input"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
          <option value="twitter">X / Twitter</option>
          <option value="linkedin">LinkedIn</option>
        </select>
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-600">{success}</p>}

      <button className="btn-primary w-full mt-4 disabled:opacity-60" disabled={submitting}>
        {submitting ? "Scheduling..." : "Add to Schedule"}
      </button>
    </form>
  );
}
