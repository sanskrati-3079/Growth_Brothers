import React from "react";

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg ring-1 ring-primary/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary-dark">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm hover:bg-primary/10"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
        <div className="mt-6 text-right">
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}
