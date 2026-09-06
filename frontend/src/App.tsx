import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  Heart,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Youtube,
  Facebook,
  MessageCircle,
  Trophy,
  Users,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

import Navbar from "./components/Navbar";
import HeroScene from "./components/3d/HeroScene";
import Section from "./components/Section";
import MediaCard from "./components/MediaCard";
import Lightbox from "./components/Lightbox";
import { api } from "./lib/api";

import type {
  Activity,
  Announcement,
  Event,
  Media,
  Member,
  SiteSettings,
} from "./types";

const HERO_VIDEO = "/api/hero-video";

const fallback: SiteSettings = {
  organizationName: "Hanuman Youth Association",
  shortName: "HYA Jaklair",
  tagline:
    "United by Culture. Driven by Youth. Dedicated to Community.",
  description:
    "A youth-led community platform rooted in culture, service and collective action.",
  mission:
    "Empower young people to serve, lead and preserve the cultural spirit of Jaklair.",
  vision:
    "A connected, compassionate and confident community powered by youth.",
  establishedYear: 2015,
  location: "Jaklair, Telangana, India",
  phone: "+91 00000 00000",
  email: "hello@hyajaklair.org",
  mapUrl: "https://maps.google.com/?q=Jaklair,Telangana",
  instagram:
    "https://www.instagram.com/_hanuman_youth_association_/",
  youtube: "",
  facebook: "",
  whatsapp: "",
  heroVideo: HERO_VIDEO,
  theme: "dark",
};

const demoMedia: Media[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1400&q=80",
    title: "Community, together",
    caption: "Young people showing up for the community.",
    type: "photo",
    category: "Community",
    featured: true,
    published: true,
    createdAt: "2026-01-10",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=80",
    title: "Youth energy",
    caption: "Friendship, leadership and shared purpose.",
    type: "photo",
    category: "Youth",
    featured: true,
    published: true,
    createdAt: "2026-02-01",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    title: "Festival memories",
    caption: "Culture creates memories that last.",
    type: "photo",
    category: "Cultural",
    featured: false,
    published: true,
    createdAt: "2026-03-02",
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1400&q=80",
    title: "Service in action",
    caption: "Small actions, real impact.",
    type: "photo",
    category: "Community",
    featured: false,
    published: true,
    createdAt: "2026-03-20",
  },
];

export default function App() {
  const [settings, setSettings] =
    useState<SiteSettings>(fallback);

  const [events, setEvents] = useState<Event[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [media, setMedia] = useState<Media[]>(demoMedia);
  const [members, setMembers] = useState<Member[]>([]);
  const [announcements, setAnnouncements] = useState<
    Announcement[]
  >([]);

  const [lightbox, setLightbox] = useState<Media | null>(null);
  const [query, setQuery] = useState("");

  /*
   * Load public site data.
   *
   * Every request has its own catch handler so a failed API
   * request cannot blank the entire application.
   */
  useEffect(() => {
    let mounted = true;

    api
      .get<SiteSettings>("/site")
      .then((data) => {
        if (!mounted) return;

        setSettings({
          ...fallback,
          ...data,
          heroVideo: HERO_VIDEO,
        });
      })
      .catch((error) => {
        console.warn("Could not load site settings:", error);
      });

    api
      .get<Event[]>("/events")
      .then((data) => {
        if (mounted) setEvents(data);
      })
      .catch(() => {});

    api
      .get<Activity[]>("/activities")
      .then((data) => {
        if (mounted) setActivities(data);
      })
      .catch(() => {});

    api
      .get<Media[]>("/media?published=true")
      .then((data) => {
        if (mounted && data.length > 0) {
          setMedia(data);
        }
      })
      .catch(() => {});

    api
      .get<Member[]>("/members")
      .then((data) => {
        if (mounted) setMembers(data);
      })
      .catch(() => {});

    api
      .get<Announcement[]>("/announcements")
      .then((data) => {
        if (mounted) setAnnouncements(data);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return media.filter((m) =>
      `${m.title} ${m.caption} ${m.category}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [media, query]);

  const scroll = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  /*
   * Always use the known-good Supabase video when the API
   * returns an empty/invalid heroVideo value.
   */
  const heroVideo = HERO_VIDEO;

  return (
    <div className="min-h-screen bg-[#080808] text-white font-geist">
      {/* =========================================================
          HERO
      ========================================================== */}
      <div
        id="home"
        className="relative h-screen w-full overflow-hidden bg-black"
      >
        {/* HERO VIDEO — exact HYA MP4 */}
        <video
          key={HERO_VIDEO}
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 z-0 block h-full w-full object-cover"
          style={{
            objectPosition: "center center",
            pointerEvents: "none",
          }}
          ref={(video) => {
            if (!video) return;

            video.muted = true;
            video.defaultMuted = true;

            const playVideo = () => {
              video.muted = true;
              video.play().catch(() => {});
            };

            if (video.readyState >= 2) {
              playVideo();
            } else {
              video.addEventListener("canplay", playVideo, {
                once: true,
              });
            }
          }}
          onLoadedMetadata={(event) => {
            event.currentTarget.muted = true;
            event.currentTarget.play().catch(() => {});
          }}
          onCanPlay={(event) => {
            event.currentTarget.muted = true;
            event.currentTarget.play().catch(() => {});
          }}
          onError={(event) => {
            console.error(
              "HYA hero video failed:",
              event.currentTarget.error
            );
          }}
        />

        {/* EXISTING HERO OVERLAY */}
        <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_65%_40%,rgba(245,158,11,.12),transparent_28%),linear-gradient(90deg,rgba(0,0,0,.84),rgba(0,0,0,.35),rgba(0,0,0,.72))]" />

        {/* SAME 3D SCENE */}
        <HeroScene />

        {/* EXISTING GRAIN */}
        <div className="grain absolute inset-0 z-[3] opacity-20" />

        <Navbar />

        <main className="relative z-10 flex h-[calc(100vh-80px)] flex-col justify-between px-6 pb-10 pt-32 sm:pb-12 md:px-12 md:pb-16 lg:px-16">
          <div className="max-w-4xl">
            <div className="mb-5 animate-[fadeSlideUp_.8s_ease_.2s_both] text-xs font-semibold uppercase tracking-[.34em] text-amber-300 sm:text-sm">
              Youth • Culture • Community
            </div>

            <h1 className="animate-[fadeSlideUp_.8s_ease_.4s_both] font-display text-[clamp(2.8rem,7vw,7.6rem)] font-semibold leading-[.92] tracking-[-.055em] text-balance">
              United by Culture,
              <br />
              Driven by Youth,
              <br />
              <span className="text-white/45">
                Built for Community.
              </span>
            </h1>
          </div>

          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <p className="max-w-md animate-[fadeSlideUp_.8s_ease_.7s_both] text-sm leading-7 text-white/65 sm:text-base">
              {settings.description}
            </p>

            <div className="flex flex-wrap gap-3 animate-[fadeSlideUp_.8s_ease_.9s_both]">
              <button
                onClick={() => scroll("about")}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-105"
              >
                Explore our journey
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => scroll("events")}
                className="rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
              >
                View events
              </button>
            </div>
          </div>
        </main>

        <div className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 text-[10px] uppercase tracking-[.35em] text-white/35 md:block">
          Scroll to discover
        </div>
      </div>

      {/* =========================================================
          ANNOUNCEMENTS
      ========================================================== */}
      {announcements.length > 0 && (
        <div className="border-y border-amber-400/15 bg-amber-400/[.05] px-6 py-3">
          <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-hidden text-sm">
            <span className="shrink-0 font-semibold uppercase tracking-[.2em] text-amber-300">
              Notice
            </span>

            <div className="truncate text-white/65">
              {announcements[0].title} —{" "}
              {announcements[0].description}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ABOUT
      ========================================================== */}
      <Section
        id="about"
        eyebrow="01 / The association"
        title="A youth movement with roots, rhythm and responsibility."
      >
        <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[.03] p-7 md:p-10">
            <p className="max-w-3xl text-xl leading-9 text-white/78 md:text-2xl">
              {settings.tagline}
            </p>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/48">
              {settings.description}
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              <Stat
                icon={<Heart size={18} />}
                label="Mission"
                value="Serve & lead"
              />

              <Stat
                icon={<Sparkles size={18} />}
                label="Founded"
                value={`${settings.establishedYear}`}
              />

              <Stat
                icon={<MapPin size={18} />}
                label="Home"
                value="Jaklair"
              />
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-amber-400 via-orange-500 to-red-700 p-[1px]">
            <div className="h-full rounded-[2rem] bg-[#0c0c0c] p-7 md:p-10">
              <div className="text-xs uppercase tracking-[.3em] text-amber-300">
                Our compass
              </div>

              <h3 className="mt-4 font-display text-3xl font-semibold">
                Mission
              </h3>

              <p className="mt-3 leading-7 text-white/55">
                {settings.mission}
              </p>

              <h3 className="mt-9 font-display text-3xl font-semibold">
                Vision
              </h3>

              <p className="mt-3 leading-7 text-white/55">
                {settings.vision}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* =========================================================
          ACTIVITIES
      ========================================================== */}
      <section
        id="activities"
        className="overflow-hidden border-y border-white/5 bg-[#0d0d0d] px-6 py-24 md:px-12 lg:px-16 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[.32em] text-amber-400">
                02 / Activities
              </div>

              <h2 className="mt-4 font-display text-4xl font-semibold md:text-6xl">
                Energy with purpose.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-white/45">
              Culture, youth leadership, sport and social service — the four
              currents that keep the association moving.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(activities.length
              ? activities
              : [
                  {
                    id: "a1",
                    title: "Cultural celebrations",
                    category: "Cultural",
                    description:
                      "Festival programs, Hanuman Jayanti and local traditions brought to life.",
                  },
                  {
                    id: "a2",
                    title: "Youth leadership",
                    category: "Youth",
                    description:
                      "Meetings, awareness programs and leadership opportunities for young people.",
                  },
                  {
                    id: "a3",
                    title: "Sports & tournaments",
                    category: "Sports",
                    description:
                      "Cricket, volleyball, kabaddi and the healthy competitive spirit of youth.",
                  },
                  {
                    id: "a4",
                    title: "Community service",
                    category: "Social Service",
                    description:
                      "Blood donation, food distribution, cleanliness drives and community support.",
                  },
                ]
            ).map((a, i) => (
              <motion.article
                key={a.id}
                whileHover={{ y: -6 }}
                className="group rounded-[1.6rem] border border-white/8 bg-white/[.025] p-7 transition hover:border-amber-400/30 md:p-9"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[.24em] text-amber-300">
                    {a.category}
                  </span>

                  <span className="font-display text-4xl text-white/10">
                    0{i + 1}
                  </span>
                </div>

                <h3 className="mt-12 font-display text-2xl font-semibold">
                  {a.title}
                </h3>

                <p className="mt-3 max-w-md text-sm leading-7 text-white/45">
                  {a.description}
                </p>

                <div className="mt-8 h-px w-16 bg-amber-400/70 transition-all group-hover:w-28" />
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          EVENTS
      ========================================================== */}
      <Section
        id="events"
        eyebrow="03 / Events"
        title="Moments that bring Jaklair together."
      >
        <div className="mt-14 space-y-3">
          {events.length ? (
            events.map((e) => (
              <EventRow key={e.id} event={e} />
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-white/45">
              Upcoming events will appear here as the Admin publishes them.
            </div>
          )}
        </div>
      </Section>

      {/* =========================================================
          GALLERY
      ========================================================== */}
      <section
        id="gallery"
        className="border-y border-white/5 bg-[#0d0d0d] px-6 py-24 md:px-12 lg:px-16 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[.32em] text-amber-400">
                04 / Gallery
              </div>

              <h2 className="mt-4 font-display text-4xl font-semibold md:text-6xl">
                Life, captured.
              </h2>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[.03] px-4 py-2">
              <span className="text-white/30">⌕</span>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search moments"
                className="w-40 bg-transparent text-sm outline-none placeholder:text-white/25 md:w-56"
              />
            </div>
          </div>

          <div className="mt-14 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="mb-4 break-inside-avoid"
              >
                <MediaCard
                  item={m}
                  onOpen={setLightbox}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          VIDEOS
      ========================================================== */}
      <Section
        id="videos"
        eyebrow="05 / Videos"
        title="The movement, in motion."
      >
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {media
            .filter((m) => m.type === "video")
            .map((m) => (
              <MediaCard
                key={m.id}
                item={m}
                onOpen={setLightbox}
              />
            ))}

          {media.filter((m) => m.type === "video").length === 0 && (
            <div className="md:col-span-2 rounded-[2rem] border border-dashed border-white/10 p-10 text-white/45">
              Published videos will appear here. Admins can upload MP4/WebM
              or add official video links.
            </div>
          )}
        </div>
      </Section>

      {/* =========================================================
          COMMUNITY
      ========================================================== */}
      <section
        id="community"
        className="relative overflow-hidden bg-amber-400 px-6 py-24 text-black md:px-12 lg:px-16 lg:py-32"
      >
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[40px] border-black/10" />

        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.32em] text-black/50">
              06 / Community
            </div>

            <h2 className="mt-5 max-w-4xl font-display text-5xl font-semibold tracking-tight md:text-7xl">
              Show up. Serve well. Leave it stronger.
            </h2>
          </div>

          <div>
            <p className="max-w-lg text-base leading-8 text-black/65">
              The association turns youth energy into visible community action
              — from celebration to service, from sport to shared responsibility.
            </p>

            <button
              onClick={() => scroll("contact")}
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 font-semibold text-white"
            >
              Join the movement
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          TEAM
      ========================================================== */}
      <Section
        id="team"
        eyebrow="07 / People"
        title="Young people who choose to lead."
      >
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(members.length
            ? members
            : [
                {
                  id: "m1",
                  name: "Association President",
                  position: "President",
                },
                {
                  id: "m2",
                  name: "Youth Leadership",
                  position: "Vice President",
                },
                {
                  id: "m3",
                  name: "Association Secretary",
                  position: "Secretary",
                },
                {
                  id: "m4",
                  name: "Community Team",
                  position: "Volunteers",
                },
              ]
          ).map((m) => (
            <div
              key={m.id}
              className="rounded-[1.5rem] border border-white/8 bg-white/[.03] p-6"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/10 text-amber-300">
                <Users />
              </div>

              <h3 className="mt-7 font-display text-xl font-semibold">
                {m.name}
              </h3>

              <div className="mt-1 text-sm text-amber-300">
                {m.position}
              </div>

              <p className="mt-3 text-sm leading-6 text-white/40">
                {m.bio || "A member of the HYA Jaklair team."}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* =========================================================
          CONTACT
      ========================================================== */}
      <section
        id="contact"
        className="border-t border-white/5 bg-[#050505] px-6 py-24 md:px-12 lg:px-16 lg:py-32"
      >
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[.32em] text-amber-400">
              08 / Contact
            </div>

            <h2 className="mt-4 font-display text-5xl font-semibold md:text-7xl">
              Come build with us.
            </h2>

            <p className="mt-6 max-w-md leading-7 text-white/45">
              Want to volunteer, collaborate, sponsor an activity or simply
              connect? Reach out.
            </p>

            <div className="mt-10 space-y-5 text-sm text-white/65">
              <a
                className="flex items-center gap-3 hover:text-white"
                href={`tel:${settings.phone}`}
              >
                <Phone size={17} />
                {settings.phone}
              </a>

              <a
                className="flex items-center gap-3 hover:text-white"
                href={`mailto:${settings.email}`}
              >
                <Mail size={17} />
                {settings.email}
              </a>

              <a
                className="flex items-center gap-3 hover:text-white"
                href={settings.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={17} />
                {settings.location}
              </a>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="border-t border-white/5 px-6 py-10 md:px-12 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="font-display text-2xl font-bold">
              HANUMAN YOUTH ASSOCIATION
            </div>

            <div className="mt-1 text-xs uppercase tracking-[.4em] text-white/35">
              Jaklair
            </div>

            <p className="mt-5 text-xs text-white/30">
              © 2026 Hanuman Youth Association, Jaklair. All rights reserved.
            </p>
          </div>

          <div className="flex gap-3">
            {settings.instagram && (
              <Social
                href={settings.instagram}
                icon={<Instagram size={17} />}
              />
            )}

            {settings.youtube && (
              <Social
                href={settings.youtube}
                icon={<Youtube size={17} />}
              />
            )}

            {settings.facebook && (
              <Social
                href={settings.facebook}
                icon={<Facebook size={17} />}
              />
            )}

            {settings.whatsapp && (
              <Social
                href={settings.whatsapp}
                icon={<MessageCircle size={17} />}
              />
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="/admin/login"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-5 py-2.5 text-xs font-semibold uppercase tracking-[.18em] text-white/55 transition hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-200"
          >
            Admin Login
          </a>
        </div>
      </footer>

      {lightbox && (
        <Lightbox
          item={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

/* =============================================================
   STAT
============================================================= */

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-3 text-amber-300">
        {icon}
      </div>

      <div className="text-xs uppercase tracking-[.2em] text-white/30">
        {label}
      </div>

      <div className="mt-1 font-display text-lg font-semibold">
        {value}
      </div>
    </div>
  );
}

/* =============================================================
   EVENT ROW
============================================================= */

function EventRow({ event }: { event: Event }) {
  const date = new Date(event.date);

  return (
    <motion.article
      whileHover={{ x: 6 }}
      className="group grid gap-5 rounded-[1.5rem] border border-white/8 p-6 transition hover:border-amber-400/30 md:grid-cols-[110px_1fr_auto] md:items-center"
    >
      <div>
        <div className="text-3xl font-display font-semibold text-amber-300">
          {date.getDate().toString().padStart(2, "0")}
        </div>

        <div className="text-xs uppercase tracking-[.2em] text-white/30">
          {date.toLocaleDateString("en", {
            month: "short",
          })}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[.2em] text-white/30">
          {event.status}
          {event.time ? ` • ${event.time}` : ""}
        </div>

        <h3 className="mt-1 font-display text-2xl font-semibold">
          {event.title}
        </h3>

        <p className="mt-1 text-sm text-white/40">
          {event.location}
        </p>
      </div>

      <Calendar className="text-white/20 group-hover:text-amber-300" />
    </motion.article>
  );
}

/* =============================================================
   SOCIAL
============================================================= */

function Social({
  href,
  icon,
}: {
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/55 transition hover:border-amber-300 hover:text-amber-300"
    >
      {icon}
    </a>
  );
}

/* =============================================================
   CONTACT FORM
============================================================= */

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (busy) return;

    setBusy(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await api.post("/contact", {
        name: formData.get("name"),
        contact: formData.get("contact"),
        message: formData.get("message"),
      });

      setSent(true);
      form.reset();
    } catch (error) {
      console.error("Contact form failed:", error);
      alert("Could not send right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="grid min-h-[350px] place-items-center rounded-[2rem] border border-amber-400/20 bg-amber-400/[.05] p-10 text-center">
        <div>
          <Trophy className="mx-auto text-amber-300" />

          <h3 className="mt-5 font-display text-3xl">
            Message received.
          </h3>

          <p className="mt-2 text-white/45">
            The Admin team can now see your message in the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[2rem] border border-white/8 bg-white/[.025] p-7 md:p-10"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Name" />

        <Field
          name="contact"
          label="Phone / Email"
        />
      </div>

      <label className="mt-5 block text-xs uppercase tracking-[.18em] text-white/35">
        Message

        <textarea
          name="message"
          required
          rows={7}
          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none focus:border-amber-400/50"
        />
      </label>

      <button
        type="submit"
        disabled={busy}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send message"}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

/* =============================================================
   FIELD
============================================================= */

function Field({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <label className="block text-xs uppercase tracking-[.18em] text-white/35">
      {label}

      <input
        name={name}
        required
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none focus:border-amber-400/50"
      />
    </label>
  );
}