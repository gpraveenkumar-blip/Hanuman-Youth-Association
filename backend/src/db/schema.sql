CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  thumbnail_url text,
  title text NOT NULL,
  caption text DEFAULT '',
  mime_type text NOT NULL,
  file_size bigint DEFAULT 0,
  width int,
  height int,
  duration numeric,
  category text NOT NULL DEFAULT 'Community',
  tags text[] DEFAULT '{}',
  type text NOT NULL CHECK(type IN ('photo','video')),
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (media_id uuid PRIMARY KEY REFERENCES media(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS videos (media_id uuid PRIMARY KEY REFERENCES media(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  time text,
  location text,
  description text NOT NULL DEFAULT '',
  cover_image text,
  organizer text,
  status text NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming','live','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  image text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  bio text DEFAULT '',
  photo text,
  social_links jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  image text,
  priority text NOT NULL DEFAULT 'normal',
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS event_gallery (
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  media_id uuid REFERENCES media(id) ON DELETE CASCADE,
  PRIMARY KEY(event_id,media_id)
);

CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text UNIQUE NOT NULL,
  url text NOT NULL
);

CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1,
  organization_name text NOT NULL,
  short_name text NOT NULL,
  tagline text NOT NULL,
  description text NOT NULL,
  mission text NOT NULL,
  vision text NOT NULL,
  established_year int NOT NULL DEFAULT 2015,
  location text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  map_url text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  youtube text NOT NULL DEFAULT '',
  facebook text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  hero_video text NOT NULL DEFAULT '',
  theme text NOT NULL DEFAULT 'dark',
  seo_title text DEFAULT '',
  seo_description text DEFAULT '',
  seo_keywords text DEFAULT '',
  og_image text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_settings (
  organization_name, short_name, tagline, description, mission, vision,
  established_year, location, phone, email, map_url, instagram, hero_video
) VALUES (
  'Hanuman Youth Association',
  'HYA Jaklair',
  'United by Culture. Driven by Youth. Dedicated to Community.',
  'A youth-led community platform rooted in culture, service and collective action.',
  'Empower young people to serve, lead and preserve the cultural spirit of Jaklair.',
  'A connected, compassionate and confident community powered by youth.',
  2015,
  'Jaklair, Telangana, India',
  '+91 00000 00000',
  'hello@hyajaklair.org',
  'https://www.google.com/maps/place/HANUMAN+YOUTH+JAKLAIR/@16.5603586,77.6036836,17z/data=!3m1!4b1!4m6!3m5!1s0x3bc9950068d49321:0x453128d7382400a1!8m2!3d16.5603586!4d77.6062585!16s%2Fg%2F11xvsh7yqx?entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D',
  'https://www.instagram.com/_hanuman_youth_association_/',
  'https://mfrodezbnzouqrbzhrxh.supabase.co/storage/v1/object/public/Videos/hya-jaklair.mp4'
) ON CONFLICT (id) DO NOTHING;
