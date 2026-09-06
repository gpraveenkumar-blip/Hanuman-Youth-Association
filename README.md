# HYA JAKLAIR — 3D Community Platform

A full-stack 3D community platform built with a React/Three.js frontend and a Node.js/Express backend.

## Production architecture

This project is configured for **one Render Web Service**.

```text
                    ONE RENDER SERVICE
                           |
                    Node + Express
                     /           \
                    /             \
          React/Three.js          REST API
          frontend/dist            /api/*
                    \             /
                     \           /
                       Browser
                           |
                       PostgreSQL
```

The production server serves the compiled React application and the Express API from the **same process and same domain**.

Examples:

```text
https://your-service.onrender.com/          -> React application
https://your-service.onrender.com/login     -> React route
https://your-service.onrender.com/api/...   -> Express API
https://your-service.onrender.com/health    -> health check
```

You do **not** need separate frontend and backend Render services for this configuration.

---

## Project structure

```text
.
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/
│   ├── src/
│   ├── package.json
│   └── ...
├── package.json
├── render.yaml
├── .env.example
└── .gitignore
```

The `frontend/` and `backend/` folders remain separate because they are separate codebases. They are **not separate production servers**.

---

# Deploy to Render — ONE SERVICE

## 1. Push this repository to GitHub

Push the complete repository, including:

- `frontend/`
- `backend/`
- root `package.json`
- `render.yaml`
- `.gitignore`

Do **not** push `.env` files or real secrets.

## 2. Create one Render Web Service

In Render:

**New → Web Service → connect your GitHub repository**

Use:

| Setting | Value |
|---|---|
| Runtime | Node |
| Root Directory | leave empty |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| Plan | Free, if available |

The repository root is intentional. Do not set Root Directory to `frontend` or `backend`.

## 3. Environment variables

Add your production values in Render.

Required:

```text
NODE_ENV=production
DATABASE_URL=<your PostgreSQL connection string>
JWT_SECRET=<strong random secret>
```

Depending on your backend configuration, also add the variables documented in `backend/.env.example`.

Never commit the real `.env` file.

## 4. Deploy

Render runs:

```bash
npm run build
```

The root build command installs/builds both applications:

```text
frontend
  -> npm install
  -> npm run build
  -> frontend/dist

backend
  -> npm install
  -> npm run build
  -> backend/dist
```

Then Render starts:

```bash
npm start
```

That starts **one Express process**.

Express serves:

```text
frontend/dist
```

and also handles:

```text
/api/*
```

Therefore production has:

```text
ONE service
ONE Node process
ONE public URL
ONE browser origin
```

---

# Local production test

From the repository root:

```bash
npm install
npm run build
npm start
```

Then open:

```text
http://localhost:4000
```

You should see the React/Three.js application.

You do **not** need to run Vite in another terminal for this production test.

### Development mode

For frontend hot reload, development can still use two processes:

```text
Terminal 1:
cd frontend
npm run dev

Terminal 2:
cd backend
npm run dev
```

That is only a development workflow. It does **not** mean the deployed application requires two servers.

---

# API and frontend

The production frontend uses same-origin API paths:

```text
/api/...
```

Do not configure the production frontend to call:

```text
http://localhost:4000
```

For a single-service deployment, no separate `VITE_API_URL` is required.

If you later split the frontend and backend into different domains, then configure the frontend API URL and CORS accordingly.

---

# Database

The backend requires PostgreSQL.

Use a production PostgreSQL provider and set:

```text
DATABASE_URL
```

in Render.

Do not store database passwords in GitHub.

Also rotate any credentials that were previously exposed in development files.

---

# Health check

The server provides:

```text
GET /health
```

Render should use:

```text
/health
```

as the health check path.

---

# Security

Before production:

- Use a strong production `JWT_SECRET`.
- Keep `.env` out of Git.
- Use HTTPS through Render.
- Rotate any credentials that were previously exposed.
- Use a production PostgreSQL database.
- Do not enable development/demo authentication in production.
- Review CORS and cookie settings before using a custom domain.

---

# Final production flow

```text
User
  |
  v
https://your-service.onrender.com
  |
  +--> React + Three.js UI
  |
  +--> /api/* -> Express
                   |
                   v
              PostgreSQL
```

The user only sees and uses **one website URL**.

