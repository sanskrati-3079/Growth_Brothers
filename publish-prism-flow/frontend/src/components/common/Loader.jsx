import React from "react";

export default function Loader({ label = "Loading..." }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-secondary">
      <span className="h-2 w-2 animate-pulse rounded-full bg-primary"></span>
      <span>{label}</span>
    </div>
  );
}
