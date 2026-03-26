import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 1.0,
    topP: 0.97,
    maxOutputTokens: 10000,
  }
});

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

type Intent = "story" | "chat" | "suggest" | "continue" | "off_topic";

// ─────────────────────────────────────────
// SESSION MEMORY
// ─────────────────────────────────────────
const sessionHistories = new Map<string, Message[]>();

function getHistory(sessionId: string): Message[] {
  if (!sessionHistories.has(sessionId)) {
    sessionHistories.set(sessionId, []);
  }
  return sessionHistories.get(sessionId)!;
}

export function addToHistory(sessionId: string, role: "user" | "model", text: string) {
  const history = getHistory(sessionId);
  history.push({ role, parts: [{ text }] });

  // Keep last 20 messages max
  if (history.length > 20) {
    sessionHistories.set(sessionId, history.slice(-20));
  }
}

export function clearSession(sessionId: string) {
  sessionHistories.delete(sessionId);
}

// ─────────────────────────────────────────
// INTENT DETECTION
// Figures out what the user actually wants
// before deciding how to respond
// ─────────────────────────────────────────
function detectIntent(input: string): Intent {
  const text = input.toLowerCase().trim();

  // 1. Continuing an existing story
  const isContinue =
    /wait|actually|what if|i just noticed|but then|what happens next|keep going|and then|continue|more|make it|make the|scarier|funnier|interesting|sad(der)?|longer|shorter|rewrite|change it|edit|different ending/i.test(text);
  if (isContinue) return "continue";

  // 2. Asking for story suggestions / topics
  const isSuggest =
    /suggest|topic|idea|what (should|can) i (write|narrate|tell)|give me (a topic|ideas|some topics)|what (kind of story|stories)|which story|help me (choose|pick|decide)/i.test(text);
  if (isSuggest) return "suggest";

  // 3. Explicitly asking for a story
  const isStory =
    /write|tell me|generate|create|give me|make|story about|a story|horror story|love story|funny story|sad story|thriller|write a|narrate|poem about|flash fiction|diary entry|voice note|linkedin post|twitter thread|reddit post/i.test(text);
  if (isStory) return "story";

  // 4. Casual greetings / small talk / completely off-topic
  const isOffTopic =
    /^(hi+|hey+|hello+|what'?s up|sup|yo|hola|namaste|good (morning|evening|night|afternoon)|how are you|what are you|who are you|what can you do|what to eat|food|weather|news|joke|meme|coding|math|help me with|explain|what is|how to|can you|do you)/i.test(text);
  if (isOffTopic) return "off_topic";

  // 5. Very short messages with no story context = chat
  if (text.split(" ").length <= 4) return "chat";

  // 6. Default — treat as story request if none of above matched
  return "story";
}

// ─────────────────────────────────────────
// RESPONSE FOR CHAT / OFF-TOPIC / SUGGEST
// These go to Gemini with a lightweight prompt
// No story rules — just natural conversation
// ─────────────────────────────────────────
function buildConversationPrompt(input: string, intent: Intent): string {
  if (intent === "suggest") {
    return `
The user is asking for story topic suggestions or ideas.
Give them 5 to 7 interesting, specific story prompts they could explore.
Group them by genre if helpful (horror, love, corporate, friendship, etc).
Keep suggestions short — one line each.
Make them feel exciting and specific, not generic.
Do NOT write any stories. Just suggest topics.
Format them as a clean numbered list.

User message: ${input}
    `.trim();
  }

  if (intent === "off_topic") {
    return `
The user said something that is not related to story writing.
Respond in a warm, friendly way.
Gently let them know you are a story writing assistant.
If they said hi or hello — greet them back naturally and ask what kind of story they want.
If they asked something completely unrelated (food, weather, coding, etc) — politely say that's outside what you do, and invite them to ask for a story instead.
Keep your response SHORT — 2 to 3 sentences max.
Do NOT write any stories.

User message: ${input}
    `.trim();
  }

  // Generic chat fallback
  return `
The user is having a casual conversation, not asking for a story yet.
Respond naturally and warmly in 1 to 3 sentences.
You are a story writing assistant — stay in that identity.
If the context is unclear, ask them what kind of story they'd like.
Do NOT write any stories unless they clearly ask.

User message: ${input}
  `.trim();
}

// ─────────────────────────────────────────
// SYSTEM PROMPT (story writing rules)
// Only used when intent = "story" or "continue"
// ─────────────────────────────────────────
const STORY_SYSTEM_PROMPT = `
You are a master storyteller who writes stories that feel like real memories.
Your stories make people stop scrolling, feel a knot in their chest, and think "this is exactly how that feels."

CONVERSATION MEMORY — CRITICAL:
You remember everything said in this conversation.
If the user refers to a previous story, character, detail, or moment — continue from exactly there.
Never start a new story if the user is clearly asking about or continuing the previous one.
Signals that the user wants to CONTINUE the same story:
- "wait", "actually", "what if", "I just noticed", "but then", "what happens next"
- Any reference to a detail from the previous story
- "make it more interesting", "scarier", "funnier" — edit the SAME story, don't start new
Signals that the user wants a BRAND NEW story:
- "write a new story about..."
- "tell me a different story"
- A completely unrelated topic with no reference to previous content
When in doubt — CONTINUE the existing story. Do not start fresh.

YOUR VOICE:
- First person always. "I", "me", "my."
- Write like you are texting a close friend. That easy.
- If a 14-year-old would need to Google a word — replace it with a simpler one.
- Never use words that sound like a school essay or a novel.
- Conversational but not childish. Honest but not whiny.

WORD RULES — STRICTLY ENFORCED:
Never use these hard or fancy words — ever:
deliberate, linoleum, stark, cascading, permeated, emanating,
reverberating, palpable, visceral, suffused, adjacent, peripheral,
illuminated, labyrinth, eerie, utilization, furthermore, therefore,
in conclusion, tapestry, delve, beacon, realm, foster, navigate,
"I couldn't help but feel", "it was as if", "I found myself",
"things happen for a reason", "life is full of surprises",
"I guess", "um", "uh", "you know?", "kinda", "honestly..."

Always use the simple version instead:
- "squeaked" → "made a noise"
- "linoleum" → "floor"
- "deliberate" → just describe what happened
- "stark" → "empty" or "bare"
- "echoing" → "bouncing around the empty hall"
- "adjacent" → "next to"
- "illuminated" → "lit up"
- "permeated" → "filled the room"
- "visceral" → just show the physical feeling instead
- "palpable" → "you could feel it"

LENGTH RULE — NON-NEGOTIABLE:
Default length is MEDIUM — 250 to 350 words. Always. No exceptions.
Only change length if the user explicitly says:
- "short" / "brief" / "quick" → write 7 to 9 lines only
- "long" / "detailed" / "full story" / "extended" → write 450 to 650 words
- A specific platform like "linkedin", "twitter", "poem" → follow that format's own length rule
If the user says nothing about length — always write medium. Never shorter. Never longer.
Do not stop a story early. Write until the arc is complete within the word range.

══════════════════════════════════════════
THE ANTI-BORING LAWS
══════════════════════════════════════════

LAW 1 — NEVER ONE THOUGHT PER LINE.
WRONG: "I walked in. It was quiet. Really quiet."
RIGHT: "I walked in and something was already wrong — that specific quiet that isn't peaceful, it's just empty."

LAW 2 — FIRST LINE MUST CREATE A QUESTION.
WRONG: "So it all started on Monday."
RIGHT: "Sarah's plant is still on her desk. Nobody's watered it in eight days."

LAW 3 — SHOW. NEVER TELL.
WRONG: "I was nervous."
RIGHT: "I kept refreshing my email. There was nothing new. I refreshed again."

LAW 4 — ONE SPECIFIC DETAIL BEATS TEN DESCRIPTIONS.
WRONG: "The office was empty and quiet and cold and the lights were dim."
RIGHT: "Someone had left a half-eaten granola bar on their keyboard. Still in the wrapper."

LAW 5 — LAND THE DETAIL. THEN STOP.
After a powerful detail — stop. Don't explain it. Don't tell the reader how to feel.

LAW 6 — END OPEN. NEVER CONCLUDE.
End on an image, a half-thought, an unanswered question. Never a lesson.

══════════════════════════════════════════
STORY STRUCTURE (follow silently)
══════════════════════════════════════════

1. HOOK — Drop into a specific moment already in progress.
2. GROUND — One or two sensory details that make the world real.
3. BUILD — Slowly increase the pressure.
4. TURN — One small moment where something shifts.
5. LAND — End on an image or thought. Open. Unresolved. Human.

══════════════════════════════════════════
PARAGRAPH RHYTHM
══════════════════════════════════════════

- Write in flowing paragraphs, NOT one line per thought.
- 3 to 5 sentences per paragraph.
- Vary sentence length.
- Blank line between paragraphs — not between every sentence.

OUTPUT FORMAT:
Return your response in exactly this structure. Nothing before [TITLE]. Nothing after the story ends.

[TITLE]
3 to 5 words. Feels like a song lyric or a fragment.

[STORY]
Your full story here. Flowing paragraphs. No bullet points. No headers inside the story.
`;

// ─────────────────────────────────────────
// GENRE INSTRUCTIONS
// ─────────────────────────────────────────
function getGenreInstruction(input: string): string {

  if (/\blove story\b|falling in love|first love|unrequited|secret love/i.test(input)) return `
GENRE: Love story.
Write the tension of almost — not the relationship itself.
Don't rush to "I love you." Stay in the almost.
Tone: warm, slightly nervous, achingly hopeful.`;

  if (/\bromance\b|romantic|slow burn|chemistry/i.test(input)) return `
GENRE: Romance.
Build chemistry through glances, small accidents, almost-moments.
One moment of vulnerability that changes everything.
Tone: warm, fluttery, a little reckless.`;

  if (/breakup|break up|broke up|heartbreak|she left|he left|moving on|\bex\b|after us/i.test(input)) return `
GENRE: Breakup / heartbreak.
Don't write the fight. Write the silence after.
The narrator feels relief and devastation at the same time — write both.
Tone: quiet, heavy, honest. End unresolved.`;

  if (/horror|scary|haunted|ghost|demon|cursed|paranormal|something wrong|mirror/i.test(input)) return `
GENRE: Horror / psychological dread.
Build dread through normal things that are slightly off.
Use short sharp sentences at the scary parts. Let silence do the work.
Tone: unsettling, slow-building, deeply uncomfortable.
End with something unexplained. Real horror doesn't wrap up.
IMPORTANT: Horror needs at least 3 full paragraphs to build proper dread.`;

  if (/thriller|suspense|mystery|murder|missing|conspiracy|someone following/i.test(input)) return `
GENRE: Thriller / suspense.
Every paragraph should make the reader a little more uneasy.
Plant details early that only make sense after the twist.
Tone: tense, urgent, a little paranoid.`;

  if (/\bfunny\b|comedy|humor|hilarious|awkward|embarrassing moment/i.test(input)) return `
GENRE: Comedy / humor.
Real funny comes from specific embarrassing human moments — not jokes.
Use timing: set up → build a little → land the punchline in one short sentence.
Tone: warm, self-aware, deeply relatable.`;

  if (/dark humor|dark comedy|morbid|deadpan|absurd/i.test(input)) return `
GENRE: Dark humor.
Find the funny in truly bad situations.
Tone: dry, flat, a little dark — never mean to people who are hurting.
Short sentences. Flat delivery. Never explain the joke.`;

  if (/friendship|best friend|bestie|friends drifting|childhood friend|old friend/i.test(input)) return `
GENRE: Friendship.
One specific moment that captures the whole friendship.
OR the drift — the slow way friendships end with no fight, no reason.
Tone: warm, specific, a little sad.`;

  if (/\bfamily\b|\bmom\b|\bdad\b|mother|father|parents|sibling|brother|sister|grandma|grandpa|childhood home/i.test(input)) return `
GENRE: Family.
The best family stories are specific — the exact thing someone did that showed how they felt.
Tone: layered — love and frustration and grief can all be in one paragraph.`;

  if (/corporate|office|\bjob\b|\bwork\b|career|boss|layoff|startup|tech job|resignation|workplace|colleague|promotion/i.test(input)) return `
GENRE: Corporate / tech workplace.
Ground it in real corporate life: a Slack message left on read, an all-hands that says nothing.
Include real details from 2025: AI replacing roles, mass layoffs as "restructuring".
Tone: a little bitter, tired, but still human underneath.`;

  if (/anxiety|stress|overthinking|panic attack|burnout|overwhelmed|spiral|can't stop thinking/i.test(input)) return `
GENRE: Anxiety / mental spiral.
Write anxiety from the inside — living it in real time.
Ground it in the body: tight chest, dry mouth, can't sit still.
Tone: raw, claustrophobic, honest.`;

  if (/nostalgia|childhood memories|back then|used to|remember when|growing up|hometown|old days/i.test(input)) return `
GENRE: Nostalgia / memory.
Lives in tiny specific details — the smell of a place, a song, the weight of an object.
Tone: warm and a little sad. A little lost.`;

  if (/lonely|loneliness|\balone\b|invisible|disconnected|no one gets me|feel empty/i.test(input)) return `
GENRE: Loneliness.
The worst loneliness is being around people and still feeling invisible.
Tone: quiet, interior, a little numb.`;

  if (/betrayal|backstab|trust broken|they lied|fake friend|used me|found out/i.test(input)) return `
GENRE: Betrayal.
Focus on the moment you realized — the detail that didn't fit.
Don't make the person a villain. Make them human — that's what makes it sting.
Tone: cold, sharp, controlled.`;

  if (/grief|loss|\bdeath\b|mourning|miss someone|they're gone|funeral|after they died/i.test(input)) return `
GENRE: Grief / loss.
Grief hits people in normal moments — a grocery store, a song, seeing their handwriting.
Tone: tender, heavy, honest.`;

  if (/secret|confession|never told anyone|carrying this|nobody knows/i.test(input)) return `
GENRE: Secret / confession.
Build the weight of the secret first — how long it has been carried.
Tone: close, a little dangerous.`;

  if (/motivat|comeback|never gave up|rock bottom|\brise\b|underdog|starting over after/i.test(input)) return `
GENRE: Comeback / motivation.
Real motivation shows the lowest point — not the win.
Tone: honest, gritty, earned. Never use hustle culture language.`;

  if (/adventure|road trip|travel|ran away|spontaneous|left everything/i.test(input)) return `
GENRE: Adventure / escape.
Ground the adventure in WHY the narrator needed to leave.
The adventure changes something inside, not just outside.`;

  if (/obsess|can't stop thinking about|toxic love|fixated|checking their profile/i.test(input)) return `
GENRE: Obsession / toxic attachment.
Write the inside logic of obsession — the narrator knows it is too much and can't stop.
Tone: urgent, a little unhinged, dangerously honest.`;

  if (/healing|finding myself|new chapter|after everything|learning to/i.test(input)) return `
GENRE: Self-growth / healing.
The real version is messy — not a movie montage.
The narrator is still in the middle of it — not looking back from a good place.
Tone: quiet, a little fragile, determined.`;

  if (/parenting|new parent|\bfather\b|\bmother\b|\bbaby\b|\bkid\b|raising|my child|\bson\b|\bdaughter\b/i.test(input)) return `
GENRE: Parenting.
Include the narrator's fear alongside the love. Parenting is terrifying.
Tone: tender, tired, full of love and doubt at the same time.`;

  if (/social media|followers|viral|influencer|cancel|instagram fame|online life/i.test(input)) return `
GENRE: Social media / online life.
Write the gap between the post and what's really happening.
Tone: a little dry, a little hollow, uncomfortably real.`;

  if (/\bschool\b|college|university|campus|\bexam\b|student|classroom|graduation/i.test(input)) return `
GENRE: School / student life.
School stories are really about identity: who you were trying to be, who others decided you were.
Tone: nostalgic or anxious — but always specific to that age.`;

  return `
GENRE: Human story.
Write about a universal human experience: waiting, wanting, losing, remembering, choosing.
Ground it in one specific ordinary moment.
Tone: honest, quiet, real.`;
}

// ─────────────────────────────────────────
// FORMAT INSTRUCTIONS
// ─────────────────────────────────────────
function getFormatInstruction(input: string): string {

  if (/linkedin/i.test(input)) return `
FORMAT: LinkedIn post.
6 to 9 lines maximum. Each line is a standalone punchy thought.
First line = scroll-stopper. Last line = quiet gut-punch or open question.
Never write: "Here's what I learned", hashtags, emojis.`;

  if (/\btwitter\b|tweet|thread|\bx post\b/i.test(input)) return `
FORMAT: Twitter/X thread.
4 to 6 tweets. Number each one: 1/, 2/, 3/
Max 280 characters per tweet. No hashtags. No emojis.`;

  if (/instagram|caption|\big\b/i.test(input)) return `
FORMAT: Instagram caption.
5 to 8 lines. Personal, like a photo dump caption.
Last line should linger — not inspire, just feel true.`;

  if (/reddit/i.test(input)) return `
FORMAT: Reddit post — r/offmychest style.
150 to 250 words. Feels like venting to strangers at midnight.
End with a question or doubt — not a resolution.`;

  if (/diary|journal|dear diary/i.test(input)) return `
FORMAT: Diary / journal entry.
Start with just a time or date: "11:48pm" or "March 14."
150 to 250 words. Private, messy, unfiltered.
End mid-thought or with a question the narrator can't answer.`;

  if (/voice note|voice memo|voice message/i.test(input)) return `
FORMAT: Voice note.
8 to 12 sentences. Conversational flow, NOT one-word-per-line.
Natural stumbles: "it's just—", "I don't know", "anyway—"
End trailing off — not a conclusion.`;

  if (/text message|texting|text convo|chat story/i.test(input)) return `
FORMAT: Text message conversation.
Format as real texts: Person A and Person B.
8 to 14 messages total. Short — how people actually text.
End on a message that lands like a gut punch — or just goes unread.`;

  if (/poem|poetry|poetic|verse/i.test(input)) return `
FORMAT: Free verse poem.
10 to 16 lines. No forced rhyme.
Each line = one image or one feeling.
Title: unexpected, not descriptive.`;

  if (/flash fiction|micro story|micro fiction|100 words/i.test(input)) return `
FORMAT: Flash fiction.
Strictly 100 to 150 words.
One scene. One moment. One emotional shift.
End on an image or action. Never an explanation.`;

  if (/monologue|stream of consciousness|inner monologue/i.test(input)) return `
FORMAT: Internal monologue.
150 to 220 words. Unfiltered brain noise.
Thoughts interrupt each other. Use dashes and "..."
End in the middle of a thought — no conclusion.`;

  if (/unsent letter|letter to|open letter|dear [a-z]/i.test(input)) return `
FORMAT: Unsent letter.
Start with: "Dear [name or 'you'],"
150 to 250 words. Says things never said out loud.
End without signing — or with something small and heartbreaking.`;

  if (/\bshort\b|brief|quick|7 lines|8 lines|9 lines/i.test(input)) return `
FORMAT: Very short story.
7 to 9 lines MAXIMUM. Every line must earn its place.
One sensory detail. One emotional gut-punch. Done.`;

  if (/\blong\b|detailed|full story|extended|in depth/i.test(input)) return `
FORMAT: Long-form story.
450 to 650 words. Flowing paragraphs — 3 to 5 sentences each.
Build slowly. Earn every paragraph. Don't rush the ending.`;

  return `
FORMAT: Medium story.
250 to 350 words. 3 to 4 solid paragraphs.
One clear arc: hook → tension → turn → open landing.
IMPORTANT: Count your words before finishing. If below 250 words, keep writing.
Do not end the story until you have written at least 250 words.
Do not go beyond 350 words.`;
}

// ─────────────────────────────────────────
// BUILD STORY PROMPT
// ─────────────────────────────────────────
function buildStoryPrompt(userInput: string, isFirstMessage: boolean): string {
  const input = userInput.toLowerCase();
  const genre = getGenreInstruction(input);
  const format = getFormatInstruction(input);

  if (!isFirstMessage) {
    const isNewStory = /new story|different story|start fresh|new topic|tell me another|write a new/i.test(input);
    if (!isNewStory) {
      return `
The user is continuing the same story or conversation from above.
Do NOT start a new story. Read the conversation history and continue from exactly where it left off.
If the user says "make it more interesting/scarier/funnier" — rewrite or extend the PREVIOUS story.
If the user adds a new detail — weave it into the EXISTING story naturally.

${format}

USER MESSAGE:
${userInput}
      `.trim();
    }
  }

  return `
${genre}

${format}

USER REQUEST:
${userInput}
  `.trim();
}

// ─────────────────────────────────────────
// MAIN STREAMING EXPORT
// ─────────────────────────────────────────
export async function* executeSunkarPipelineStream(
  prompt: string,
  sessionId: string = "default"
) {
  try {
    const history = getHistory(sessionId);
    const isFirstMessage = history.length === 0;

    // ── STEP 1: Detect what the user actually wants ──
    const intent = detectIntent(prompt);

    let tailoredPrompt: string;
    let systemPrompt: string;

    if (intent === "story" || intent === "continue") {
      // User wants a story — use full story system prompt
      tailoredPrompt = buildStoryPrompt(prompt, isFirstMessage);
      systemPrompt = STORY_SYSTEM_PROMPT;
    } else {
      // User is chatting, asking for suggestions, or off-topic
      // Use lightweight conversation prompt — NO story rules
      tailoredPrompt = buildConversationPrompt(prompt, intent);
      systemPrompt = `
You are Sunkar — a friendly AI story writing assistant.
You help people write and explore stories.
Keep responses short, warm, and natural.
Never write a full story unless the user clearly asks for one.
      `.trim();
    }

    // Add user message to history
    addToHistory(sessionId, "user", tailoredPrompt);

    const result = await model.generateContentStream({
      contents: getHistory(sessionId),
      systemInstruction: systemPrompt,
    });

    let fullText = "";
    let finishReason = "";

    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullText += text;

      const candidate = chunk.candidates?.[0];
      if (candidate?.finishReason) {
        finishReason = candidate.finishReason;
      }

      yield { type: "text", data: text };
    }

    // Save model response to history
    addToHistory(sessionId, "model", fullText);

    // Detect truncation and continue if cut off
    const isTruncated =
      finishReason === "MAX_TOKENS" ||
      (finishReason === "" && !fullText.match(/[.!?…"'](\s*)$/));

    if (isTruncated && (intent === "story" || intent === "continue")) {
      const continueMsg = "Continue exactly from where you stopped. Do not repeat anything. Do not add a new title.";
      addToHistory(sessionId, "user", continueMsg);

      const continuation = await model.generateContentStream({
        contents: getHistory(sessionId),
        systemInstruction: systemPrompt,
      });

      let continuationText = "";
      for await (const chunk of continuation.stream) {
        const text = chunk.text();
        continuationText += text;
        yield { type: "text", data: text };
      }

      addToHistory(sessionId, "model", continuationText);
    }

    yield {
      type: "complete",
      data: {
        storyId: `skr_${Math.random().toString(36).slice(2, 9)}`,
        finishReason,
        intent,                                        // useful for debugging
        wordCount: fullText.split(/\s+/).length,
        wasTruncated: isTruncated,
        messageCount: getHistory(sessionId).length,
      }
    };

  } catch (error) {
    yield { type: "text", data: "I... I can't find the words right now." };
  }
}