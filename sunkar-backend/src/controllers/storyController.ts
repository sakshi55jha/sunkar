import type { Request, Response } from "express";
import prisma from "../prisma";
import {
  executeSunkarPipeline,
  executeSunkarPipelineStream,
} from "../services/aiService";

export async function generateStoryHandler(req: Request, res: Response) {
  try {
    const { prompt, userId } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({ error: "prompt & userId required" });
    }

    await prisma.user.upsert({
      where: { id: String(userId) },
      update: {},
      create: { id: String(userId) },
    });

    const { title, text } = await executeSunkarPipeline(prompt);

    const story = await prisma.story.create({
      data: {
        originalPrompt: prompt,
        generatedTitle: title,
        generatedStory: text,
        userId: String(userId),
      },
    });

    res.json({ storyId: story.id, title, text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// STREAMING (FIXED)
export async function generateStoryStreamHandler(req: Request, res: Response): Promise<void> {
    console.log("🏁 Handler Started: generateStoryStreamHandler");
    try {
        const { prompt, userId } = req.body;
        console.log(`📝 Data Received - User: ${userId}, Prompt: ${prompt?.substring(0, 20)}...`);

        if (!prompt || !userId) {
            console.log("❌ Missing fields: prompt or userId");
            res.status(400).json({ error: "Missing prompt or userId" });
            return;
        }

        console.log("🔍 Checking/Upserting User in DB...");
        await prisma.user.upsert({
            where: { id: String(userId) },
            update: {},
            create: { id: String(userId) }
        });
        console.log("✅ User ready.");

        // SSE Setup
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        console.log("📡 SSE Headers Set. Starting AI Stream...");

        for await (const chunk of executeSunkarPipelineStream(prompt)) {
            console.log(`✨ AI Chunk Received: ${chunk.type}`);
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        console.log("🏁 Stream Finished Successfully.");
        res.end();
    } catch (err) {
        console.error("🔥 CRASH IN STREAM HANDLER:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Crash" });
        }
    }
}