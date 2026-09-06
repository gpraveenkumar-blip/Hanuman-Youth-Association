export type Media = {
  id: string; url: string; thumbnailUrl?: string; title: string; caption?: string;
  type: "photo" | "video"; category: string; featured: boolean; published: boolean;
  createdAt: string;
};
export type Event = {
  id: string; title: string; date: string; time?: string; location?: string;
  description: string; coverImage?: string; organizer?: string;
  status: "upcoming" | "live" | "completed";
};
export type Activity = { id: string; title: string; category: string; description: string; image?: string; };
export type Member = { id: string; name: string; position: string; bio?: string; photo?: string; };
export type Announcement = { id: string; title: string; description: string; priority: string; date: string; };
export type SiteSettings = {
  organizationName: string; shortName: string; tagline: string; description: string;
  mission: string; vision: string; establishedYear: number; location: string;
  phone: string; email: string; mapUrl: string; instagram: string; youtube: string;
  facebook: string; whatsapp: string; heroVideo: string; theme: "dark" | "light";
};
