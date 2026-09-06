import { ReactNode } from "react";
import { motion } from "framer-motion";

export default function Section({ id, eyebrow, title, children, className="" }: {id:string; eyebrow:string; title:string; children:ReactNode; className?:string}) {
  return (
    <section id={id} className={`relative overflow-hidden px-6 py-24 md:px-12 lg:px-16 lg:py-32 ${className}`}>
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-80px"}} transition={{duration:.7}}>
          <div className="mb-4 text-xs font-semibold uppercase tracking-[.32em] text-amber-400">{eyebrow}</div>
          <h2 className="max-w-4xl font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">{title}</h2>
        </motion.div>
        {children}
      </div>
    </section>
  );
}
