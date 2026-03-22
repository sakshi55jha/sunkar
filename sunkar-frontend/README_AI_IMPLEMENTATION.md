# Sunkar: AI Story Generation & History Implementation Plan

This document outlines the step-by-step technical architecture, API strategy, and precise code required for the Sunkar `/create` pipeline. The goal is to take a user's raw idea, refine it using an elite 3-step AI pipeline, and seamlessly store that history.

---

## Sunkar AI Pipeline: The 3-Step "Human-First" Architecture

To guarantee the stories sound exactly like a real human confession rather than a robotic AI script, Sunkar uses a powerful **3-Step Chained Generation Pipeline**. This is the core secret to making the audio generation feel incredibly authentic and deeply emotional.

### Step 1: Base Story Generation (The Foundation)
When the user inputs a prompt (e.g., "horror story in hostel"), the backend fires the first API call to Google Gemini or OpenAI.

**The Prompt Structure:**
> "Write a short, highly engaging story derived from this prompt: [USER_INPUT]. Design it specifically for an audio platform. Make it sound like a real person is narrating it. Use simple language, an emotional tone, and natural pauses. Avoid any robotic or formal phrasing. Start with a strong hook and end with serious impact."

*Result:* The AI returns a "GOOD" story.

### Step 2: The Rewrite Layer (The "Confession" Pass)
This is the most critical step. Instead of sending the "GOOD" story to the user, the backend immediately sends that exact output *back* to the AI in a second API call.

**The Rewrite Prompt:**
> "Take the following story and rewrite it like a real, raw confession. Make it much more natural, emotional, and intensely human. Inject conversational tone, hesitation, and natural pauses using ellipses ('...'). The listener must believe a real person is sitting across from them telling this."

*Result:* The AI shatters the rigid structure of the first draft, replacing perfect grammar with raw emotion. The output is now **🔥 MUCH BETTER**.

### Step 3: Code-Level Post-Processing (The Polish)
Before the story is sent to the database and the Text-To-Speech (TTS) engine, your backend Node.js code runs programmatic filters over the text.
1. **Shorten Sentences** to avoid TTS engine breathlessness.
2. **Inject SSML Pauses:** Convert `...` into literal `<break time="1s"/>` tags for ElevenLabs/TTS tools.
3. **Word Deduplication:** Remove generic AI filler words ("Suddenly," "Furthermore").

---

## The Coding Roadmap: Exact Code Implementations

Below is the **exact code** you need to wire up the entire pipeline across your Backend and Frontend.

### Step 1: Initialize Database (Prisma)
**File:** `sunkar-backend/prisma/schema.prisma`
```prisma
model User {
  id      String  @id @default(cuid())
  name    String?
  stories Story[]
}

model Story {
  id             String   @id @default(cuid())
  originalPrompt String   @db.Text
  generatedTitle String
  generatedStory String   @db.Text
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  createdAt      DateTime @default(now())
}
```
*Run:* `npx prisma db push`

**File:** `sunkar-backend/src/config/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

### Step 2: Build the AI Service Logic (The Core Engine)
**File:** `sunkar-backend/src/services/aiService.ts`
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 1. Base Story Generation
async function generateBaseStory(prompt: string) {
  const result = await model.generateContent(
    `Write an engaging story about: ${prompt}. Sound like a real person narrating. Give it a title. Output JSON exactly like this: { "title": "the title", "storyText": "the story" }`
  );
  // Extract json from markdown backticks if necessary
  let cleanJson = result.response.text().replace(/```json|```/g, ''); 
  return JSON.parse(cleanJson);
}

// 2. The Confession Rewrite
async function rewriteConfession(baseStoryText: string) {
  const result = await model.generateContent(
    `Rewrite the following story like a real, raw, emotional confession. Add hesitation and pauses using '...' Make it profoundly human: \n\n${baseStoryText}`
  );
  return result.response.text();
}

// 3. Post-Processing Code Polish
function postProcessScript(rawScript: string) {
  let cleaned = rawScript.replace(/Suddenly,|Then,|Furthermore,/gi, '');
  // Optionally map ellipses to TTS tags
  // cleaned = cleaned.replace(/\.\.\./g, '<break time="1s"/>');
  return cleaned;
}

// Orchestrator
export async function executeSunkarPipeline(prompt: string) {
  const base = await generateBaseStory(prompt);
  const rawConfession = await rewriteConfession(base.storyText);
  const finalScript = postProcessScript(rawConfession);
  
  return { title: base.title, text: finalScript };
}
```

### Step 3: Build the API Controller
**File:** `sunkar-backend/src/controllers/storyController.ts`
```typescript
import { Request, Response } from 'express';
import { executeSunkarPipeline } from '../services/aiService';
import { prisma } from '../config/prisma';

export async function generateStoryHandler(req: Request, res: Response) {
  try {
    const { prompt, userId } = req.body;
    
    // Run the 3-step AI pipeline
    const { title, text } = await executeSunkarPipeline(prompt);
    
    // Save to Database
    const newStory = await prisma.story.create({
      data: {
        originalPrompt: prompt,
        generatedTitle: title,
        generatedStory: text,
        userId: userId // hardcode or pass from auth token
      }
    });

    res.status(200).json({ storyId: newStory.id });
  } catch (err) {
    res.status(500).json({ error: "Pipeline failed" });
  }
}
```

### Step 4: Expose the Web Routes
**File:** `sunkar-backend/src/routes/storyRoutes.ts`
```typescript
import express from 'express';
import { generateStoryHandler } from '../controllers/storyController';

export const router = express.Router();
router.post('/generate', generateStoryHandler);
```

### Step 5: Connect the React Frontend (`/create`)
**File:** `sunkar-frontend/app/create/page.tsx`
```typescript
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Create() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);

    const res = await fetch('http://localhost:5000/api/stories/generate', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, userId: "clqxxxxxxuserid" }) // Placeholder User ID
    });
    const data = await res.json();
    
    // Route directly to the player once saved in Prisma!
    if (data.storyId) {
      router.push(`/story/${data.storyId}`);
    }
  };

  // ... (Connect this to your Input and Send button)
}
```

### Step 6: Load History in the Sidebar
**File:** `sunkar-frontend/app/create/page.tsx`
```typescript
import { useEffect, useState } from 'react';

// ... inside the Create component:
const [history, setHistory] = useState([]);

useEffect(() => {
  fetch('http://localhost:5000/api/stories/history?userId=clqxxxxxxuserid')
    .then(res => res.json())
    .then(data => setHistory(data)); // map 'data.title' onto your Sidebar buttons
}, []);
```
