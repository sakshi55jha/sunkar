# Sunkar

Sunkar is an AI-powered audio storytelling platform where creators can write or submit stories, enhance them with AI, convert them into natural-sounding narrated audio, publish them, and let listeners discover and save stories to their personal library.

The project is built as a full-stack web application with a Next.js frontend, an Express backend, Prisma/PostgreSQL database, Clerk authentication, Gemini AI generation, Google Cloud Text-to-Speech, and Cloudinary media storage.

## What It Does

Sunkar supports two main user journeys:

- Creators can write stories, generate AI audio, upload cover images, publish or unpublish stories, retry failed audio jobs, and manage their story dashboard.
- Listeners can discover published audio stories, open immersive story pages, play audio, and save stories to their library.

It also includes a Sunkar GPT-style story creation experience where users can generate and continue stories through a streaming AI chat interface.

## Features

- Role-based authentication with Clerk
- Listener and creator flows
- AI story generation with streaming responses
- Session-based story chat memory
- Creator story submission
- Optional AI story enhancement before narration
- Google Cloud Text-to-Speech audio generation
- Cloudinary cover image and audio storage
- Publish and unpublish controls
- Retry flow for failed audio generation
- Public story discovery page
- Saved listener library
- Custom audio player with seek, skip, volume, and save controls
- Prisma schema with users, generated stories, creator stories, and saved stories
- Deployment-ready frontend and backend build scripts

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Clerk
- Lucide React

### Backend

- Node.js
- Express 5
- TypeScript
- Prisma 7
- PostgreSQL
- Gemini API
- Google Cloud Text-to-Speech
- Cloudinary
- Express Rate Limit

## Project Structure

```bash
sunkar/
|-- sunkar-frontend/        # Next.js app
|   |-- app/                # App Router pages and components
|   |-- public/             # Static assets
|   `-- package.json
|-- sunkar-backend/         # Express API
|   |-- prisma/             # Prisma schema and migrations
|   |-- src/
|   |   |-- controllers/    # Route handlers
|   |   |-- services/       # AI, audio, image services
|   |   |-- index.ts        # API entry point
|   |   `-- prisma.ts       # Prisma client setup
|   `-- package.json
|-- DEPLOYMENT.md
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Clerk application
- Gemini API key
- Cloudinary account
- Google Cloud project with Text-to-Speech enabled

## Environment Variables

Create environment files from the examples:

```bash
cp sunkar-backend/.env.example sunkar-backend/.env
cp sunkar-frontend/.env.example sunkar-frontend/.env
```

### Backend `.env`

```bash
DATABASE_URL=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GOOGLE_APPLICATION_CREDENTIALS=
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### Frontend `.env`

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

## Local Development

Install dependencies:

```bash
cd sunkar-backend
npm install

cd ../sunkar-frontend
npm install
```

Generate Prisma client and apply database migrations:

```bash
cd sunkar-backend
npx prisma generate
npx prisma migrate deploy
```

Start the backend:

```bash
cd sunkar-backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd sunkar-frontend
npm run dev
```

Open the app:

```bash
http://localhost:3000
```

Backend runs on:

```bash
http://localhost:5000
```

## Available Scripts

### Backend

```bash
npm run dev       # Start Express API in watch mode
npm run build     # Generate Prisma client and compile TypeScript
npm start         # Run compiled backend from dist/
```

### Frontend

```bash
npm run dev       # Start Next.js dev server
npm run build     # Create production build
npm start         # Start production Next.js server
npm run lint      # Run ESLint
```

## API Overview

### Story Generation

```bash
GET  /api/stories/history
POST /api/stories/generate
POST /api/stories/generate-stream
POST /api/stories/clear-session
POST /api/stories/load-session
```

### Creator Stories

```bash
GET    /api/creator/upload-signature
POST   /api/creator/submit
GET    /api/creator/stories
GET    /api/creator/stories/:id
PATCH  /api/creator/stories/:id/publish
DELETE /api/creator/stories/:id
POST   /api/creator/stories/:id/retry
```

### Public and Library

```bash
GET  /api/stories/public
POST /api/library/toggle
GET  /api/library/:userId
```

### Users

```bash
POST /api/users/sync
```

## Database Models

The Prisma schema includes:

- `User`: Stores Clerk-linked user profile and role.
- `Story`: Stores AI-generated story chat outputs.
- `CreatorStory`: Stores creator-submitted stories, audio, cover image, status, and publish state.
- `SavedStory`: Stores listener-saved creator stories.

## Deployment

Recommended deployment:

- Frontend: Vercel
- Backend: Render or Railway
- Database: Neon, Supabase, Railway Postgres, or Render Postgres
- Media: Cloudinary

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment steps and required environment variables.

## Verification

Before deploying, run:

```bash
cd sunkar-backend
npm run build

cd ../sunkar-frontend
npm run lint
npm run build
```

Current status:

- Backend build passes
- Frontend production build passes
- Frontend lint passes with warnings

## Known Improvements

These are good next steps before treating Sunkar as production-grade:

- Verify Clerk auth tokens on the backend instead of trusting client-sent `userId`
- Add API validation with Zod
- Move background audio generation to a queue
- Add tests for submit, publish, delete, retry, and library flows
- Replace remaining `<img>` tags with `next/image`
- Clean remaining lint warnings
- Add analytics for story plays and saves
- Add search, tags, and categories on the discovery page

## License

This project is currently private. Add a license before publishing it as open source.
