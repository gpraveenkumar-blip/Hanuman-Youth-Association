import { Router, type Request, type Response, type NextFunction } from "express";
import { Readable } from "node:stream";
import bcrypt from "bcryptjs";
import multer from "multer";
import { supabase } from "./lib/supabase.js";
import { z } from "zod";
import { query } from "./db/client.js";
import { requireAuth, signAdmin } from "./middleware/auth.js";
import type { AuthRequest } from "./middleware/auth.js";


const router = Router();

const HERO_VIDEO_URL =
  "https://mfrodezbnzouqrbzhrxh.supabase.co/storage/v1/object/public/Videos/hya-jaklair.mp4";

/* ==========================================================================
   HERO VIDEO PROXY
   --------------------------------------------------------------------------
   The browser receives the MP4 from the same origin as the React app.
   Range requests are forwarded to Supabase so Chrome/Safari/Firefox can
   seek and progressively stream the MP4 correctly.
   ========================================================================== */

async function proxyHeroVideo(
  req: Request,
  res: Response
) {
  try {
    const range = req.headers.range;

    const upstream = await fetch(HERO_VIDEO_URL, {
      method: req.method === "HEAD" ? "HEAD" : "GET",
      headers: range ? { Range: range } : undefined,
      redirect: "follow",
    });

    if (!upstream.ok && upstream.status !== 206) {
      console.error(
        "Hero video upstream failed:",
        upstream.status,
        upstream.statusText
      );

      return res.status(502).json({
        message: "Hero video source is unavailable",
      });
    }

    const contentType =
      upstream.headers.get("content-type") || "video/mp4";
    const contentLength =
      upstream.headers.get("content-length");
    const contentRange =
      upstream.headers.get("content-range");
    const acceptRanges =
      upstream.headers.get("accept-ranges") || "bytes";

    res.status(upstream.status);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Accept-Ranges", acceptRanges);
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");

    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    if (contentRange) {
      res.setHeader("Content-Range", contentRange);
    }

    if (req.method === "HEAD" || !upstream.body) {
      return res.end();
    }

    Readable.fromWeb(upstream.body as any).pipe(res);
  } catch (error) {
    console.error("Hero video proxy failed:", error);

    if (!res.headersSent) {
      return res.status(502).json({
        message: "Could not stream hero video",
      });
    }

    res.end();
  }
}

router.get("/hero-video", proxyHeroVideo);
router.head("/hero-video", proxyHeroVideo);


/* ==========================================================================
   FILE UPLOADS
   ========================================================================== */

const maxUploadSize =
  Number(process.env.MAX_UPLOAD_MB || 100) *
  1024 *
  1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadSize,
  },
  fileFilter: (_req, file, cb) => {
    const allowed =
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/");

    if (!allowed) {
      return cb(
        new Error(
          "Only image and video files are allowed"
        )
      );
    }

    cb(null, true);
  },
});

function createStoragePath(
  originalName: string,
  type: "photo" | "video"
) {
  const safeName = originalName
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  const folder =
    type === "photo"
      ? "images"
      : "videos";

  return `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${safeName}`;
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

function getMediaType(
  mimetype: string
): "photo" | "video" {
  return mimetype.startsWith("video/")
    ? "video"
    : "photo";
}

/**
 * Converts frontend event status values into
 * the values allowed by the PostgreSQL CHECK constraint.
 *
 * Active     -> live
 * Upcoming   -> upcoming
 * Completed  -> completed
 */
function normalizeEventStatus(
  value: unknown
): "upcoming" | "live" | "completed" {
  if (typeof value !== "string") {
    return "upcoming";
  }

  switch (value.trim().toLowerCase()) {
    case "active":
    case "live":
      return "live";

    case "upcoming":
      return "upcoming";

    case "completed":
    case "complete":
      return "completed";

    default:
      return "upcoming";
  }
}

/**
 * Converts:
 *
 * 20/08/2026
 * 20-08-2026
 * 2026-08-20
 *
 * into:
 *
 * 2026-08-20
 */
function normalizeEventDate(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const input = value.trim();

  if (!input) {
    return null;
  }

  // Already PostgreSQL/HTML date format.
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(input)
  ) {
    const [year, month, day] =
      input.split("-").map(Number);

    if (
      isValidDateParts(
        year,
        month,
        day
      )
    ) {
      return input;
    }

    return null;
  }

  // DD/MM/YYYY
  const slash =
    /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(
      input
    );

  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = Number(slash[3]);

    if (
      !isValidDateParts(
        year,
        month,
        day
      )
    ) {
      return null;
    }

    return `${year}-${String(month).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
  }

  // DD-MM-YYYY
  const dash =
    /^(\d{2})-(\d{2})-(\d{4})$/.exec(
      input
    );

  if (dash) {
    const day = Number(dash[1]);
    const month = Number(dash[2]);
    const year = Number(dash[3]);

    if (
      !isValidDateParts(
        year,
        month,
        day
      )
    ) {
      return null;
    }

    return `${year}-${String(month).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

function isValidDateParts(
  year: number,
  month: number,
  day: number
) {
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

async function writeAuditLog(
  adminId: string | undefined,
  action: string,
  entity?: string,
  entityId?: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    await query(
      `INSERT INTO audit_logs
        (
          admin_id,
          action,
          entity,
          entity_id,
          metadata
        )
       VALUES
        ($1,$2,$3,$4,$5)`,
      [
        adminId || null,
        action,
        entity || null,
        entityId || null,
        JSON.stringify(metadata)
      ]
    );
  } catch (error) {
    console.error(
      "Audit log failed:",
      error
    );
  }
}

/* ==========================================================================
   AUTH
   ========================================================================== */

router.post(
  "/auth/login",
  async (req, res) => {
    try {
      const body = z
        .object({
          email: z.string().email(),
          password: z
            .string()
            .min(1)
        })
        .parse(req.body);

      const email =
        body.email.toLowerCase().trim();

      const result = await query(
        `SELECT
          id,
          email,
          password_hash,
          role
         FROM admins
         WHERE email=$1`,
        [email]
      );

      const admin = result.rows[0];

      if (
        !admin ||
        !(await bcrypt.compare(
          body.password,
          admin.password_hash
        ))
      ) {
        return res.status(401).json({
          message:
            "Invalid email or password"
        });
      }

      const token = signAdmin(
        admin.id
      );

      res.cookie(
        "hya_session",
        token,
        {
          httpOnly: true,
          sameSite: "lax",
          secure:
            process.env.NODE_ENV ===
            "production",
          maxAge:
            8 * 60 * 60 * 1000,
          path: "/"
        }
      );

      await writeAuditLog(
        admin.id,
        "admin_login",
        "admins",
        admin.id
      );

      return res.json({
        id: admin.id,
        email: admin.email,
        role: admin.role
      });
    } catch (error) {
      console.error(
        "Login failed:",
        error
      );

      return res.status(400).json({
        message: "Invalid login request"
      });
    }
  }
);

router.post(
  "/auth/logout",
  async (req: AuthRequest, res) => {
    await writeAuditLog(
      req.adminId,
      "admin_logout",
      "admins",
      req.adminId
    );

    res.clearCookie(
      "hya_session",
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/"
      }
    );

    return res.json({
      ok: true
    });
  }
);

router.get(
  "/auth/me",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    const result = await query(
      `SELECT
        id,
        email,
        role,
        created_at AS "createdAt"
       FROM admins
       WHERE id=$1`,
      [req.adminId]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    return res.json(
      result.rows[0]
    );
  }
);

/* ==========================================================================
   ADMIN ACCOUNT MANAGEMENT
   ========================================================================== */

router.get(
  "/auth/admins",
  requireAuth,
  async (_req, res) => {
    const result = await query(
      `SELECT
        id,
        email,
        role,
        created_at AS "createdAt"
       FROM admins
       ORDER BY created_at DESC`
    );

    return res.json(
      result.rows
    );
  }
);

router.post(
  "/auth/admins",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    try {
      const body = z
        .object({
          email: z.string().email(),
          password: z
            .string()
            .min(8)
        })
        .parse(req.body);

      const email =
        body.email.toLowerCase().trim();

      const existing = await query(
        `SELECT id
         FROM admins
         WHERE email=$1`,
        [email]
      );

      if (existing.rows.length) {
        return res.status(409).json({
          message:
            "Admin account already exists"
        });
      }

      const passwordHash =
        await bcrypt.hash(
          body.password,
          12
        );

      const result = await query(
        `INSERT INTO admins
          (
            email,
            password_hash,
            role
          )
         VALUES
          ($1,$2,'admin')
         RETURNING
          id,
          email,
          role,
          created_at AS "createdAt"`,
        [
          email,
          passwordHash
        ]
      );

      await writeAuditLog(
        req.adminId,
        "admin_created",
        "admins",
        result.rows[0].id,
        {
          email
        }
      );

      return res.status(201).json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Admin creation failed:",
        error
      );

      return res.status(400).json({
        message:
          "Failed to create admin"
      });
    }
  }
);

router.delete(
  "/auth/admins/:id",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    if (
      String(req.params.id) ===
      req.adminId
    ) {
      return res.status(400).json({
        message:
          "You cannot delete your own admin account"
      });
    }

    const count = await query(
      `SELECT COUNT(*)::int AS count
       FROM admins`
    );

    if (count.rows[0].count <= 1) {
      return res.status(400).json({
        message:
          "At least one admin account must remain"
      });
    }

    await query(
      `DELETE FROM admins
       WHERE id=$1`,
      [String(req.params.id)]
    );

    await writeAuditLog(
      req.adminId,
      "admin_deleted",
      "admins",
      String(req.params.id)
    );

    return res.json({
      ok: true
    });
  }
);

/* ==========================================================================
   SITE SETTINGS
   ========================================================================== */

router.get(
  "/site",
  async (_req, res) => {
    const result = await query(
      `SELECT
        organization_name AS "organizationName",
        short_name AS "shortName",
        tagline,
        description,
        mission,
        vision,
        established_year AS "establishedYear",
        location,
        phone,
        email,
        map_url AS "mapUrl",
        instagram,
        youtube,
        facebook,
        whatsapp,
        hero_video AS "heroVideo",
        theme,
        seo_title AS "seoTitle",
        seo_description AS "seoDescription",
        seo_keywords AS "seoKeywords",
        og_image AS "ogImage"
       FROM site_settings
       WHERE id=1`
    );

    return res.json(
      result.rows[0] || null
    );
  }
);

router.put(
  "/site",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    const body = z
      .object({
        organizationName: z.string(),
        shortName: z.string(),
        tagline: z.string(),
        description: z.string(),
        mission: z.string(),
        vision: z.string(),
        establishedYear: z.coerce.number(),
        location: z.string(),
        phone: z.string(),
        email: z.string(),
        mapUrl: z.string(),
        instagram: z.string(),
        youtube: z.string(),
        facebook: z.string(),
        whatsapp: z.string(),
        heroVideo: z.string(),
        theme: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.string().optional(),
        ogImage: z.string().optional()
      })
      .parse(req.body);

    await query(
      `UPDATE site_settings
       SET
        organization_name=$1,
        short_name=$2,
        tagline=$3,
        description=$4,
        mission=$5,
        vision=$6,
        established_year=$7,
        location=$8,
        phone=$9,
        email=$10,
        map_url=$11,
        instagram=$12,
        youtube=$13,
        facebook=$14,
        whatsapp=$15,
        hero_video=$16,
        theme=$17,
        seo_title=$18,
        seo_description=$19,
        seo_keywords=$20,
        og_image=$21,
        updated_at=now()
       WHERE id=1`,
      [
        body.organizationName,
        body.shortName,
        body.tagline,
        body.description,
        body.mission,
        body.vision,
        body.establishedYear,
        body.location,
        body.phone,
        body.email,
        body.mapUrl,
        body.instagram,
        body.youtube,
        body.facebook,
        body.whatsapp,
        body.heroVideo,
        body.theme || "dark",
        body.seoTitle || "",
        body.seoDescription || "",
        body.seoKeywords || "",
        body.ogImage || ""
      ]
    );

    await writeAuditLog(
      req.adminId,
      "site_updated",
      "site_settings"
    );

    return res.json({
      ok: true
    });
  }
);

/* ==========================================================================
   MEDIA
   ========================================================================== */

router.get(
  "/media",
  async (req, res) => {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (
      req.query.published ===
      "true"
    ) {
      conditions.push(
        "published=true"
      );
    }

    if (
      typeof req.query.category ===
      "string" &&
      req.query.category.trim()
    ) {
      params.push(
        req.query.category.trim()
      );

      conditions.push(
        `category=$${params.length}`
      );
    }

    if (
      typeof req.query.type ===
        "string" &&
      ["photo", "video"].includes(
        req.query.type
      )
    ) {
      params.push(
        req.query.type
      );

      conditions.push(
        `type=$${params.length}`
      );
    }

    const where =
      conditions.length
        ? `WHERE ${conditions.join(
            " AND "
          )}`
        : "";

    const result = await query(
      `SELECT
        id,
        url,
        thumbnail_url AS "thumbnailUrl",
        title,
        caption,
        mime_type AS "mimeType",
        file_size AS "fileSize",
        width,
        height,
        duration,
        category,
        tags,
        type,
        featured,
        published,
        created_at AS "createdAt"
       FROM media
       ${where}
       ORDER BY created_at DESC`,
      params
    );

    return res.json(
      result.rows
    );
  }
);

router.post(
  "/media",
  requireAuth,
  upload.single("file"),
  async (
    req: AuthRequest,
    res
  ) => {
    if (!req.file) {
      return res.status(400).json({
        message: "File required",
      });
    }

    try {
      const type = getMediaType(
        req.file.mimetype
      );

      const storagePath =
        createStoragePath(
          req.file.originalname,
          type
        );

      const { error: uploadError } =
        await supabase.storage
          .from("hya-media")
          .upload(
            storagePath,
            req.file.buffer,
            {
              contentType:
                req.file.mimetype,
              upsert: false,
            }
          );

      if (uploadError) {
        console.error(
          "Supabase upload failed:",
          uploadError
        );

        return res.status(500).json({
          message:
            "Failed to upload file to storage",
        });
      }

      const {
        data: publicData,
      } =
        supabase.storage
          .from("hya-media")
          .getPublicUrl(
            storagePath
          );

      const url =
        publicData.publicUrl;

      const title = String(
        req.body.title ||
          req.file.originalname
      );

      const caption = String(
        req.body.caption || ""
      );

      const category = String(
        req.body.category ||
          "Community"
      );

      const result = await query(
        `INSERT INTO media
          (
            url,
            thumbnail_url,
            title,
            caption,
            mime_type,
            file_size,
            category,
            type,
            published
          )
         VALUES
          (
            $1,
            CASE WHEN $7 = 'photo' THEN $1 ELSE NULL END,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            true
          )
         RETURNING
          id,
          url,
          title,
          caption,
          type,
          category,
          featured,
          published,
          created_at AS "createdAt"`,
        [
          url,
          title,
          caption,
          req.file.mimetype,
          req.file.size,
          category,
          type,
        ]
      );

      const mediaId =
        result.rows[0].id;

      await query(
        `INSERT INTO ${
          type === "photo"
            ? "photos"
            : "videos"
        }
        (media_id)
        VALUES($1)`,
        [mediaId]
      );

      await writeAuditLog(
        req.adminId,
        "media_uploaded",
        "media",
        mediaId,
        {
          type,
          category,
          filename:
            req.file.originalname,
          fileSize:
            req.file.size,
          storagePath,
        }
      );

      return res.status(201).json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Media upload failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to upload media",
      });
    }
  }
);

/* ==========================================================================
   DELETE MEDIA
   ========================================================================== */

router.delete(
  "/media/:id",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    const id = String(req.params.id);

    try {
      const result = await query(
        `SELECT url
         FROM media
         WHERE id=$1`,
        [id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          message: "Media not found",
        });
      }

      const mediaUrl = result.rows[0].url;

      /*
       * Remove the file from Supabase Storage when this
       * record belongs to the hya-media bucket.
       */
      if (
        typeof mediaUrl === "string" &&
        mediaUrl.includes(
          "/storage/v1/object/public/hya-media/"
        )
      ) {
        const marker =
          "/storage/v1/object/public/hya-media/";

        const storagePath = decodeURIComponent(
          mediaUrl.split(marker)[1] || ""
        );

        if (storagePath) {
          const { error } =
            await supabase.storage
              .from("hya-media")
              .remove([storagePath]);

          if (error) {
            console.error(
              "Supabase media delete failed:",
              error
            );
          }
        }
      }

      /*
       * Remove dependent rows first so PostgreSQL
       * foreign-key constraints cannot block deletion.
       */
      await query(
        `DELETE FROM event_gallery
         WHERE media_id=$1`,
        [id]
      );

      await query(
        `DELETE FROM photos
         WHERE media_id=$1`,
        [id]
      );

      await query(
        `DELETE FROM videos
         WHERE media_id=$1`,
        [id]
      );

      await query(
        `DELETE FROM media
         WHERE id=$1`,
        [id]
      );

      await writeAuditLog(
        req.adminId,
        "media_deleted",
        "media",
        id
      );

      return res.json({
        ok: true,
        id,
      });
    } catch (error) {
      console.error(
        "Media delete failed:",
        error
      );

      return res.status(500).json({
        message: "Failed to delete media",
      });
    }
  }
);

/* ==========================================================================
   EVENTS
   ========================================================================== */

router.get(
  "/events",
  async (_req, res) => {
    const result = await query(
      `SELECT
        id,
        title,
        date,
        time,
        location,
        description,
        cover_image AS "coverImage",
        organizer,
        status,
        created_at AS "createdAt"
       FROM events
       ORDER BY date ASC, time ASC`
    );

    return res.json(
      result.rows
    );
  }
);

/*
 * CREATE EVENT
 *
 * Supports:
 *
 * Date:
 *   20/08/2026
 *   20-08-2026
 *   2026-08-20
 *
 * Status:
 *   Active
 *   Upcoming
 *   Completed
 *
 * Database values:
 *   live
 *   upcoming
 *   completed
 */
router.post(
  "/events",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    try {
      const eventDate =
        normalizeEventDate(
          req.body.date
        );

      if (!eventDate) {
        return res.status(400).json({
          message:
            "Invalid event date. Use DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD."
        });
      }

      const eventStatus =
        normalizeEventStatus(
          req.body.status
        );

      const body = {
        title: String(
          req.body.title || ""
        ).trim(),

        date: eventDate,

        time:
          req.body.time != null
            ? String(
                req.body.time
              )
            : "",

        location:
          req.body.location !=
          null
            ? String(
                req.body.location
              )
            : "",

        description:
          req.body.description !=
          null
            ? String(
                req.body.description
              )
            : "",

        status: eventStatus
      };

      const validated = z
        .object({
          title: z
            .string()
            .min(2),

          date: z
            .string()
            .regex(
              /^\d{4}-\d{2}-\d{2}$/
            ),

          time: z
            .string()
            .optional(),

          location: z
            .string()
            .optional(),

          description:
            z.string(),

          status: z.enum([
            "upcoming",
            "live",
            "completed"
          ])
        })
        .parse(body);

      const result = await query(
        `INSERT INTO events
          (
            title,
            date,
            time,
            location,
            description,
            status
          )
         VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
         RETURNING
          id,
          title,
          date,
          time,
          location,
          description,
          cover_image AS "coverImage",
          organizer,
          status,
          created_at AS "createdAt"`,
        [
          validated.title,
          validated.date,
          validated.time || "",
          validated.location || "",
          validated.description,
          validated.status
        ]
      );

      await writeAuditLog(
        req.adminId,
        "event_created",
        "events",
        result.rows[0].id,
        {
          title:
            validated.title,
          date:
            validated.date,
          status:
            validated.status
        }
      );

      return res.status(201).json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Event creation failed:",
        error
      );

      if (
        error instanceof
        z.ZodError
      ) {
        return res.status(400).json({
          message:
            "Invalid event data",
          errors:
            error.errors
        });
      }

      return res.status(500).json({
        message:
          "Failed to create event"
      });
    }
  }
);

router.put(
  "/events/:id",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    try {
      const eventDate =
        normalizeEventDate(
          req.body.date
        );

      if (!eventDate) {
        return res.status(400).json({
          message:
            "Invalid event date. Use DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD."
        });
      }

      const eventStatus =
        normalizeEventStatus(
          req.body.status
        );

      const body = z
        .object({
          title: z
            .string()
            .min(2),

          date: z.string(),

          time: z
            .string()
            .optional(),

          location: z
            .string()
            .optional(),

          description:
            z.string(),

          status: z.enum([
            "upcoming",
            "live",
            "completed"
          ])
        })
        .parse({
          title: String(
            req.body.title || ""
          ).trim(),

          date: eventDate,

          time:
            req.body.time != null
              ? String(
                  req.body.time
                )
              : "",

          location:
            req.body.location !=
            null
              ? String(
                  req.body.location
                )
              : "",

          description:
            req.body.description !=
            null
              ? String(
                  req.body.description
                )
              : "",

          status: eventStatus
        });

      const result = await query(
        `UPDATE events
         SET
          title=$1,
          date=$2,
          time=$3,
          location=$4,
          description=$5,
          status=$6
         WHERE id=$7
         RETURNING
          id,
          title,
          date,
          time,
          location,
          description,
          cover_image AS "coverImage",
          organizer,
          status,
          created_at AS "createdAt"`,
        [
          body.title,
          body.date,
          body.time || "",
          body.location || "",
          body.description,
          body.status,
          String(req.params.id)
        ]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          message:
            "Event not found"
        });
      }

      await writeAuditLog(
        req.adminId,
        "event_updated",
        "events",
        String(req.params.id),
        {
          date: body.date,
          status: body.status
        }
      );

      return res.json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Event update failed:",
        error
      );

      if (
        error instanceof
        z.ZodError
      ) {
        return res.status(400).json({
          message:
            "Invalid event data",
          errors:
            error.errors
        });
      }

      return res.status(500).json({
        message:
          "Failed to update event"
      });
    }
  }
);

router.post(
  "/events/:id/media",
  requireAuth,
  upload.single("file"),
  async (
    req: AuthRequest,
    res
  ) => {
    try {
      const event = await query(
        `SELECT id
         FROM events
         WHERE id=$1`,
        [String(req.params.id)]
      );

      if (!event.rows.length) {
        return res.status(404).json({
          message:
            "Event not found"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message:
            "File required"
        });
      }

      const type =
        getMediaType(
          req.file.mimetype
        );

      const storagePath =
        createStoragePath(
          req.file.originalname,
          type
        );

      const { error: uploadError } =
        await supabase.storage
          .from("hya-media")
          .upload(
            storagePath,
            req.file.buffer,
            {
              contentType:
                req.file.mimetype,
              upsert: false,
            }
          );

      if (uploadError) {
        console.error(
          "Supabase event media upload failed:",
          uploadError
        );

        return res.status(500).json({
          message:
            "Failed to upload event media to storage",
        });
      }

      const {
        data: publicData,
      } =
        supabase.storage
          .from("hya-media")
          .getPublicUrl(
            storagePath
          );

      const url =
        publicData.publicUrl;

      const title = String(
        req.body.title ||
          req.file.originalname
      );

      const caption =
        String(
          req.body.caption ||
            ""
        );

      const category =
        String(
          req.body.category ||
            "Events"
        );

      /*
       * EXACTLY 8 columns.
       * EXACTLY 8 values.
       */
      const media =
        await query(
          `INSERT INTO media
            (
              url,
              thumbnail_url,
              title,
              caption,
              mime_type,
              file_size,
              category,
              type,
              published
            )
           VALUES
            (
              $1,
              CASE WHEN $7 = 'photo' THEN $1 ELSE NULL END,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              true
            )
           RETURNING
            id,
            url,
            title,
            caption,
            type,
            category,
            featured,
            published,
            created_at AS "createdAt"`,
          [
            url,
            title,
            caption,
            req.file.mimetype,
            req.file.size,
            category,
            type
          ]
        );

      const mediaId =
        media.rows[0].id;

      await query(
        `INSERT INTO ${
          type === "photo"
            ? "photos"
            : "videos"
        }
        (media_id)
        VALUES($1)`,
        [mediaId]
      );

      await query(
        `INSERT INTO event_gallery
          (
            event_id,
            media_id
          )
         VALUES
          ($1,$2)
         ON CONFLICT DO NOTHING`,
        [
          String(req.params.id),
          mediaId
        ]
      );

      await writeAuditLog(
        req.adminId,
        "event_media_uploaded",
        "media",
        mediaId,
        {
          eventId:
            String(req.params.id),
          type,
          category,
          storagePath
        }
      );

      return res.status(201).json(
        media.rows[0]
      );
    } catch (error) {
      console.error(
        "Event media upload failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to upload event media"
      });
    }
  }
);

router.delete(
  "/events/:id",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    await query(
      `DELETE FROM events
       WHERE id=$1`,
      [String(req.params.id)]
    );

    await writeAuditLog(
      req.adminId,
      "event_deleted",
      "events",
      String(req.params.id)
    );

    return res.json({
      ok: true
    });
  }
);

/* ==========================================================================
   ACTIVITIES
   ========================================================================== */

router.get(
  "/activities",
  async (_req, res) => {
    const result = await query(
      `SELECT
        id,
        title,
        category,
        description,
        image,
        created_at AS "createdAt"
       FROM activities
       ORDER BY created_at DESC`
    );

    return res.json(
      result.rows
    );
  }
);

router.post(
  "/activities",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    const body = z
      .object({
        title: z.string(),
        category: z.string(),
        description: z.string(),
        image: z
          .string()
          .optional()
      })
      .parse(req.body);

    const result = await query(
      `INSERT INTO activities
        (
          title,
          category,
          description,
          image
        )
       VALUES
        ($1,$2,$3,$4)
       RETURNING *`,
      [
        body.title,
        body.category,
        body.description,
        body.image || null
      ]
    );

    await writeAuditLog(
      req.adminId,
      "activity_created",
      "activities",
      result.rows[0].id
    );

    return res.status(201).json(
      result.rows[0]
    );
  }
);

router.delete(
  "/activities/:id",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    await query(
      `DELETE FROM activities
       WHERE id=$1`,
      [String(req.params.id)]
    );

    await writeAuditLog(
      req.adminId,
      "activity_deleted",
      "activities",
      String(req.params.id)
    );

    return res.json({
      ok: true
    });
  }
);

/* ==========================================================================
   MEMBERS
   ========================================================================== */

router.get(
  "/members",
  async (_req, res) => {
    const result = await query(
      `SELECT
        id,
        name,
        position,
        bio,
        photo,
        social_links AS "socialLinks",
        created_at AS "createdAt"
       FROM members
       ORDER BY created_at DESC`
    );

    return res.json(
      result.rows
    );
  }
);

router.post(
  "/members",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    const body = z
      .object({
        name: z.string(),
        position: z.string(),
        bio: z.string().optional(),
        photo: z
          .string()
          .optional(),
        socialLinks: z
          .record(z.unknown())
          .optional()
      })
      .parse(req.body);

    const result = await query(
      `INSERT INTO members
        (
          name,
          position,
          bio,
          photo,
          social_links
        )
       VALUES
        ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        body.name,
        body.position,
        body.bio || "",
        body.photo || null,
        JSON.stringify(
          body.socialLinks || {}
        )
      ]
    );

    await writeAuditLog(
      req.adminId,
      "member_created",
      "members",
      result.rows[0].id
    );

    return res.status(201).json(
      result.rows[0]
    );
  }
);

router.delete(
  "/members/:id",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    await query(
      `DELETE FROM members
       WHERE id=$1`,
      [String(req.params.id)]
    );

    await writeAuditLog(
      req.adminId,
      "member_deleted",
      "members",
      String(req.params.id)
    );

    return res.json({
      ok: true
    });
  }
);

/* ==========================================================================
   ANNOUNCEMENTS
   ========================================================================== */

router.get(
  "/announcements",
  async (_req, res) => {
    const result = await query(
      `SELECT
        id,
        title,
        description,
        date,
        image,
        priority,
        expires_at AS "expiresAt",
        created_at AS "createdAt"
       FROM announcements
       WHERE
        expires_at IS NULL
        OR expires_at >= CURRENT_DATE
       ORDER BY date DESC`
    );

    return res.json(
      result.rows
    );
  }
);

router.post(
  "/announcements",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    const eventDate =
      normalizeEventDate(
        req.body.date
      );

    if (!eventDate) {
      return res.status(400).json({
        message:
          "Invalid announcement date"
      });
    }

    const expiresAt =
      req.body.expiresAt
        ? normalizeEventDate(
            req.body.expiresAt
          )
        : null;

    const body = z
      .object({
        title: z.string(),
        description: z.string(),
        date: z.string(),
        image: z
          .string()
          .optional(),
        priority: z.string(),
        expiresAt: z
          .string()
          .nullable()
      })
      .parse({
        title: String(
          req.body.title || ""
        ),
        description:
          String(
            req.body.description ||
              ""
          ),
        date: eventDate,
        image:
          req.body.image
            ? String(
                req.body.image
              )
            : "",
        priority:
          String(
            req.body.priority ||
              "normal"
          ),
        expiresAt
      });

    const result = await query(
      `INSERT INTO announcements
        (
          title,
          description,
          date,
          image,
          priority,
          expires_at
        )
       VALUES
        ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        body.title,
        body.description,
        body.date,
        body.image || null,
        body.priority,
        body.expiresAt
      ]
    );

    await writeAuditLog(
      req.adminId,
      "announcement_created",
      "announcements",
      result.rows[0].id
    );

    return res.status(201).json(
      result.rows[0]
    );
  }
);

router.delete(
  "/announcements/:id",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    await query(
      `DELETE FROM announcements
       WHERE id=$1`,
      [String(req.params.id)]
    );

    await writeAuditLog(
      req.adminId,
      "announcement_deleted",
      "announcements",
      String(req.params.id)
    );

    return res.json({
      ok: true
    });
  }
);

/* ==========================================================================
   CONTACT MESSAGES
   ========================================================================== */

router.post(
  "/contact",
  async (req, res) => {
    const body = z
      .object({
        name: z
          .string()
          .min(2),
        contact: z
          .string()
          .min(3),
        message: z
          .string()
          .min(5)
          .max(5000)
      })
      .parse(req.body);

    const result = await query(
      `INSERT INTO contact_messages
        (
          name,
          contact,
          message
        )
       VALUES
        ($1,$2,$3)
       RETURNING
        id,
        name,
        contact,
        message,
        status,
        created_at AS "createdAt"`,
      [
        body.name,
        body.contact,
        body.message
      ]
    );

    return res.status(201).json(
      result.rows[0]
    );
  }
);

router.get(
  "/contact",
  requireAuth,
  async (_req, res) => {
    const result = await query(
      `SELECT
        id,
        name,
        contact,
        message,
        status,
        created_at AS "createdAt"
       FROM contact_messages
       ORDER BY created_at DESC`
    );

    return res.json(
      result.rows
    );
  }
);

router.put(
  "/contact/:id",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    const body = z
      .object({
        status: z.string()
      })
      .parse(req.body);

    const result = await query(
      `UPDATE contact_messages
       SET status=$1
       WHERE id=$2
       RETURNING
        id,
        name,
        contact,
        message,
        status,
        created_at AS "createdAt"`,
      [
        body.status,
        String(req.params.id)
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        message:
          "Contact message not found"
      });
    }

    return res.json(
      result.rows[0]
    );
  }
);

/* ==========================================================================
   HEALTH / DATABASE TEST
   ========================================================================== */

router.get(
  "/health",
  async (_req, res) => {
    try {
      const result = await query(
        `SELECT
          current_database() AS database,
          current_user AS user,
          now() AS time`
      );

      return res.json({
        ok: true,
        database:
          result.rows[0].database,
        user:
          result.rows[0].user,
        time:
          result.rows[0].time
      });
    } catch (error) {
      console.error(
        "Health check failed:",
        error
      );

      return res.status(500).json({
        ok: false,
        message:
          "Database connection failed"
      });
    }
  }
);

router.get(
  "/contact-messages",
  requireAuth,
  async (
    _req: Request,
    res: Response
  ) => {
    const result = await query(`
      SELECT
        id,
        name,
        contact,
        message,
        status,
        created_at AS "createdAt"
      FROM contact_messages
      ORDER BY created_at DESC
    `);

    return res.json(result.rows);
  }
);

router.patch(
  "/contact-messages/:id",
  requireAuth,
  async (
    req: Request,
    res: Response
  ) => {
    const id = String(req.params.id);
    const status = String(req.body?.status ?? "");

    const allowedStatuses = [
      "new",
      "read",
      "replied"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    const result = await query(
      `
      UPDATE contact_messages
      SET status = $1
      WHERE id = $2
      RETURNING
        id,
        name,
        contact,
        message,
        status,
        created_at AS "createdAt"
      `,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Message not found"
      });
    }

    return res.json(result.rows[0]);
  }
);

router.delete(
  "/contact-messages/:id",
  requireAuth,
  async (
    req: Request,
    res: Response
  ) => {
    const id = String(req.params.id);

    const result = await query(
      `
      DELETE FROM contact_messages
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Message not found"
      });
    }

    return res.json({
      success: true
    });
  }
);


/* ==========================================================================
   ERROR HANDLER
   ========================================================================== */

router.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(
      "API error:",
      error
    );

    if (
      error instanceof
      z.ZodError
    ) {
      return res.status(400).json({
        message:
          "Invalid request data",
        errors:
          error.errors
      });
    }

    if (
      error instanceof
      multer.MulterError
    ) {
      return res.status(400).json({
        message:
          error.code ===
          "LIMIT_FILE_SIZE"
            ? "File is too large"
            : error.message
      });
    }

    if (
      error instanceof Error
    ) {
      if (
        error.message.includes(
          "Only image and video"
        )
      ) {
        return res.status(400).json({
          message:
            error.message
        });
      }
    }

    return res.status(500).json({
      message:
        "Internal server error"
    });
  }
);

export default router;