// ── Imports ─────────────────────────────────────────
import cors from "cors";
import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import {
  generateStoryHandler,
  generateStoryStreamHandler,
  getHistoryHandler,
  clearSessionHandler,
  loadSessionHandler,
} from "./controllers/storyController";

// ── Constants ─────────────────────────────────────────
const PORT = 5000;
const GLOBAL_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const STORY_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const BURST_LIMIT_WINDOW_MS = 10 * 1000;

// ── Helpers / Utils ─────────────────────────────────────────

// Extracts the reliable user identifier for rate limiting
const getRateLimitKey = (req: Request, res: Response): string => {
  return req.body?.userId ?? ipKeyGenerator(req, res) ?? "unknown";
};

// ── Middlewares ─────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] 🛰️  ${req.method} ${req.url}`);
  console.log(`👉 Headers: ${req.headers['content-type']}`);

  if (req.method === 'POST') {
    console.log(`📦 Body:`, req.body);
  }

  next();
});

// ── Rate Limiters ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: GLOBAL_LIMIT_WINDOW_MS,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  handler: (req: Request, res: Response) => {
    console.warn(`⚠️  Global rate limit hit by: ${getRateLimitKey(req)}`);
    res.status(429).json({
      error: "Too many requests. Please slow down and try again in a few minutes.",
      retryAfter: Math.ceil(GLOBAL_LIMIT_WINDOW_MS / 1000),
    });
  },
});

const storyLimiter = rateLimit({
  windowMs: STORY_LIMIT_WINDOW_MS,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  handler: (req: Request, res: Response) => {
    console.warn(`🚫 Story rate limit hit by: ${getRateLimitKey(req)}`);
    res.status(429).json({
      error: "You've generated a lot of stories! Take a break and come back in an hour.",
      retryAfter: Math.ceil(STORY_LIMIT_WINDOW_MS / 1000),
    });
  },
});

const burstLimiter = rateLimit({
  windowMs: BURST_LIMIT_WINDOW_MS,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  handler: (req: Request, res: Response) => {
    console.warn(`⚡ Burst rate limit hit by: ${getRateLimitKey(req)}`);
    res.status(429).json({
      error: "Slow down! Wait a few seconds before generating another story.",
      retryAfter: Math.ceil(BURST_LIMIT_WINDOW_MS / 1000),
    });
  },
});

app.use(globalLimiter);

// ── Routes ─────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.send("Backend running");
});

app.get("/api/stories/history", getHistoryHandler);

app.post(
  "/api/stories/generate",
  burstLimiter,
  storyLimiter,
  generateStoryHandler
);

app.post(
  "/api/stories/generate-stream",
  burstLimiter,
  storyLimiter,
  generateStoryStreamHandler
);

app.post("/api/stories/clear-session", clearSessionHandler);
app.post("/api/stories/load-session", loadSessionHandler);

// ── Server Start ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});