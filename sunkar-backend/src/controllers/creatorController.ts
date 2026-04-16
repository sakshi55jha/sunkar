import type { Request, Response } from "express";
import prisma from "../prisma";
import { generateAndUploadAudio } from "src/services/audioService";
import { enhanceStoryText } from "src/services/enhanceService";


// -- Submit story handller --
// Receives form data, optionally enhances with AI
// generates to audio, upload to cloudinary, save to db.

export async function submitStoryHandler(req: Request, res: Response): Promise<void>{
const {title, storyText, mood, voiceModel, enhanceWithAI, userId} = req.body;

if(!title || !storyText || !voiceModel || !userId){
    res.status(404).json({
        error: "Title, storydesc, voicemodel and userid is req"
    })
    return
}

//creator story record immediately with PROCESSING Status
//so the creator can see in their dashboard right away

const creatorStory = await prisma.creatorStory.create({
    data:{
        title,
        originalText: storyText,
        mood: mood || null ,
        voiceModel,
        status: "PROCESSING",
        isPublished: false,
        userId: String(userId)
    }
})

//send response immediately so frontend doesn't hang
//Audio generation happens in the background

res.json({
    success: true,
    storyId: creatorStory.id,
    status: "PROCESSING",
    message: "Story Received. Audion is being generated"
})

// --Background processing --
//This runs after the response is sent - non blocking

processStoryAudio(creatorStory.id, storyText, voiceModel, enhanceWithAI === AI)
}

// Handles the full audio pipeline in bg
async function processStoryAudio(
    storyId: string, 
    originalText: string,
    voiceModel: string,
    shouldEnhance: boolean
): Promise<void>{
    try{
        //step1: Optionally enhance text with AI
        const textToConvert = shouldEnhance ? await enhanceStoryText(originalText):
        originalText;

        // step 2 - Generate audio and upload to cloudinary
        const audioUrl = await generateAndUploadAudio(textToConvert, voiceModel, storyId);

        // step 3 - update DB with audio URL and Ready status 
        await prisma.creatorStory.update({
            where: {id: storyId},
            data:{
                enhancedText: shouldEnhance ? textToConvert: null,
                audioUrl,
                status: "READY"
            }
        })

        console.log(`Audio Ready for story: ${storyId}`);

    }catch(error){
        console.error(`Audio not generated for story ${storyId}:`, error);

        //mark as Failed so frontend can show retry option
        await prisma.creatorStory.update({
            where : {id: storyId},
            data: {status: "FAILED"}
        })
    }
}

//-- Get creator Dadhboard stories --
// Returns all stories for creator - published and unpublished

export async function getCreatorStoriesHandler(
    req: Request, res: Response
): Promise<void>{
    const {userId} = req.query

    if(!userId){
        res.status(404).json({
            error: "UserID Is Required";
        })
        return;
    }

    const stories = await prisma.creatorStory.findMany({
        where: {userId: String(userId)},
        orderBy: {createdAt: "desc"},
        select:{
    id: true,
    title:       true,
      mood:        true,
      voiceModel:  true,
      audioUrl:    true,
      status:      true,
      isPublished: true,
      createdAt:   true,
        }
    })
    res.json(stories);
}

// -- Get story by ID --
// Returns full story details for the story details page

export async function getStoryByIdHandler(
    req: Request, res: Response
): Promise<void> {
    const { id } = req.params;

    const story = await prisma.creatorStory.findUnique({
        where: { id },
       select: {
      id:            true,
      title:         true,
      originalText:  true,
      enhancedText:  true,
      mood:          true,
      audioUrl:      true,
      status:        true,
      isPublished:   true,
      createdAt:     true,
      userId:        true,
       }
    })
    if(!story){
        res.status(404).json({error: "Story Not Found"})
        return
    }
    res.json(story);
}

// --Toggle publish Handler --
//publishes or unpublishes a story for the homepage

export async function togglePublishHandler(
    req: Request,
    res: Response
): Promise<void> {
    const {id} = req.params;
    const {isPublished, userId} = req.body;

    const story = await prisma.creatorStory.findUnique(
       { where: {id}}
    )

     if (!story) {
    res.status(404).json({ error: "Story not found" });
    return;
  }

  //only the creator can publish their own story
  
  if(story.userId !== String(userId)){
    res.status(403).json({
        error: "Not Autohrized"
    })
    return;
  }

  //can only publish stroy that have audio ready
  if(isPublished && story.status!== "READY"){
    res.status(400).json({
        error: "Story audio is not ready yet"
    })
    return;
  }

  const updated = await prisma.creatorStory.update({
    where: {id},
    data: {
  isPublished
    }
  })

    res.json({ success: true, isPublished: updated.isPublished });

}

//-- Get public Stories --
// Returns all published Ready Stories for the home page

export async function getPublicStoriesHandler(
    req: Request, res: Response
): Promise<void>{
  const stories = await prisma.creatorStory.findMany({
    where: {
        isPublished: true,
        status: "READY",
    },
    orderBy: {createdAt: "desc"},
    select: {
        id: true,
        title: true,
        mood: true,
        audioUrl: true,
        createdAt: true
    }
  })
  res.json(stories);
}

// -- Delete Story Handler --

export async function deleteStoryHandler(
    req: Request, res: Response
): Promise<void>{
    const {id} = req.params;
    const {userId} = req.body;

    const story = await prisma.creatorStory.findUnique({where : {id}});

    if(!story){
        res.status(404).json({error: "story not found"});
        return;
    }

    if(story.userId !== String(userId)){
        res.status(403).json({error: "User Not Authorized"});
        return
    }

    await prisma.creatorStory.delete({where: {id}});
    res.json({
        success: true
    })
}

// -- Retry Failed Story --

export async function retryStoryHandler(
    req: Request, res: Response
): Promise<void>{
    const {id} = req.params;
    const {userId} = req.body;

    const story = await prisma.creatorStory.findUnique({where : {id}});

    if(!story){
        res.status(404).json({error: "story not found"}); 
        return;
    }

    if(story.userId !== String(userId)){
        res.status(403).json({error: "Not Authorized"});
        return;
    }

    if(story.status !== "FAILED"){
        res.status(400).json({error: "Only failed stories can be retried"})
    }

    await prisma.creatorStory.update({
        where: {id},
        data: {status: "PROCESSING"},
    });

    res.json({
        success: true,
        message: "Retrying audio generation"
    })

    //Retry in background
    processStoryAudio(
        story.id,
        story.originalText,
        story.voiceModel,
        false
    );
}