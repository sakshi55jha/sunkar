import prisma from "../prisma";
import { executeSunkarPipelineStream, clearSession, addToHistory } from "../services/aiService";
export async function getHistoryHandler(req, res) {
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
    }
    catch (err) {
        console.error("History Fetch Error", err);
        return res.status(500).json({ error: "could not fetch History" });
    }
}
export async function generateStoryStreamHandler(req, res) {
    console.log("Handler Started: generateStoryStreamHandler");
    try {
        const { prompt, userId, sessionId } = req.body;
        if (!prompt || !userId) {
            res.status(400).json({ error: "Missing prompt or userId" });
            return;
        }
        const activeSessionId = sessionId || String(userId);
        await prisma.user.upsert({
            where: { id: String(userId) },
            update: {},
            create: { id: String(userId) }
        });
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        let fullTextForDB = "";
        for await (const chunk of executeSunkarPipelineStream(prompt, activeSessionId)) {
            if (chunk.type === 'text') {
                fullTextForDB += chunk.data;
            }
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        const titleMatch = fullTextForDB.match(/\[TITLE\]\s*\n(.+)/);
        const titleLine = titleMatch
            ? (titleMatch[1] ?? "").trim()
            : (fullTextForDB.split('\n')[0] ?? "").replace(/\[TITLE\]|\*/g, '').trim();
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
    }
    catch (err) {
        console.error("🔥 CRASH IN STREAM HANDLER:", err);
        if (!res.headersSent)
            res.end();
    }
}
export async function generateStoryHandler(req, res) {
    try {
        const { prompt, userId, sessionId } = req.body;
        if (!prompt || !userId) {
            res.status(400).json({ error: "prompt & userId required" });
            return;
        }
        const activeSessionId = sessionId || String(userId);
        await prisma.user.upsert({
            where: { id: String(userId) },
            update: {},
            create: { id: String(userId) },
        });
        let fullText = "";
        for await (const chunk of executeSunkarPipelineStream(prompt, activeSessionId)) {
            if (chunk.type === "text")
                fullText += chunk.data;
        }
        const titleMatch = fullText.match(/\[TITLE\]\s*\n(.+)/);
        const titleLine = titleMatch
            ? (titleMatch[1] ?? "").trim()
            : (fullText.split('\n')[0] ?? "").replace(/\*/g, '').trim();
        const story = await prisma.story.create({
            data: {
                originalPrompt: prompt,
                generatedTitle: titleLine || "A New Story",
                generatedStory: fullText,
                userId: String(userId),
            },
        });
        res.json({ storyId: story.id, title: story.generatedTitle, text: fullText });
    }
    catch (err) {
        console.error("❌ Error in generateStoryHandler:", err);
        res.status(500).json({ error: err.message });
    }
}
export async function clearSessionHandler(req, res) {
    try {
        const { sessionId, userId } = req.body;
        const activeSessionId = sessionId || String(userId);
        clearSession(activeSessionId);
        console.log(`🧹 Session cleared: ${activeSessionId}`);
        res.json({ success: true, message: "Session cleared" });
        return;
    }
    catch (err) {
        console.error("❌ Error clearing session:", err);
        res.status(500).json({ error: err.message });
        return;
    }
}
export const loadSessionHandler = (req, res) => {
    const { sessionId, messages } = req.body;
    if (!sessionId || !messages) {
        res.status(400).json({ error: "sessionId and messages required" });
        return;
    }
    clearSession(sessionId);
    messages.forEach((msg) => {
        addToHistory(sessionId, msg.role, msg.content);
    });
    res.json({ success: true });
};
//# sourceMappingURL=storyController.js.map