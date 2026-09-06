import "dotenv/config";

import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes.js";
import { security, apiLimiter } from "./middleware/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 4000);

/*
 * One-service architecture:
 *
 *   backend/dist/server.js
 *          |
 *          +--> frontend/dist
 *          +--> /api/*
 *          +--> /uploads/*
 *          +--> /health
 *
 * The browser uses only:
 *
 *   http://localhost:4000
 */
const frontendDist = path.resolve(
  __dirname,
  "../../frontend/dist"
);

const frontendIndex = path.join(
  frontendDist,
  "index.html"
);

const origin = process.env.FRONTEND_ORIGIN;

/* ==========================================================================
   SECURITY
   ========================================================================== */

app.use(security);

if (origin) {
  app.use(
    cors({
      origin,
      credentials: true,
    })
  );
}

/* ==========================================================================
   BODY / COOKIE
   ========================================================================== */

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(cookieParser());

/* ==========================================================================
   UPLOADS
   ========================================================================== */

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || "./uploads"
);

app.use(
  "/uploads",
  express.static(uploadDir, {
    maxAge: "7d",
  })
);

/* ==========================================================================
   API
   ========================================================================== */

/*
 * Keep API routes BEFORE the React fallback.
 *
 * Includes:
 *   /api/auth/login
 *   /api/auth/logout
 *   /api/auth/me
 *   /api/site
 *   /api/events
 *   /api/media
 *   /api/contact
 *   /api/hero-video
 */
// Keep the rate limiter scoped to API requests only.
app.use("/api", apiLimiter);

// Simple deployment diagnostic.
app.get(
  "/api/test",
  (_req: Request, res: Response) => {
    return res.json({
      ok: true,
      message: "API is working",
      service: "hya-jaklair",
    });
  }
);

app.use("/api", routes);

/* ==========================================================================
   HEALTH
   ========================================================================== */

/*
 * Simple deployment diagnostic.
 * If /api/test returns JSON, Express and the /api mount are working.
 */
app.get(
  "/api/test",
  (_req: Request, res: Response) => {
    return res.json({
      ok: true,
      message: "API is working",
      service: "hya-jaklair",
    });
  }
);

/* ==========================================================================
   HEALTH
   ========================================================================== */

app.get(
  "/health",
  (_req: Request, res: Response) => {
    return res.json({
      ok: true,
      service: "hya-jaklair",
      mode: "single-service",
    });
  }
);

/* ==========================================================================
   FRONTEND STATIC FILES
   ========================================================================== */

app.use(
  express.static(frontendDist, {
    index: "index.html",
    fallthrough: true,
  })
);

/* ==========================================================================
   REACT SPA FALLBACK
   ========================================================================== */

/*
 * React Router owns these browser URLs:
 *
 *   /
 *   /admin
 *   /admin/login
 *   /admin/signup
 *   /admin/messages
 *
 * Express must return frontend/dist/index.html.
 *
 * React then reads window.location and React Router renders
 * the correct page.
 */
function serveReactApp(
  _req: Request,
  res: Response
) {
  return res.sendFile(
    frontendIndex,
    (error) => {
      if (error && !res.headersSent) {
        console.error(
          "Failed to serve React application:",
          error
        );

        return res.status(503).json({
          message:
            "Frontend build is unavailable. Run npm run build first.",
        });
      }
    }
  );
}

/*
 * Explicit admin routes.
 *
 * This makes direct navigation to /admin/login work on
 * the same Express server.
 */
app.get(
  [
    "/admin",
    "/admin/login",
    "/admin/signup",
    "/admin/messages",
  ],
  serveReactApp
);

/*
 * General React Router fallback.
 *
 * This MUST be after /api, /uploads, /health and static files.
 *
 * Express 5 syntax:
 *   /{*splat}
 */
app.get(
  "/{*splat}",
  serveReactApp
);

/* ==========================================================================
   ERROR HANDLER
   ========================================================================== */

app.use(
  (
    error: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error("Server error:", error);

    if (res.headersSent) {
      return;
    }

    return res.status(
      Number(error?.status) || 400
    ).json({
      message:
        error?.message ||
        "Request failed",
    });
  }
);

/* ==========================================================================
   START
   ========================================================================== */

app.listen(
  port,
  "0.0.0.0",
  () => {
    console.log(
      `HYA JAKLAIR running on http://localhost:${port}`
    );
    console.log(
      `Frontend: ${frontendDist}`
    );
    console.log(
      `Admin login: http://localhost:${port}/admin/login`
    );
    console.log(
      `Admin dashboard: http://localhost:${port}/admin`
    );
    console.log(
      `Hero video: http://localhost:${port}/api/hero-video`
    );
  }
);
