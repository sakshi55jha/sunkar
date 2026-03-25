import type { Request, Response } from "express";
import prisma from "../prisma";
import { executeSunkarPipelineStream, clearSession } from "../services/aiService";

/**
 * 1. GET HISTORY HANDLER
 * Fills the Sidebar with stories from the DB.
 */
export async function getHistoryHandler(req: Request, res: Response) {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const stories = await prisma.story.findMany({
      where: { userId: String(userId) },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        generatedTitle: true,
      },
    });

    return res.json(stories);
  } catch (err: any) {
    console.error("History Fetch Error", err);
    return res.status(500).json({ error: "could not fetch History" });
  }
}

/**
 * 2. STREAMING HANDLER
 * Handles the AI generation with session-based memory and saves to DB.
 */
export async function generateStoryStreamHandler(req: Request, res: Response): Promise<void> {
  console.log("🏁 Handler Started: generateStoryStreamHandler");
  try {
    // ← sessionId comes from frontend now instead of history array
    const { prompt, userId, sessionId } = req.body;

    if (!prompt || !userId) {
      res.status(400).json({ error: "Missing prompt or userId" });
      return;
    }

    // Use userId as fallback sessionId if frontend didn't send one
    const activeSessionId = sessionId || String(userId);

    // Ensure User exists
    await prisma.user.upsert({
      where: { id: String(userId) },
      update: {},
      create: { id: String(userId) }
    });

    // SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let fullTextForDB = "";

    // ← Pass sessionId instead of history array
    for await (const chunk of executeSunkarPipelineStream(prompt, activeSessionId)) {
      if (chunk.type === 'text') {
        fullTextForDB += chunk.data;
      }
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    // Extract Title for DB
    const titleMatch = fullTextForDB.match(/\[TITLE\]\s*\n(.+)/);
    const titleLine = titleMatch
      ? titleMatch[1].trim()
      : fullTextForDB.split('\n')[0].replace(/\[TITLE\]|\*/g, '').trim();

    // Save to Database
    await prisma.story.create({
      data: {
        originalPrompt: prompt,
        generatedTitle: titleLine || "A New Story",
        generatedStory: fullTextForDB,
        userId: String(userId),
      },
    });

    console.log("💾 Story successfully saved to database.");
    res.end();
  } catch (err) {
    console.error("🔥 CRASH IN STREAM HANDLER:", err);
    if (!res.headersSent) res.end();
  }
}

/**
 * 3. NORMAL HANDLER (NON-STREAMING)
 */
export async function generateStoryHandler(req: Request, res: Response) {
  try {
    const { prompt, userId, sessionId } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({ error: "prompt & userId required" });
    }

    const activeSessionId = sessionId || String(userId);

    await prisma.user.upsert({
      where: { id: String(userId) },
      update: {},
      create: { id: String(userId) },
    });

    let fullText = "";
    for await (const chunk of executeSunkarPipelineStream(prompt, activeSessionId)) {
      if (chunk.type === "text") fullText += chunk.data;
    }

    const titleMatch = fullText.match(/\[TITLE\]\s*\n(.+)/);
    const titleLine = titleMatch
      ? titleMatch[1].trim()
      : fullText.split('\n')[0].replace(/\*/g, '').trim();

    const story = await prisma.story.create({
      data: {
        originalPrompt: prompt,
        generatedTitle: titleLine || "A New Story",
        generatedStory: fullText,
        userId: String(userId),
      },
    });

    res.json({ storyId: story.id, title: story.generatedTitle, text: fullText });
  } catch (err: any) {
    console.error("❌ Error in generateStoryHandler:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * 4. CLEAR SESSION HANDLER
 * Call this when user clicks "New Story" or "Start Fresh" on the frontend.
 */
export async function clearSessionHandler(req: Request, res: Response) {
  try {
    const { sessionId, userId } = req.body;
    const activeSessionId = sessionId || String(userId);

    clearSession(activeSessionId);
    console.log(`🧹 Session cleared: ${activeSessionId}`);
    
    return res.json({ success: true, message: "Session cleared" });
  } catch (err: any) {
    console.error("❌ Error clearing session:", err);
    return res.status(500).json({ error: err.message });
  }
}

export const loadSessionHandler = (req: Request, res: Response) => {
  const { sessionId, messages } = req.body;
  if (!sessionId || !messages) {
    return res.status(400).json({ error: "sessionId and messages required" });
  }

  // Rebuild backend memory from the messages array sent by frontend
  // Clear existing and re-add each message pair
  clearSession(sessionId);

  messages.forEach((msg: { role: string; content: string }) => {
    addToHistory(
      sessionId,
      msg.role as "user" | "model",
      msg.content
    );
  });

  res.json({ success: true });
};