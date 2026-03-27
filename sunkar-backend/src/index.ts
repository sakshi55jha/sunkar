import cors from "cors";
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";

import {
  generateStoryHandler,
  generateStoryStreamHandler,
  getHistoryHandler,
  clearSessionHandler,
  loadSessionHandler,
    
} from "./controllers/storyController";

const app = express();

// 1. FIRST: Enable CORS and the JSON Parser
app.use(cors());
app.use(express.json()); // <--- MOVED THIS UP! This opens the "box"
app.use(express.urlencoded({ extended: true }));

// 2. SECOND: Your Logger (Now it will actually see the Body!)
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] 🛰️  ${req.method} ${req.url}`);
  console.log(`👉 Headers: ${req.headers['content-type']}`);
  if (req.method === 'POST') {
    console.log(`📦 Body:`, req.body); // This will no longer be undefined
  }
  next();
});

// 1. Global limiter — applies to ALL routes
// Protects against general abuse / bots
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // max 100 requests per IP per 15 min
  standardHeaders: true,      // sends RateLimit headers in response
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use userId from body if available, else fall back to IP
    return req.body?.userId || req.ip || "unknown";
  },
  handler: (req, res) => {
    console.warn(`⚠️  Global rate limit hit by: ${req.body?.userId || req.ip}`);
    res.status(429).json({
      error: "Too many requests. Please slow down and try again in a few minutes.",
      retryAfter: Math.ceil(15 * 60),  // seconds
    });
  },
});
 
// 2. Story generation limiter — applies only to AI generation routes
// Stricter because these calls cost Gemini API credits
const storyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour window
  max: 30,                    // max 30 story generations per user per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.userId || req.ip || "unknown";
  },
  handler: (req, res) => {
    console.warn(`🚫 Story rate limit hit by: ${req.body?.userId || req.ip}`);
    res.status(429).json({
      error: "You've generated a lot of stories! Take a break and come back in an hour.",
      retryAfter: Math.ceil(60 * 60),  // seconds
    });
  },
});
 
// 3. Burst limiter — prevents rapid-fire requests
// Stops users from hammering the generate button repeatedly
const burstLimiter = rateLimit({
  windowMs: 10 * 1000,  // 10 second window
  max: 3,               // max 3 requests per 10 seconds
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.userId || req.ip || "unknown";
  },
  handler: (req, res) => {
    console.warn(`⚡ Burst rate limit hit by: ${req.body?.userId || req.ip}`);
    res.status(429).json({
      error: "Slow down! Wait a few seconds before generating another story.",
      retryAfter: 10,
    });
  },
});
 
// ─────────────────────────────────────────
// APPLY GLOBAL LIMITER TO ALL ROUTES
// ─────────────────────────────────────────
app.use(globalLimiter);


app.get("/", (_, res) => {
  res.send("Backend running");
});

console.log("✅ Registering Routes...");
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


app.listen(5000, () => {
  console.log("Server running on port 5000");
});