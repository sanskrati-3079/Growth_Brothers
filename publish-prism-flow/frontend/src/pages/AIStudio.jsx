import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CaptionGenerator from "../components/ai/CaptionGenerator";
import HashtagGenerator from "../components/ai/HashtagGenerator";
import TextPostGenerator from "../components/ai/TextPostGenerator";
import CarouselPreview from "../components/ai/CarouselPreview";
import MediaPreview from "../components/upload/MediaPreview";
import { useUploadContext } from "../context/UploadContext";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const AI_CONTENT_AGENT_BASE_URL = (
  import.meta.env.VITE_AI_CONTENT_AGENT_URL || API_BASE_URL
).replace(/\/$/, "");
const API_ROUTES = {
  motivational: "/api/v1/generate/motivational_post",
  blog: "/api/v1/generate/blog_post",
  carousel: "/api/v1/generate/carousel",
};

const resolveAssetUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${AI_CONTENT_AGENT_BASE_URL}/${normalized}`;
};

const buildPlatformCopies = (quote, topic) => {
  if (!quote) {
    return { instagram: "", linkedin: "", facebook: "" };
  }
  const topicTag = topic.replace(/\s+/g, "").slice(0, 32) || "Momentum";
  return {
    instagram: `${quote}\n#${topicTag}`,
    linkedin: `${quote} — Reflecting on ${topic}.`,
    facebook: `${quote}\nKeep the ${topic.toLowerCase()} energy going!`,
  };
};

const parseApiError = async (response, label) => {
  let detail = "";
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") {
      detail = data.detail;
    } else if (data?.detail) {
      detail = JSON.stringify(data.detail);
    }
  } catch (_) {
    try {
      detail = await response.text();
    } catch (__) {
      detail = "";
    }
  }
  const message = detail ? `${label}: ${detail}` : `${label} returned status ${response.status}`;
  return new Error(message);
};

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "facebook", label: "Facebook" },
];

export default function AIStudio() {
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [post, setPost] = useState("");
  const [ideaPrompt, setIdeaPrompt] = useState("");
  const [aiNarratives, setAiNarratives] = useState({
    blog: "",
    instagram: "",
    linkedin: "",
    facebook: "",
  });
  const [aiAssets, setAiAssets] = useState({
    quoteImage: "",
    blogDoc: "",
    blogCover: "",
  });
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [narrativeError, setNarrativeError] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const [isPostingPlatform, setIsPostingPlatform] = useState("");
  const [slides, setSlides] = useState([]);
  const [carouselLoading, setCarouselLoading] = useState(false);
  const [carouselError, setCarouselError] = useState("");
  const { media, clearMedia } = useUploadContext();

  const mediaMeta = useMemo(() => {
    if (!media) return undefined;
    return `${media.name} • ${(media.size / (1024 * 1024)).toFixed(2)} MB`;
  }, [media]);

  const hydrateFallbackNarratives = (keyword) => {
    setAiNarratives({
      blog: `Here is a quick blog opening for ${keyword}. Outline the core idea, expand with supporting evidence, and wrap with an actionable takeaway so it is ready for publishing once the real AI endpoint is wired in.`,
      instagram: `${keyword}: Believe in your daily reps. Small moves, big waves. #Momentum`,
      linkedin: `Leaning into ${keyword} today. Progress happens when we stay consistent, stay curious, and keep sharing the journey.`,
      facebook: `Reminder: ${keyword} is not a finish line but a mindset. Celebrate tiny wins and invite your community along.`,
    });
    setAiAssets({ quoteImage: "", blogDoc: "", blogCover: "" });
    setShareFeedback("");
  };

  const handleNarrativeGeneration = async () => {
    if (!ideaPrompt.trim()) {
      setNarrativeError("Share a keyword or hook before generating content.");
      return;
    }
    setNarrativeError("");
    setIsGeneratingNarrative(true);

    setShareFeedback("");
    const topic = ideaPrompt.trim();
    try {

      if (!AI_CONTENT_AGENT_BASE_URL) {
        hydrateFallbackNarratives(topic);
        return;
      }

      const buildRequest = () => ({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      setCarouselLoading(true);
      setCarouselError("");
      const carouselRequest = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count: 6 }),
      };

      const [motivationalRes, blogRes, carouselRes] = await Promise.all([
        fetch(`${AI_CONTENT_AGENT_BASE_URL}${API_ROUTES.motivational}`, buildRequest()),
        fetch(`${AI_CONTENT_AGENT_BASE_URL}${API_ROUTES.blog}`, buildRequest()),
        fetch(`${AI_CONTENT_AGENT_BASE_URL}${API_ROUTES.carousel}`, carouselRequest),
      ]);

      if (!motivationalRes.ok) {
        throw await parseApiError(motivationalRes, "Motivational post service");
      }
      if (!blogRes.ok) {
        throw await parseApiError(blogRes, "Blog generation service");
      }

      const motivationalData = await motivationalRes.json();
      const blogData = await blogRes.json();

      if (carouselRes.ok) {
        const carouselData = await carouselRes.json();
        setSlides(carouselData.slides || []);
      } else {
        setCarouselError("Carousel generation skipped");
      }
      setCarouselLoading(false);

      const quoteText = motivationalData.quote_text;
      const quoteImagePath = motivationalData.image_url || motivationalData.image_path;
      const blogDocPath = blogData.docx_url || blogData.docx_path;
      const blogCoverPath = blogData.cover_url || blogData.cover_path;
      const snippets = buildPlatformCopies(quoteText, topic);

      setAiNarratives({
        blog: blogDocPath
          ? `Blog ready for ${blogData.topic || topic}. Use the download link below to review the draft.`
          : `Blog draft queued for ${blogData.topic || topic}.`,
        ...snippets,
      });

      setAiAssets({
        quoteImage: resolveAssetUrl(quoteImagePath),
        blogDoc: resolveAssetUrl(blogDocPath),
        blogCover: resolveAssetUrl(blogCoverPath),
      });
    } catch (error) {
      setNarrativeError(error.message || "Unable to generate copy right now.");
      hydrateFallbackNarratives(topic);
    } finally {
      setIsGeneratingNarrative(false);
      setCarouselLoading(false);
    }
  };

  const handleShare = async (platform) => {
    const copy = aiNarratives[platform];
    if (!copy) return;
    setShareFeedback("");
    setIsPostingPlatform(platform);

    try {
      const response = await fetch(`${API_BASE_URL}/publishing/motivation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          content: copy,
          topic: ideaPrompt.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to post content");
      }

      setShareFeedback(`Posted to ${platform}. Check the automation webhook logs for confirmation.`);
    } catch (error) {
      console.error("Share error", error);
      setShareFeedback(`Unable to post to ${platform}. ${error.message || "Please try again."}`);
    } finally {
      setIsPostingPlatform("");
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-primary/10">
        <h1 className="text-xl font-semibold text-primary-dark">AI Studio</h1>
        <p className="text-sm text-slate-600">Generate captions, hashtags, carousels and posts.</p>
      </header>

      <div className="card space-y-4">
        <div>
          <p className="card-title">Motivational Blog Generator</p>
          <p className="text-sm text-slate-600">
            Drop a keyword or single-line hook and we will craft a blog intro plus platform-ready motivation.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="ex: Morning accountability for creators"
            value={ideaPrompt}
            onChange={(event) => setIdeaPrompt(event.target.value)}
          />
          <button
            type="button"
            onClick={handleNarrativeGeneration}
            disabled={isGeneratingNarrative}
            className="rounded-2xl bg-gradient-to-r from-primary-dark to-secondary px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingNarrative ? "Thinking..." : "Generate story"}
          </button>
        </div>
        {narrativeError && (
          <p className="text-sm text-red-600">{narrativeError}</p>
        )}
        {!AI_CONTENT_AGENT_BASE_URL && (
          <p className="text-xs text-amber-600">
            No AI content endpoint configured yet. Set VITE_AI_CONTENT_AGENT_URL once the AI engineer shares the base URL.
          </p>
        )}
      </div>

      {media ? (
        <MediaPreview
          src={media.url}
          title="Selected media"
          meta={mediaMeta}
          onRemove={clearMedia}
        />
      ) : (
        <div className="card">
          <p className="text-sm text-slate-600">
            No media selected. Upload content on the <Link className="text-secondary" to="/upload">Upload page</Link> to bring it here automatically.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CaptionGenerator onGenerate={setCaption} />
        <HashtagGenerator onGenerate={setTags} />
        <TextPostGenerator platform="linkedin" onGenerate={setPost} />
        <CarouselPreview slides={slides} loading={carouselLoading} error={carouselError} />

        <div className="card lg:col-span-2">
          <p className="card-title">Outputs</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
            <pre className="rounded-xl border p-3 ring-1 ring-primary/10">{caption || "No caption yet"}</pre>
            <pre className="rounded-xl border p-3 ring-1 ring-primary/10">{tags || "No hashtags yet"}</pre>
            <pre className="rounded-xl border p-3 ring-1 ring-primary/10">{post || "No post yet"}</pre>
          </div>
        </div>
      </div>

      <div className="card space-y-6">
        <div>
          <p className="card-title">Blog + Motivational Posts</p>
          <p className="text-sm text-slate-600">Preview the long-form blog concept and platform-tailored motivational snippets.</p>
        </div>
        <article className="rounded-2xl border border-dashed border-primary/30 bg-slate-50/50 p-4 text-sm text-slate-700">
          {aiNarratives.blog || "Generate a story above to preview the blog copy."}
        </article>
        {aiAssets.blogDoc && (
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href={aiAssets.blogDoc}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-primary/30 px-4 py-2 font-semibold text-primary-dark hover:bg-primary/5"
            >
              Download blog draft (.docx)
            </a>
            {aiAssets.blogCover && (
              <a
                href={aiAssets.blogCover}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-secondary/30 px-4 py-2 font-semibold text-secondary hover:bg-secondary/5"
              >
                View cover art
              </a>
            )}
          </div>
        )}
        {aiAssets.quoteImage && (
          <div className="rounded-2xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Quote artwork</p>
            <img src={aiAssets.quoteImage} alt="Motivational quote" className="mt-2 w-full rounded-xl object-cover" />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform.key} className="flex flex-col rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm font-semibold text-primary-dark">
                <span>{platform.label}</span>
                <span className="text-xs uppercase tracking-wide text-slate-400">Motivation</span>
              </div>
              <p className="mt-3 flex-1 whitespace-pre-wrap text-sm text-slate-600">
                {aiNarratives[platform.key] || "Run the generator to craft this post."}
              </p>
              <button
                type="button"
                onClick={() => handleShare(platform.key)}
                disabled={!aiNarratives[platform.key] || isPostingPlatform === platform.key}
                className="mt-4 rounded-xl border border-primary/20 px-3 py-2 text-xs font-semibold text-primary-dark transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPostingPlatform === platform.key ? "Posting..." : `Post to ${platform.label}`}
              </button>
            </div>
          ))}
        </div>
        {shareFeedback && (
          <p className="text-xs text-primary-dark">{shareFeedback}</p>
        )}
      </div>
    </div>
  );
}
