import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// Provider setup
// ---------------------------------------------------------------------------

const getApiKey = () =>
  (import.meta as any).env?.VITE_GOOGLE_AI_API_KEY as string | undefined;

const google = createGoogleGenerativeAI({
  apiKey: getApiKey() ?? "",
});

// ---------------------------------------------------------------------------
// Zod schemas — single source of truth for structured output + TS types
// ---------------------------------------------------------------------------

const playerProfileSchema = z.object({
  name: z.string(),
  role: z
    .string()
    .describe(
      'Their storytelling role in 2-3 words, e.g. "the instigator", "the poet", "the wildcard"',
    ),
  read: z
    .string()
    .describe(
      "2-3 sentence personality read based on their specific contributions. Reference actual words they used.",
    ),
  patterns: z
    .array(z.string())
    .describe(
      "2-4 key patterns observed in their writing, e.g. 'gravitates toward conflict', 'uses concrete nouns'",
    ),
  signatureMove: z
    .string()
    .describe(
      "Their signature word, phrase, or habit with a brief explanation",
    ),
});

const dynamicAnalysisSchema = z.object({
  syncScore: z
    .number()
    .describe("How well they sync creatively, integer 1-10"),
  syncLabel: z
    .string()
    .describe(
      'Short label for the sync score, e.g. "eerily in tune", "beautiful chaos"',
    ),
  summary: z
    .string()
    .describe(
      "The dynamic between them in one vivid sentence",
    ),
  style: z
    .string()
    .describe(
      "Communication style comparison — how their writing styles contrast or complement",
    ),
  connectionInsight: z
    .string()
    .describe(
      "What their story says about how they connect as people",
    ),
});

const storyAnalysisSchema = z.object({
  headline: z
    .string()
    .describe(
      'One-liner summary of the dynamic, lowercase, e.g. "a chaos architect meets a peacekeeper"',
    ),
  player1: playerProfileSchema,
  player2: playerProfileSchema,
  dynamic: dynamicAnalysisSchema,
  surprises: z
    .array(z.string())
    .describe(
      "2-3 fun facts or surprising observations about the story that will make both players smile",
    ),
});

// ---------------------------------------------------------------------------
// Exported types (derived from Zod)
// ---------------------------------------------------------------------------

export type StoryAnalysis = z.infer<typeof storyAnalysisSchema>;
export type PlayerProfile = z.infer<typeof playerProfileSchema>;
export type DynamicAnalysis = z.infer<typeof dynamicAnalysisSchema>;

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------

export interface AnalyzeStoryInput {
  storyText: string;
  turns: Array<{
    playerId: string;
    content: string;
    turnNumber: number;
    responseTimeMs: number;
  }>;
  players: Array<{
    id: string;
    name: string;
    wordCount: number;
    avgResponseTimeMs: number;
  }>;
  gameMode: "word" | "sentence";
  turnTimer: number | null;
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildAnalysisPrompt(input: AnalyzeStoryInput): string {
  const { storyText, turns, players, gameMode, turnTimer } = input;

  const p1 = players[0];
  const p2 = players[1];

  // Names are always real — required at entry
  const p1Name = p1?.name ?? "";
  const p2Name = p2?.name ?? "";

  const p1Turns = turns
    .filter((t) => t.playerId === p1?.id)
    .map((t) => `"${t.content}" (${t.responseTimeMs}ms)`)
    .join(", ");

  const p2Turns = turns
    .filter((t) => t.playerId === p2?.id)
    .map((t) => `"${t.content}" (${t.responseTimeMs}ms)`)
    .join(", ");

  return `You are a perceptive storytelling analyst with a warm, witty voice. Two players just wrote a collaborative story together in a game called Twosome, taking turns adding one ${gameMode} at a time.

Your job: analyze their story and each player's contributions to reveal deep, surprising, sometimes funny insights about both players and their dynamic together. Think of it as a personality reading earned through creative play.

**Players:**
- First player is named "${p1Name}". They contributed these turns: [${p1Turns}]
  Average response time: ${p1?.avgResponseTimeMs ?? 0}ms
  Words contributed: ${p1?.wordCount ?? 0}

- Second player is named "${p2Name}". They contributed these turns: [${p2Turns}]
  Average response time: ${p2?.avgResponseTimeMs ?? 0}ms
  Words contributed: ${p2?.wordCount ?? 0}

**Game mode:** ${gameMode} by ${gameMode}
**Timer:** ${turnTimer ? `${turnTimer}s per turn` : "no timer"}
**Full story:** "${storyText}"

**Analysis guidelines:**
- Be specific — reference actual words and moments from THEIR story
- Be insightful — go beyond "one player used more words"
- Be warm and playful — this should make them smile
- Be surprising — find patterns they didn't notice
- Never be mean or judgmental — this is about connection
- The sync score should feel earned, not random
- If the story is chaotic/broken, that's data too — embrace it
- Response times matter: fast = instinctive, slow = deliberate
- Word choice matters: abstract vs concrete, emotional vs logical
- Who introduced new elements vs who built on existing ones
- Keep the headline lowercase and punchy

**CRITICAL — Names:**
- In the "player1" field of your response, set "name" to "${p1Name}" exactly
- In the "player2" field of your response, set "name" to "${p2Name}" exactly
- NEVER say "Player 1" or "Player 2" or "player one" or "player two" anywhere
- Always refer to each player by their given name: "${p1Name}" and "${p2Name}"
- This applies to ALL text fields: read, summary, connectionInsight, surprises, signatureMove, etc.`;
}

// ---------------------------------------------------------------------------
// Post-process: force real names over generic "Player 1/2" in all text fields
// ---------------------------------------------------------------------------

function replaceAll(text: string, p1Name: string, p2Name: string): string {
  // Match "Player 1" / "Player One" / "player 1" / "Player2" and possessive forms
  const p1Pattern = /\bPlayer\s*(?:1|one|One)(?:'s|\u2019s)?\b/gi;
  const p2Pattern = /\bPlayer\s*(?:2|two|Two)(?:'s|\u2019s)?\b/gi;
  // Also match bare "the player" / "the first player" / "the second player"
  const firstPlayerPattern = /\bthe first player(?:'s|\u2019s)?\b/gi;
  const secondPlayerPattern = /\bthe second player(?:'s|\u2019s)?\b/gi;

  const replacer = (name: string) => (match: string) => {
    const lower = match.toLowerCase();
    if (lower.endsWith("'s") || lower.endsWith("\u2019s")) return `${name}'s`;
    return name;
  };

  return text
    .replace(p1Pattern, replacer(p1Name))
    .replace(p2Pattern, replacer(p2Name))
    .replace(firstPlayerPattern, replacer(p1Name))
    .replace(secondPlayerPattern, replacer(p2Name));
}

function fixNames(analysis: StoryAnalysis, p1Name: string, p2Name: string): StoryAnalysis {
  const fixProfile = (p: StoryAnalysis["player1"]): StoryAnalysis["player1"] => ({
    ...p,
    name: p === analysis.player1 ? p1Name : p2Name,
    role: replaceAll(p.role, p1Name, p2Name),
    read: replaceAll(p.read, p1Name, p2Name),
    patterns: p.patterns.map((s) => replaceAll(s, p1Name, p2Name)),
    signatureMove: replaceAll(p.signatureMove, p1Name, p2Name),
  });

  return {
    ...analysis,
    headline: replaceAll(analysis.headline, p1Name, p2Name),
    player1: fixProfile(analysis.player1),
    player2: fixProfile(analysis.player2),
    dynamic: {
      ...analysis.dynamic,
      syncLabel: replaceAll(analysis.dynamic.syncLabel, p1Name, p2Name),
      summary: replaceAll(analysis.dynamic.summary, p1Name, p2Name),
      style: replaceAll(analysis.dynamic.style, p1Name, p2Name),
      connectionInsight: replaceAll(analysis.dynamic.connectionInsight, p1Name, p2Name),
    },
    surprises: analysis.surprises.map((s) => replaceAll(s, p1Name, p2Name)),
  };
}

// ---------------------------------------------------------------------------
// Main export: analyzeStory()
// ---------------------------------------------------------------------------

export async function analyzeStory(
  input: AnalyzeStoryInput,
): Promise<StoryAnalysis> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "Missing VITE_GOOGLE_AI_API_KEY — add your Gemini API key to .env",
    );
  }

  try {
    const { output } = await generateText({
      model: google("gemini-2.5-flash"),
      output: Output.object({ schema: storyAnalysisSchema }),
      prompt: buildAnalysisPrompt(input),
    });

    if (!output) {
      throw new Error("Gemini returned an empty response");
    }

    // Post-process: replace any "Player 1" / "Player 2" the AI may still use
    const p1Name = input.players[0]?.name ?? "";
    const p2Name = input.players[1]?.name ?? "";
    return fixNames(output, p1Name, p2Name);
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error("[gemini] Failed to generate structured analysis:", error.cause);
      console.error("[gemini] Raw text:", error.text);
      throw new Error("The AI couldn't analyze this story. Try again?");
    }
    throw error;
  }
}
