import React, { useEffect, useState } from "react";

export default function AutoReplies({
  initialMessage = "Thanks for your comment!",
  onSave,
  loading = false,
  saving = false,
}) {
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    setMessage(initialMessage || "");
  }, [initialMessage]);

  const handleSave = () => {
    if (!onSave) return;
    onSave(message);
  };

  return (
    <div className="card">
      <p className="card-title">Auto Replies</p>
      <textarea
        className="input mt-3 h-28"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={loading || saving}
      />
      <button
        onClick={handleSave}
        className="btn btn-secondary mt-3"
        disabled={loading || saving}
      >
        {saving ? "Saving..." : "Save Template"}
      </button>
    </div>
  );
}
