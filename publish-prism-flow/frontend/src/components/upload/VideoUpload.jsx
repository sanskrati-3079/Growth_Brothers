import React, { useRef } from "react";

export default function VideoUpload({ onSelect }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onSelect) onSelect(file);
  };

  return (
    <div className="card text-center">
      <p className="text-sm text-slate-600">Drop a video here or</p>
      <button
        onClick={() => inputRef.current?.click()}
        className="btn btn-primary mt-3"
      >
        Choose File
      </button>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="video/*"
        onChange={handleChange}
      />
    </div>
  );
}
