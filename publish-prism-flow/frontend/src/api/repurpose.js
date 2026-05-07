import { API_BASE_URL, apiGet, apiPost } from "./client";

export function repurposeYoutube({ url, generateClips = true }) {
  const fd = new FormData();
  fd.append("url", url);
  fd.append("generate_clips", String(generateClips));
  return apiPost("/repurpose/youtube", fd);
}

export function repurposeUpload({ file, generateClips = true }) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("generate_clips", String(generateClips));
  return apiPost("/repurpose/upload", fd);
}

export const listRepurposeJobs = () => apiGet("/repurpose/jobs");
export const getRepurposeJob = (jobId) => apiGet(`/repurpose/jobs/${jobId}`);
export const getRepurposeTranscript = (jobId) =>
  fetch(`${API_BASE_URL}/repurpose/jobs/${jobId}/transcript`).then((r) => r.text());

export const downloadUrl = {
  clip: (jobId, n) => `${API_BASE_URL}/repurpose/jobs/${jobId}/clip/${n}`,
  snippet: (jobId, n) => `${API_BASE_URL}/repurpose/jobs/${jobId}/snippet/${n}`,
  blog: (jobId) => `${API_BASE_URL}/repurpose/jobs/${jobId}/blog`,
  newsletter: (jobId) => `${API_BASE_URL}/repurpose/jobs/${jobId}/newsletter`,
  carousel: (jobId) => `${API_BASE_URL}/repurpose/jobs/${jobId}/carousel`,
  transcript: (jobId) => `${API_BASE_URL}/repurpose/jobs/${jobId}/transcript`,
};
