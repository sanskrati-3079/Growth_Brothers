import React from "react";

export default function UploadStatus({ status = "Idle", progress = 0 }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Status: <span className="font-medium text-secondary">{status}</span></p>
        <p className="text-xs text-slate-500">{progress}%</p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
