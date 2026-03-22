import cors from "cors";
import "dotenv/config";
import express from "express";
import {
  generateStoryHandler,
  generateStoryStreamHandler,
} from "./controllers/storyController";

const app = express();

app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] 🛰️  ${req.method} ${req.url}`);
  console.log(`👉 Headers: ${req.headers['content-type']}`);
  if (req.method === 'POST') console.log(`📦 Body:`, req.body);
  next();
});

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Backend running");
});

console.log("✅ Registering Routes...");
app.post('/api/stories/generate', generateStoryHandler);
app.post('/api/stories/generate-stream', generateStoryStreamHandler);
console.log("🚀 Routes Active!");
app.post('/ping', (req, res) => {
  res.send('pong');
});
app.listen(5000, () => {
  console.log("Server running on port 5000");
});