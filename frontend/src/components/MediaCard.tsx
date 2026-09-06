import { Play } from "lucide-react";
import type { Media } from "../types";

export default function MediaCard({ item, onOpen }: { item: Media; onOpen: (m:Media)=>void }) {
  return (
    <button onClick={() => onOpen(item)} className="group relative overflow-hidden rounded-[1.6rem] bg-white/[.04] text-left">
      <img src={item.thumbnailUrl || item.url} alt={item.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 to-transparent opacity-90" />
      {item.type === "video" && <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white text-black"><Play size={15} fill="currentColor"/></span>}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[.25em] text-amber-300">{item.category}</div>
        <div className="font-display text-xl font-semibold text-white">{item.title}</div>
        {item.caption && <div className="mt-1 line-clamp-2 text-sm text-white/60">{item.caption}</div>}
      </div>
    </button>
  );
}
