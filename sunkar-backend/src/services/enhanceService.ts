import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({model: "gemini-2.5-flash"});

const ENHANCE_PROMPT = `You are a professional story editor. The user has written a story and wants it 
polished before it gets converted to audio narration.

Your job:
- Fix grammar and spelling mistakes
- Improve sentence flow so it sounds natural when read aloud
- Make the language more vivid and engaging without changing the story
- Keep the author's original voice and intent intact
- Do NOT add new plot points or characters
- Do NOT make it longer than the original by more than 20%
- Return ONLY the improved story text — no commentary, no explanation

Original story:
`;

//Enhance story text using gemini before TTS conversion

export async function enhanceStoryText(originalText: string): Promise<string>{
    const result = await model.generateContent(ENHANCE_PROMPT + originalText);
    const enhanced = result.response.text().trim();
    return enhanced || originalText; 
}