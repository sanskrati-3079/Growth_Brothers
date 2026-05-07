import React, { useCallback, useEffect, useMemo, useState } from "react";
import ScheduleForm from "../components/scheduler/ScheduleForm";
import CalendarView from "../components/scheduler/CalendarView";
import { apiGet } from "../api/client";

export default function Scheduler() {
  const [serverItems, setServerItems] = useState([]);
  const [localItems, setLocalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/posts");
      const list = Array.isArray(data) ? data : Object.values(data || {});
      setServerItems(
        list.map((j) => ({
          id: j.job_id,
          title: j.title || "Scheduled post",
          time: j.post_data?.scheduled_at || j.created_at,
          platform: j.platform,
          status: j.status,
        }))
      );
    } catch (err) {
      setError(err.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSchedule = (entry) => {
    // The form already persisted via /scheduler/slot — just refresh.
    if (entry?.jobId) {
      load();
      return;
    }
    setLocalItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: entry.title || "New Post (local)", time: entry.when, platform: entry.platform, status: "draft" },
    ]);
  };

  const allItems = useMemo(() => {
    return [...serverItems, ...localItems].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [serverItems, localItems]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-primary/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-primary-dark">Scheduler</h1>
            <p className="text-sm text-slate-600">Plan your content across platforms.</p>
          </div>
          <button onClick={load} className="btn btn-secondary">Refresh</button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ScheduleForm onSchedule={onSchedule} />
        <CalendarView items={loading ? [] : allItems} />
      </div>
    </div>
  );
}
