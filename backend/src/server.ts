import "dotenv/config";

import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import routes from "./routes.js";
import { security, apiLimiter } from "./middleware/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 4000);

const frontendDist = path.resolve(
  __dirname,
  "../../frontend/dist"
);

const frontendIndex = path.join(
  frontendDist,
  "index.html"
);

const origin = process.env.FRONTEND_ORIGIN;

app.use(security);

if (origin) {
  app.use(
    cors({
      origin,
      credentials: true,
    })
  );
}

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(cookieParser());

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || "./uploads"
);

app.use(
  "/uploads",
  express.static(uploadDir, {
    maxAge: "7d",
  })
);

/* API */
app.use("/api", apiLimiter);

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

/* HEALTH */
app.get(
  "/health",
  (_req: Request, res: Response) => {
    return res.json({
      ok: true,
      service: "hya-jaklair",
      mode: process.env.VERCEL
        ? "vercel"
        : "single-service",
    });
  }
);

/* Static frontend for local/Render */
if (fs.existsSync(frontendDist)) {
  app.use(
    express.static(frontendDist, {
      index: "index.html",
      fallthrough: true,
    })
  );
}

function serveReactApp(
  _req: Request,
  res: Response
) {
  if (!fs.existsSync(frontendIndex)) {
    return res.status(503).send(
      "Frontend build is missing. Run npm run build first."
    );
  }

  return res.sendFile(frontendIndex);
}

app.get(
  [
    "/admin",
    "/admin/login",
    "/admin/signup",
    "/admin/messages",
  ],
  serveReactApp
);

app.get(
  "/{*splat}",
  serveReactApp
);

/* Error handler */
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

/*
 * Render/local: start a normal HTTP server.
 * Vercel: export the Express app to the serverless runtime.
 */
if (!process.env.VERCEL) {
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
        `API test: http://localhost:${port}/api/test`
      );
      console.log(
        `Hero video: http://localhost:${port}/api/hero-video`
      );
    }
  );
}

export default app;
