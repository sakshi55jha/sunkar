# Sunkar Deployment Guide

This project deploys as two services:

- Frontend: Next.js app in `sunkar-frontend`
- Backend: Express API in `sunkar-backend`

Recommended simple setup:

- Frontend on Vercel
- Backend on Render, Railway, or any Node host
- PostgreSQL on Neon, Supabase, Render Postgres, or Railway Postgres

## Backend

Root directory:

```bash
sunkar-backend
```

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Required environment variables:

```bash
DATABASE_URL=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GOOGLE_APPLICATION_CREDENTIALS=
FRONTEND_URL=
```

Notes:

- `FRONTEND_URL` should be your deployed frontend URL, for example `https://your-app.vercel.app`.
- `GOOGLE_APPLICATION_CREDENTIALS` must point to the Google Cloud service account JSON file available inside the backend host.
- After setting `DATABASE_URL`, run Prisma migration/deploy on the backend host if your platform does not do it automatically.

```bash
npx prisma migrate deploy
```

## Frontend

Root directory:

```bash
sunkar-frontend
```

Build command:

```bash
npm run build
```

Required environment variables:

```bash
NEXT_PUBLIC_BACKEND_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

`NEXT_PUBLIC_BACKEND_URL` should be the deployed backend URL, for example:

```bash
https://sunkar-api.onrender.com
```

## Clerk Redirect URLs

Add these URLs in Clerk after deployment:

```bash
https://your-frontend-domain.com/sign-in
https://your-frontend-domain.com/sign-up-listener
https://your-frontend-domain.com/sign-up-creator
https://your-frontend-domain.com/sso-callback
https://your-frontend-domain.com/auth-redirect
```

## Verification

Run locally before deploy:

```bash
cd sunkar-backend
npm run build

cd ../sunkar-frontend
npm run lint
npm run build
```
