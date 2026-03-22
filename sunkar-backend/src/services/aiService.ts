import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash", // 2.0 is back online, but use 1.5-flash if 2.0 is busy
});

// Post-processing to clean up AI "crutch" words
function postProcessScript(rawScript: string) {
  return rawScript.replace(/Suddenly,|Then,|Furthermore,|In conclusion,/gi, "").trim();
}

function buildFallbackStory(prompt: string) {
  const title = `A Story About ${prompt.slice(0, 30) || "Your Idea"}`;
  const text = `I still remember when it started... ${prompt}. At first, it felt small... but it stayed. I kept thinking about it... until I couldn’t ignore it anymore.`;
  return { title, text };
}

export async function* executeSunkarPipelineStream(prompt: string) {
  try {
    console.log("🤖 Sunkar AI: Generating Combined Story & Confession...");

    // We ask for the Title first, then the Raw Confession in one stream
    const result = await model.generateContentStream(
      `Task: Create a human-like emotional confession based on this idea: "${prompt}".
      
      Instructions:
      1. First, provide a short creative title wrapped in [TITLE] and [/TITLE].
      2. Then, write the story as a raw, emotional confession. 
      3. Use "..." for natural pauses and hesitations. 
      4. Avoid robotic transition words.
      5. Sound like a real person sharing a secret.`
    );

    let fullText = "";
    let titleFound = false;

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;

      // Extract title if we haven't sent it yet
      if (!titleFound && fullText.includes("[/TITLE]")) {
        const titleMatch = fullText.match(/\[TITLE\](.*?)\[\/TITLE\]/);
        if (titleMatch) {
          yield { type: "title", data: titleMatch[1].trim() };
          titleFound = true;
          // Don't yield the title part as story text
          continue; 
        }
      }

      // Yield the story text (stripping the title tags if present)
      const cleanDisplay = chunkText.replace(/\[TITLE\].*?\[\/TITLE\]/gs, "");
      if (cleanDisplay) {
        yield { type: "text", data: cleanDisplay };
      }
    }

    const finalTitle = fullText.match(/\[TITLE\](.*?)\[\/TITLE\]/)?.[1] || "A New Story";
    const finalStory = postProcessScript(fullText.replace(/\[TITLE\].*?\[\/TITLE\]/gs, ""));

    yield {
      type: "complete",
      data: { title: finalTitle, text: finalStory },
    };

    console.log("🏁 Sunkar AI: Generation Complete.");

  } catch (error) {
    console.error("❌ Sunkar AI Error:", error);
    const fallback = buildFallbackStory(prompt);
    yield { type: "title", data: fallback.title };
    yield { type: "text", data: fallback.text };
    yield { type: "complete", data: fallback };
  }
}

// Keep the standard executor for non-streaming calls
export async function executeSunkarPipeline(prompt: string) {
    // We can just consume the stream to get the final result
    let finalData = { title: "", text: "" };
    for await (const chunk of executeSunkarPipelineStream(prompt)) {
        if (chunk.type === 'complete') {
            finalData = chunk.data;
        }
    }
    return finalData;
}