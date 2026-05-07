import React, { useState } from "react";
import AutoReplies from "../components/engagement/AutoReplies";
import CommentCategorizer from "../components/engagement/CommentCategorizer";
import { useEngagement } from "../hooks/useEngagement";

export default function Engagement() {
  const { comments, template, loading, error, saveTemplate } = useEngagement();
  const [saving, setSaving] = useState(false);

  const handleSave = async (message) => {
    try {
      setSaving(true);
      await saveTemplate(message);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-primary/10">
        <h1 className="text-xl font-semibold text-primary-dark">Engagement</h1>
        <p className="text-sm text-slate-600">Manage comments and auto-replies.</p>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AutoReplies
          initialMessage={template}
          onSave={handleSave}
          loading={loading}
          saving={saving}
        />
        <CommentCategorizer comments={comments} loading={loading} />
      </div>
    </div>
  );
}
