import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VideoUpload from "../components/upload/VideoUpload";
import MediaPreview from "../components/upload/MediaPreview";
import UploadStatus from "../components/upload/UploadStatus";
import { useUploadContext } from "../context/UploadContext";
import { useUploader } from "../hooks/useUploader";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export default function Upload() {
  const navigate = useNavigate();
  const { media, setMediaFile, clearMedia } = useUploadContext();
  const { progress, status, error, jobId, upload, cancel, reset } = useUploader();

  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isShort, setIsShort] = useState(false);

  // Load connected accounts so the user can pick where to publish
  useEffect(() => {
    fetch(`${API}/auth/accounts`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => Array.isArray(list) ? setAccounts(list) : setAccounts([]))
      .catch(() => setAccounts([]));
  }, []);

  const accountsForPlatform = useMemo(
    () => accounts.filter((a) => (a.platform || "").toLowerCase() === platform),
    [accounts, platform]
  );

  // Auto-pick first account when platform changes
  useEffect(() => {
    if (accountsForPlatform.length > 0) {
      setAccountId(accountsForPlatform[0].account_id);
    } else {
      setAccountId("");
    }
  }, [accountsForPlatform]);

  const onSelect = useCallback((file) => {
    setMediaFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    reset();
  }, [setMediaFile, title, reset]);

  const handleUpload = useCallback(async () => {
    if (!media?.file) return;
    if (!accountId) {
      alert(`Connect a ${platform} account first (Accounts page).`);
      return;
    }
    try {
      await upload(media.file, {
        platform,
        accountId,
        title: title || media.name,
        description,
        tags,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        isShort,
      });
    } catch (_) {
      // hook already set error state
    }
  }, [media, accountId, platform, title, description, tags, scheduledAt, isShort, upload]);

  const meta = media ? `${media.name} • ${(media.size / (1024 * 1024)).toFixed(2)} MB` : undefined;
  const friendlyStatus = {
    idle: "Idle",
    uploading: "Uploading",
    done: "Uploaded",
    error: "Error",
  }[status] || status;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-primary-dark">Upload</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary disabled:opacity-60"
            disabled={!media}
            onClick={() => navigate("/ai")}
          >
            Send to AI Studio
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/repurpose")}
          >
            Repurpose Studio
          </button>
        </div>
      </div>

      <VideoUpload onSelect={onSelect} />
      <MediaPreview src={media?.url} meta={meta} onRemove={clearMedia} />

      {!media && (
        <div className="text-sm text-slate-500">
          No upload yet. Need inspiration? <Link className="text-secondary" to="/ai">Open AI Studio</Link>.
        </div>
      )}

      {media && (
        <div className="card space-y-4">
          <p className="card-title">Publish to platform</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-500">Platform</label>
              <select
                className="input mt-1"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="youtube">YouTube</option>
                <option value="linkedin">LinkedIn</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Account</label>
              <select
                className="input mt-1"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={accountsForPlatform.length === 0}
              >
                {accountsForPlatform.length === 0 ? (
                  <option>No connected {platform} account</option>
                ) : (
                  accountsForPlatform.map((a) => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.account_name} ({a.account_id})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Title</label>
            <input
              className="input mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Description</label>
            <textarea
              className="input mt-1 h-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (or LinkedIn message)"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-500">Tags (comma separated)</label>
              <input
                className="input mt-1"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="growth, ai, creator"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Schedule for (optional)</label>
              <input
                type="datetime-local"
                className="input mt-1"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          </div>

          {platform === "youtube" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isShort}
                onChange={(e) => setIsShort(e.target.checked)}
              />
              Upload as YouTube Short
            </label>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleUpload}
              className="btn btn-primary"
              disabled={status === "uploading" || !accountId}
            >
              {status === "uploading"
                ? `Uploading ${progress}%`
                : scheduledAt
                  ? "Schedule"
                  : "Upload now"}
            </button>
            {status === "uploading" && (
              <button onClick={cancel} className="btn btn-secondary">Cancel</button>
            )}
            {jobId && (
              <span className="self-center text-xs text-emerald-600">
                Queued as {jobId}
              </span>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}

      <UploadStatus status={friendlyStatus} progress={progress} />
    </div>
  );
}
