import React, { useState } from "react";
import { useAI } from "../../hooks/useAI";

export default function TextPostGenerator({ platform = "linkedin", onGenerate }) {
  const [text, setText] = useState("");
  const { loading, error, generateCaption } = useAI();

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const post = await generateCaption(text.trim(), platform);
    onGenerate?.(post);
  };

  return (
    <form onSubmit={submit} className="card">
      <p className="card-title">Reel → {platform} Post</p>
      <textarea
        className="input mt-3 h-32"
        placeholder="Paste transcript or topic..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="btn btn-secondary mt-3" disabled={loading || !text.trim()}>
        {loading ? "Generating..." : "Generate"}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </form>
  );
}
