import prisma from "../prisma";
import { generateAndUploadAudio } from "../services/audioService";
import { enhanceStoryText } from "../services/enhanceService";
import { generateUploadSignature } from "../services/imageService";
export async function submitStoryHandler(req, res) {
    const { title, storyText, mood, voiceModel, coverImageUrl, enhanceWithAI, userId } = req.body;
    if (!title || !storyText || !voiceModel || !userId) {
        res.status(404).json({
            error: "Title, storydesc, voicemodel and userid is req"
        });
        return;
    }
    await prisma.user.upsert({
        where: { id: String(userId) },
        update: {},
        create: { id: String(userId) },
    });
    let finalCoverImageUrl = coverImageUrl;
    const creatorStory = await prisma.creatorStory.create({
        data: {
            title,
            originalText: storyText,
            mood: mood || null,
            voiceModel,
            coverImageUrl: finalCoverImageUrl || null,
            status: "PROCESSING",
            isPublished: false,
            userId: String(userId)
        }
    });
    res.json({
        success: true,
        storyId: creatorStory.id,
        status: "PROCESSING",
        message: "Story Received. Audion is being generated"
    });
    processStoryAudio(creatorStory.id, storyText, voiceModel, enhanceWithAI === true);
}
async function processStoryAudio(storyId, originalText, voiceModel, shouldEnhance) {
    try {
        const textToConvert = shouldEnhance ? await enhanceStoryText(originalText) :
            originalText;
        const audioUrl = await generateAndUploadAudio(textToConvert, voiceModel, storyId);
        await prisma.creatorStory.update({
            where: { id: storyId },
            data: {
                enhancedText: shouldEnhance ? textToConvert : null,
                audioUrl,
                status: "READY"
            }
        });
        console.log(`Audio Ready for story: ${storyId}`);
    }
    catch (error) {
        console.error(`Audio not generated for story ${storyId}:`, error);
        const errorMessage = error?.message || String(error) || "Unknown Error";
        await prisma.creatorStory.update({
            where: { id: storyId },
            data: {
                status: "FAILED",
                errorLogs: errorMessage
            }
        });
    }
}
export async function getCreatorStoriesHandler(req, res) {
    const { userId } = req.query;
    if (!userId) {
        res.status(404).json({
            error: "UserID Is Required"
        });
        return;
    }
    const stories = await prisma.creatorStory.findMany({
        where: { userId: String(userId) },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            mood: true,
            voiceModel: true,
            audioUrl: true,
            coverImageUrl: true,
            status: true,
            isPublished: true,
            createdAt: true,
        }
    });
    res.json(stories);
}
export async function getStoryByIdHandler(req, res) {
    const id = String(req.params.id ?? "");
    const story = await prisma.creatorStory.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            originalText: true,
            enhancedText: true,
            mood: true,
            audioUrl: true,
            coverImageUrl: true,
            status: true,
            isPublished: true,
            createdAt: true,
            userId: true,
        }
    });
    if (!story) {
        res.status(404).json({ error: "Story Not Found" });
        return;
    }
    res.json(story);
}
export async function getUploadSignatureHandler(req, res) {
    try {
        const signatureData = generateUploadSignature();
        res.json(signatureData);
    }
    catch (error) {
        console.error("Error generating signature:", error);
        res.status(500).json({ error: "Failed to generate signature" });
    }
}
export async function togglePublishHandler(req, res) {
    const id = String(req.params.id ?? "");
    const { isPublished, userId } = req.body;
    const story = await prisma.creatorStory.findUnique({ where: { id } });
    if (!story) {
        res.status(404).json({ error: "Story not found" });
        return;
    }
    if (story.userId !== String(userId)) {
        res.status(403).json({
            error: "Not Autohrized"
        });
        return;
    }
    if (isPublished && story.status !== "READY") {
        res.status(400).json({
            error: "Story audio is not ready yet"
        });
        return;
    }
    const updated = await prisma.creatorStory.update({
        where: { id },
        data: {
            isPublished
        }
    });
    res.json({ success: true, isPublished: updated.isPublished });
}
export async function getPublicStoriesHandler(req, res) {
    const stories = await prisma.creatorStory.findMany({
        where: {
            isPublished: true,
            status: "READY",
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            mood: true,
            audioUrl: true,
            coverImageUrl: true,
            createdAt: true
        }
    });
    res.json(stories);
}
export async function deleteStoryHandler(req, res) {
    const id = String(req.params.id ?? "");
    const { userId } = req.body;
    const story = await prisma.creatorStory.findUnique({ where: { id } });
    if (!story) {
        res.status(404).json({ error: "story not found" });
        return;
    }
    if (story.userId !== String(userId)) {
        res.status(403).json({ error: "User Not Authorized" });
        return;
    }
    await prisma.creatorStory.delete({ where: { id } });
    res.json({
        success: true
    });
}
export async function retryStoryHandler(req, res) {
    const id = String(req.params.id ?? "");
    const { userId } = req.body;
    const story = await prisma.creatorStory.findUnique({ where: { id } });
    if (!story) {
        res.status(404).json({ error: "story not found" });
        return;
    }
    if (story.userId !== String(userId)) {
        res.status(403).json({ error: "Not Authorized" });
        return;
    }
    if (story.status !== "FAILED") {
        res.status(400).json({ error: "Only failed stories can be retried" });
        return;
    }
    await prisma.creatorStory.update({
        where: { id },
        data: {
            status: "PROCESSING",
            errorLogs: null
        },
    });
    res.json({
        success: true,
        message: "Retrying audio generation"
    });
    processStoryAudio(story.id, story.originalText, story.voiceModel, false);
}
//# sourceMappingURL=creatorController.js.map