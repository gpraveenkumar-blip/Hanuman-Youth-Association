import { X } from "lucide-react";
import type { Media } from "../types";

export default function Lightbox({
  item,
  onClose,
}: {
  item: Media;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/95 p-4 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-5 top-5 z-20 grid h-11 w-11 place-items-center rounded-full bg-white text-black"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={20} />
      </button>

      <div
        className="relative flex max-h-[92vh] max-w-6xl flex-col overflow-hidden rounded-3xl bg-[#101010]"
        onClick={(event) => event.stopPropagation()}
      >
        {item.type === "video" ? (
          <video
            src={item.url}
            controls
            autoPlay
            muted={false}
            playsInline
            preload="metadata"
            className="max-h-[78vh] w-auto max-w-full bg-black object-contain"
          >
            Your browser does not support video playback.
          </video>
        ) : (
          <img
            src={item.url}
            alt={item.title}
            className="max-h-[78vh] w-auto max-w-full object-contain"
          />
        )}

        <div className="bg-[#101010] p-5">
          <div className="text-xs uppercase tracking-[.25em] text-amber-400">
            {item.category}
          </div>

          <h3 className="mt-1 font-display text-2xl text-white">
            {item.title}
          </h3>

          {item.caption && (
            <p className="mt-2 text-sm text-white/50">
              {item.caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}