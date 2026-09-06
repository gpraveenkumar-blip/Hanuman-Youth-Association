import { Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";

const links = ["Home","About","Activities","Events","Gallery","Videos","Contact"];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const go = (id: string) => { setOpen(false); document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: "smooth" }); };
  return (
    <>
      <nav className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 md:px-12 lg:px-16">
        <button onClick={() => go("home")} className="group text-left text-white" aria-label="HYA Jaklair home">
          <div className="font-display text-lg font-bold tracking-tight">HANUMAN YOUTH</div>
          <div className="text-[10px] font-medium uppercase tracking-[.38em] text-white/55">Jaklair</div>
        </button>
        <div className="hidden items-center gap-7 lg:flex">
          {links.map((l) => <button key={l} onClick={() => go(l)} className="text-sm text-white/70 transition hover:text-white">{l}</button>)}
          <button onClick={() => go("contact")} className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition hover:scale-105">Join Us</button>
        </div>
        <button onClick={() => setOpen(v => !v)} className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/20 text-white lg:hidden" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </nav>
      <div className={`fixed inset-0 z-30 bg-black/95 backdrop-blur-xl transition-all duration-500 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="flex h-full flex-col justify-center px-8">
          {links.map((l, i) => <button key={l} onClick={() => go(l)} className={`py-2 text-left font-display text-4xl font-semibold text-white/90 transition hover:text-amber-300 ${open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`} style={{transitionDelay: `${80+i*45}ms`}}>{l}</button>)}
          <button onClick={() => go("contact")} className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white px-8 py-3.5 font-semibold text-black">Join the movement <ArrowRight size={16}/></button>
        </div>
      </div>
    </>
  );
}
