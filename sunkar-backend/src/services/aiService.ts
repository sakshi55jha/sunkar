import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: `
    You are a real person sharing a raw, honest story. 
    - Tone: 2 AM secret, deep, and slightly dramatic.
    - Style: Use simple, everyday English. NO "hard" dictionary words.
    - Formatting: Use "..." for pauses. One sentence per line for impact.
    - Rule: If the user is brief, give a punchy micro-story with data (salaries, years, etc.). 
    - Rule: If the user asks for 'long', write a 5-paragraph deep story.
    - Always start with a Bold Title, followed by a double space.
  `,
});

// Post-processing to clean up AI "crutch" words
// function postProcessScript(rawScript: string) {
//   return rawScript.replace(/Suddenly,|Then,|Furthermore,|In conclusion,/gi, "").trim();
// }

// function buildFallbackStory(prompt: string) {
//   const title = `A Story About ${prompt.slice(0, 30) || "Your Idea"}`;
//   const text = `I still remember when it started... ${prompt}. At first, it felt small... but it stayed. I kept thinking about it... until I couldn’t ignore it anymore.`;
//   return { title, text };
// }

export async function* executeSunkarPipelineStream(prompt: string) {
  try {
    // 2. Decide if it should be long or short based on user words
    const lowerPrompt = prompt.toLowerCase();
    const isLong = lowerPrompt.includes("long") || lowerPrompt.includes("detailed");
    
    const userRequest = isLong 
      ? `Write a full, detailed story about: ${prompt}`
      : `Write a short, punchy, high-impact story about: ${prompt}`;

    // 3. One stream, high temperature (0.9) for realism
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: userRequest }] }],
      generationConfig: {
        temperature: 0.9, 
        topP: 0.95,
      },
    });

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      // Directly yield the text as it arrives
      yield { type: "text", data: chunkText };
    }

    yield { type: "complete", data: {} };

  } catch (error) {
    console.error("❌ AI Error:", error);
    yield { type: "text", data: "I... I can't find the words right now. Try again?" };
  }
}