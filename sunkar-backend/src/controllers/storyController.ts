import type { Request, Response } from "express";
import prisma from "../prisma";
import { executeSunkarPipelineStream } from "../services/aiService";

/**
 * 1. NORMAL HANDLER (NON-STREAMING)
 * Used when you want the full JSON response at once.
 */

export async function generateStoryHandler(req: Request, res: Response) {
  try {
    const { prompt, userId } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({ error: "prompt & userId required" });
    }

    // Ensure User exists in DB
    await prisma.user.upsert({
      where: { id: String(userId) },
      update: {},
      create: { id: String(userId) },
    });

    let fullText = "";
    let storyIdFromAI = "";

    // --- THE FIX: We must loop through the generator to "collect" the full string ---
    for await (const chunk of executeSunkarPipelineStream(prompt)) {
      if (chunk.type === "text") {
        fullText += chunk.data;
      }
      if (chunk.type === "complete") {
        storyIdFromAI = chunk.data.storyId;
      }
    }

    // Extract a simple title from the first line or use a fallback
    const titleLine = fullText.split('\n')[0].replace(/\*/g, '').trim();
    const finalTitle = titleLine.length < 50 ? titleLine : "A New Confession";

    // Now we have the FULL text, we can save to Prisma
    const story = await prisma.story.create({
      data: {
        originalPrompt: prompt,
        generatedTitle: finalTitle,
        generatedStory: fullText,
        userId: String(userId),
      },
    });

    res.json({ storyId: story.id, title: finalTitle, text: fullText });
  } catch (err: any) {
    console.error("❌ Error in generateStoryHandler:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * 2. STREAMING HANDLER
 * Used for the ChatGPT-style typing effect in the frontend.
 */
export async function generateStoryStreamHandler(req: Request, res: Response): Promise<void> {
  console.log("🏁 Handler Started: generateStoryStreamHandler");
  try {
    const { prompt, userId } = req.body;

    if (!prompt || !userId) {
      res.status(400).json({ error: "Missing prompt or userId" });
      return;
    }

    await prisma.user.upsert({
      where: { id: String(userId) },
      update: {},
      create: { id: String(userId) }
    });

    // --- PRODUCTION HEADERS ---
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Prevents proxy buffering

    let fullTextForDB = "";

    // Stream to the frontend AND collect for the database simultaneously
    for await (const chunk of executeSunkarPipelineStream(prompt)) {
      if (chunk.type === 'text') {
        fullTextForDB += chunk.data;
      }
      
      // Write to the HTTP response stream
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    // --- THE FIX: Save to DB after the stream finishes ---
    const titleLine = fullTextForDB.split('\n')[0].replace(/\*/g, '').trim();
    
    await prisma.story.create({
      data: {
        originalPrompt: prompt,
        generatedTitle: titleLine || "Streamed Story",
        generatedStory: fullTextForDB,
        userId: String(userId),
      },
    });

    console.log("💾 Story successfully saved to database.");
    res.end();
  } catch (err) {
    console.error("🔥 CRASH IN STREAM HANDLER:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export async function getHistoryHandler(req: Request, res: Response){
  try{
  const {userId} = req.query;

  if(!userId){
    return res.status(400).json({
      error: "userID is Required"
    });

    const stories = await prisma.story.findMany({
      where : {userId: String(userId)},
      orderBy: {createdAt: "desc"},
      select: {
        id: true,
        generatedTitle: true
      }
    })
    res.json(stories);
  }

  }catch(err:any){
  console.error("History Fetch Error",err);
  res.status(500).json({error: "could not fetch History"});
  }
}