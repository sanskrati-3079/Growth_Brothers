import { useCallback, useRef, useState } from "react";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

/**
 * Real upload hook backed by the `/posts/upload` endpoint.
 * Uses XHR so we get true progress events.
 *
 * @returns {object}
 *   progress: 0..100
 *   status: 'idle' | 'uploading' | 'done' | 'error'
 *   error: string
 *   jobId: string | null   – returned by backend on success
 *   upload(file, options)  – options: { platform, accountId, title, description, tags, scheduledAt, isShort, privacy }
 *   cancel()
 *   reset()
 */
export function useUploader() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState(null);
  const xhrRef = useRef(null);

  const reset = useCallback(() => {
    setProgress(0);
    setStatus("idle");
    setError("");
    setJobId(null);
  }, []);

  const cancel = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    reset();
  }, [reset]);

  const upload = useCallback((file, options = {}) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        const err = new Error("No file provided");
        setError(err.message);
        setStatus("error");
        reject(err);
        return;
      }

      const fd = new FormData();
      fd.append("platform", options.platform || "youtube");
      if (options.accountId) fd.append("account_id", options.accountId);
      fd.append("title", options.title || file.name);
      fd.append("description", options.description || "");
      fd.append("message", options.message || "");
      fd.append("tags", options.tags || "");
      fd.append("privacy", options.privacy || "private");
      fd.append("is_short", options.isShort ? "true" : "false");
      if (options.scheduledAt) fd.append("scheduled_at", options.scheduledAt);
      fd.append("timezone", options.timezone || "Asia/Kolkata");
      fd.append("notify", options.notify ? "true" : "false");

      // Field name depends on file kind
      const isImage = file.type?.startsWith("image/");
      fd.append(isImage ? "image" : "video", file, file.name);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("POST", `${API}/posts/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        xhrRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          let data = {};
          try {
            data = JSON.parse(xhr.responseText);
          } catch (_) {
            // ignore — backend may have returned text
          }
          setJobId(data.job_id || null);
          setStatus("done");
          setProgress(100);
          resolve(data);
        } else {
          const message = xhr.responseText || `Upload failed (${xhr.status})`;
          setError(message);
          setStatus("error");
          reject(new Error(message));
        }
      };

      xhr.onerror = () => {
        xhrRef.current = null;
        setError("Network error during upload");
        setStatus("error");
        reject(new Error("Network error during upload"));
      };

      xhr.onabort = () => {
        xhrRef.current = null;
        setError("Upload cancelled");
        setStatus("idle");
      };

      setStatus("uploading");
      setProgress(0);
      setError("");
      xhr.send(fd);
    });
  }, [reset]);

  return { progress, status, error, jobId, upload, cancel, reset };
}

export default useUploader;
