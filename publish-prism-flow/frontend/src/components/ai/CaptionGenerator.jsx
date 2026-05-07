import React, { useState } from "react";
import { useAI } from "../../hooks/useAI";

export default function CaptionGenerator({ onGenerate, defaultPlatform = "instagram" }) {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState(defaultPlatform);
  const { loading, error, generateCaption } = useAI();

  const submit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    const caption = await generateCaption(topic.trim(), platform);
    onGenerate?.(caption);
  };

  return (
    <form onSubmit={submit} className="card">
      <p className="card-title">AI Caption Generator</p>
      <input
        className="input mt-3"
        placeholder="Topic or transcript snippet"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <select
        className="input mt-3"
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
      >
        <option value="instagram">Instagram</option>
        <option value="linkedin">LinkedIn</option>
        <option value="facebook">Facebook</option>
        <option value="twitter">X / Twitter</option>
      </select>
      <button className="btn btn-primary mt-3" disabled={loading || !topic.trim()}>
        {loading ? "Generating..." : "Generate"}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </form>
  );
}
