import cors from "cors";
import "dotenv/config";
import express from "express";
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

app.get("/", (_, res) => {
  res.send("Backend running");
});

console.log("✅ Registering Routes...");
app.get("/api/stories/history", getHistoryHandler); 

app.post('/api/stories/generate', generateStoryHandler);
app.post('/api/stories/generate-stream', generateStoryStreamHandler);
app.post("/api/stories/clear-session", clearSessionHandler);
app.post("/api/stories/load-session", loadSessionHandler);


app.listen(5000, () => {
  console.log("Server running on port 5000");
});