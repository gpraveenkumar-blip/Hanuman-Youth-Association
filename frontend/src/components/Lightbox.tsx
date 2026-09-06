import { X, Play } from "lucide-react";
import type { Media } from "../types";

export default function Lightbox({ item, onClose }: {item:Media; onClose:()=>void}) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" onClick={onClose}>
      <button className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full bg-white text-black" onClick={onClose} aria-label="Close"><X/></button>
      <div className="max-h-[90vh] max-w-6xl overflow-hidden rounded-3xl" onClick={e=>e.stopPropagation()}>
        {item.type === "video" ? <video src={item.url} controls autoPlay className="max-h-[80vh] w-auto max-w-full"/> : <img src={item.url} alt={item.title} className="max-h-[82vh] w-auto max-w-full object-contain"/>}
        <div className="bg-[#101010] p-5">
          <div className="text-xs uppercase tracking-[.25em] text-amber-400">{item.category}</div>
          <h3 className="mt-1 font-display text-2xl text-white">{item.title}</h3>
        </div>
      </div>
    </div>
  );
}
