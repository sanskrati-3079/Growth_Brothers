import React from "react";

const isImageSrc = (src, type) =>
  type?.startsWith?.("image/") ||
  /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(src || "");

export default function MediaPreview({ src, title = "Preview", meta, onRemove, type }) {
  if (!src) return null;
  const showImage = isImageSrc(src, type);

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary-dark">{title}</p>
          {meta && <p className="text-xs text-slate-500">{meta}</p>}
        </div>
        {onRemove && (
          <button className="text-xs font-medium text-red-600 hover:text-red-700" onClick={onRemove} type="button">
            Remove
          </button>
        )}
      </div>

      {showImage ? (
        <img
          src={src}
          alt={title}
          className="mt-3 max-h-[480px] w-full rounded-xl object-contain ring-1 ring-primary/20"
        />
      ) : (
        <video src={src} controls className="mt-3 w-full rounded-xl ring-1 ring-primary/20" />
      )}
    </div>
  );
}
