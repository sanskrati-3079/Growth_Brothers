import React, { useState } from "react";
import { useAI } from "../../hooks/useAI";

export default function HashtagGenerator({ onGenerate }) {
  const [keywords, setKeywords] = useState("");
  const [count, setCount] = useState(12);
  const { loading, error, generateHashtags } = useAI();

  const submit = async (e) => {
    e.preventDefault();
    if (!keywords.trim()) return;
    const tags = await generateHashtags(keywords.trim(), count);
    onGenerate?.(tags);
  };

  return (
    <form onSubmit={submit} className="card">
      <p className="card-title">AI Hashtag Generator</p>
      <input
        className="input mt-3"
        placeholder="Comma-separated keywords"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
      />
      <input
        type="number"
        min={3}
        max={30}
        className="input mt-3"
        value={count}
        onChange={(e) => setCount(Number(e.target.value) || 12)}
      />
      <button className="btn btn-primary mt-3" disabled={loading || !keywords.trim()}>
        {loading ? "Generating..." : "Generate"}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </form>
  );
}
