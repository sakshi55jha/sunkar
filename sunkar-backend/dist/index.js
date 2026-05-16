import cors from "cors";
import "dotenv/config";
import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { generateStoryHandler, generateStoryStreamHandler, getHistoryHandler, clearSessionHandler, loadSessionHandler, } from "./controllers/storyController";
import { submitStoryHandler, getCreatorStoriesHandler, getStoryByIdHandler, togglePublishHandler, getPublicStoriesHandler, deleteStoryHandler, retryStoryHandler, getUploadSignatureHandler, } from "./controllers/creatorController";
import { syncUserHandler } from "./controllers/userController";
const PORT = Number(process.env.PORT) || 5000;
const GLOBAL_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const STORY_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const BURST_LIMIT_WINDOW_MS = 10 * 1000;
const getRateLimitKey = (req, res) => {
    return req.body?.userId ? String(req.body.userId) : ipKeyGenerator(req.ip ?? "unknown");
};
const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL || true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🛰️  ${req.method} ${req.url}`);
    console.log(`👉 Headers: ${req.headers['content-type']}`);
    if (req.method === 'POST') {
        console.log(`📦 Body:`, req.body);
    }
    next();
});
const globalLimiter = rateLimit({
    windowMs: GLOBAL_LIMIT_WINDOW_MS,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateLimitKey,
    handler: (req, res) => {
        console.warn(`⚠️  Global rate limit hit by: ${getRateLimitKey(req, res)}`);
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
    handler: (req, res) => {
        console.warn(`🚫 Story rate limit hit by: ${getRateLimitKey(req, res)}`);
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
    handler: (req, res) => {
        console.warn(`⚡ Burst rate limit hit by: ${getRateLimitKey(req, res)}`);
        res.status(429).json({
            error: "Slow down! Wait a few seconds before generating another story.",
            retryAfter: Math.ceil(BURST_LIMIT_WINDOW_MS / 1000),
        });
    },
});
app.use(globalLimiter);
app.get("/", (_req, res) => {
    res.send("Backend running");
});
app.get("/api/stories/history", getHistoryHandler);
app.post("/api/stories/generate", burstLimiter, storyLimiter, generateStoryHandler);
app.post("/api/stories/generate-stream", burstLimiter, storyLimiter, generateStoryStreamHandler);
app.post("/api/stories/clear-session", clearSessionHandler);
app.post("/api/stories/load-session", loadSessionHandler);
app.get("/api/creator/upload-signature", getUploadSignatureHandler);
app.post("/api/creator/submit", submitStoryHandler);
app.get("/api/creator/stories", getCreatorStoriesHandler);
app.get("/api/creator/stories/:id", getStoryByIdHandler);
app.patch("/api/creator/stories/:id/publish", togglePublishHandler);
app.delete("/api/creator/stories/:id", deleteStoryHandler);
app.post("/api/creator/stories/:id/retry", retryStoryHandler);
import { toggleLibraryHandler, getLibraryHandler } from "./controllers/libraryController";
app.get("/api/stories/public", getPublicStoriesHandler);
app.post("/api/users/sync", syncUserHandler);
app.post("/api/library/toggle", toggleLibraryHandler);
app.get("/api/library/:userId", getLibraryHandler);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map