# Twosome — AI Features Spec

## Overview

After a game ends, two AI-powered features become available on the "fin." screen. The AI does NOT participate during gameplay — it only activates after the story is complete. Both features are triggered by the player tapping a button, making the reveal feel intentional and exciting.

**Provider:** Vercel AI SDK v6 + Google Gemini (client-side)
**Model:** `gemini-2.5-flash` (fast, cheap, structured output support)
**Trigger:** On-demand (player taps to reveal)
**Cost model:** Free for now, potential premium gate later
**Architecture:** Direct browser → Gemini API call (no serverless / no edge functions)
**API key security:** Google Cloud Console HTTP referrer restriction (`*.vercel.app`, `localhost:*`)

---

## Tech Stack Addition

| Layer | Choice | Rationale |
|---|---|---|
| AI SDK | `ai` v6 (Vercel AI SDK) | `generateText` + `Output.object` for type-safe structured output with Zod validation |
| AI Provider | `@ai-sdk/google` | Google Gemini provider, `createGoogleGenerativeAI({ apiKey })` for browser usage |
| Schema validation | `zod` | Defines structured output schema, auto-validates Gemini response, generates TypeScript types |
| Execution | Client-side (browser) | No serverless functions needed — direct API call from React component |

### Dependencies to add

```bash
cd apps/web
pnpm add ai @ai-sdk/google zod
```

### Environment variable

```
# In .env at workspace root (Vite reads from envDir: "../..")
# Prefixed with VITE_ so it's available in browser code
VITE_GOOGLE_AI_API_KEY=your-gemini-api-key
```

### API key restriction (required)

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit the API key
3. Under "Application restrictions" → HTTP referrers
4. Add: `*.vercel.app/*` and `localhost:*`
5. Under "API restrictions" → Restrict to "Generative Language API"

---

## Feature 1: Polished Story

### Concept

The raw collaborative story is often grammatically broken and hilarious in its chaos. The AI rewrites it into a proper short story — same plot, same characters, same beats — but readable and polished. Both versions are shown side by side so players can see the contrast.

### UX Flow

1. Game ends → "fin." screen shows the raw story in the book page format
2. Below the book page, a button appears: **"✨ polish our story"**
3. Player taps → button shows loading state ("polishing...")
4. AI streams the polished version below the original
5. Both versions are visible — raw on top, polished below
6. Polished version uses the same book page component but with a different header: "the polished version"

### Prompt Design

```
You are a creative writing editor. Two players wrote a story together, 
taking turns adding one {word/sentence} at a time. The result is raw, 
often grammatically broken, and sometimes nonsensical — that's the charm.

Your job: rewrite their story into a polished, readable short paragraph. 
Keep the same plot beats, characters, tone, and key words they used. 
Don't add new plot points or characters. Don't make it longer than 
the original. Preserve their voice — if it's funny, keep it funny. 
If it's dark, keep it dark.

**Players:**
- {player1_name} (contributed: {player1_words})
- {player2_name} (contributed: {player2_words})

**Game mode:** {word|sentence} by {word|sentence}

**Their raw story:**
{full_story_text}

**Rules:**
- Output ONLY the polished story, no commentary
- Keep it to 1-3 short paragraphs max
- Preserve the spirit — don't sanitize their weirdness
- If the story is intentionally absurd, lean into it
```

### Data Model Addition

Add to `saved_stories` table (or a new `story_ai` table):

```sql
alter table public.saved_stories
  add column polished_text text,
  add column analysis jsonb;
```

### API Endpoint

```
POST /api/ai/polish
Body: { storyText, player1Name, player2Name, gameMode, turns[] }
Response: streamed text
```

---

## Feature 2: The Reveal — Player Analysis

### Concept

This is the signature feature. The AI reads the story and each player's individual contributions, then generates deep, surprising, sometimes funny insights about both players and their dynamic together. It's a personality reading earned through creative play.

### UX Flow

1. Below the polished story button, a second button: **"🔮 reveal what this says about you"**
2. Player taps → button shows loading state with rotating messages:
   - "reading between the lines..."
   - "analyzing your choices..."
   - "finding the hidden patterns..."
3. AI streams the analysis in a styled card
4. Analysis appears in sections with headers
5. A "share reveal" button lets players screenshot/share the analysis

### Analysis Structure

The AI generates a JSON response with these sections:

```typescript
interface StoryAnalysis {
  // One-liner summary of the dynamic
  headline: string;
  // e.g., "a chaos architect meets a peacekeeper"

  // Individual player profiles
  player1: PlayerProfile;
  player2: PlayerProfile;

  // The dynamic between them
  dynamic: DynamicAnalysis;

  // Fun facts / surprising observations
  surprises: string[];
}

interface PlayerProfile {
  name: string;
  
  // Their storytelling role
  role: string;
  // e.g., "the instigator", "the poet", "the wildcard"
  
  // 2-3 sentence personality read
  read: string;
  // e.g., "Sam writes like someone who's always 
  // three steps ahead. Short, punchy words that 
  // steer the story toward action. Classic 'let's 
  // see what happens' energy."
  
  // Key patterns observed
  patterns: string[];
  // e.g., ["gravitates toward conflict", "uses 
  // concrete nouns", "responds fast — instinct over thought"]
  
  // Their signature word or phrase
  signatureMove: string;
  // e.g., "'suddenly' — Sam used it twice. 
  // Always escalating."
}

interface DynamicAnalysis {
  // How well they sync
  syncScore: number; // 1-10
  syncLabel: string;
  // e.g., 8 — "eerily in tune"
  
  // The dynamic in one sentence  
  summary: string;
  // e.g., "Sam builds the world, Babe populates 
  // it with feelings. You two write like a director 
  // and a screenwriter."
  
  // Communication style comparison
  style: string;
  // e.g., "Sam is telegraphic — every word 
  // carries weight. Babe is expansive — paints 
  // the scene. The contrast is what makes 
  // the story interesting."
  
  // What their story says about how they connect
  connectionInsight: string;
  // e.g., "You built on each other's ideas instead 
  // of fighting for control. That's rare. Most pairs 
  // we see try to steer the story — you two let it 
  // happen together."
}
```

### Prompt Design

```
You are a perceptive storytelling analyst with a warm, witty voice. 
Two players just wrote a collaborative story together in a game called 
Twosome, taking turns adding one {word/sentence} at a time.

Your job: analyze their story and each player's contributions to 
reveal deep, surprising, sometimes funny insights about both players 
and their dynamic together. Think of it as a personality reading 
earned through creative play.

**Players:**
- {player1_name}: contributed these turns: [{turn1}, {turn3}, {turn5}, ...]
  Average response time: {avg_ms}ms
  Words contributed: {word_count}
  
- {player2_name}: contributed these turns: [{turn2}, {turn4}, {turn6}, ...]
  Average response time: {avg_ms}ms
  Words contributed: {word_count}

**Game mode:** {word|sentence}
**Timer:** {seconds}s per turn (or "no timer")
**Full story:** {story_text}

**Analysis guidelines:**
- Be specific — reference actual words and moments from THEIR story
- Be insightful — go beyond "player 1 used more words"
- Be warm and playful — this should make them smile
- Be surprising — find patterns they didn't notice
- Never be mean or judgmental — this is about connection
- The sync score should feel earned, not random
- If the story is chaotic/broken, that's data too — embrace it
- Response times matter: fast = instinctive, slow = deliberate
- Word choice matters: abstract vs concrete, emotional vs logical
- Who introduced new elements vs who built on existing ones

**Response format:** Return ONLY valid JSON matching this structure:
{
  "headline": "...",
  "player1": {
    "name": "...",
    "role": "...",
    "read": "...",
    "patterns": ["...", "..."],
    "signatureMove": "..."
  },
  "player2": {
    "name": "...",
    "role": "...",
    "read": "...",
    "patterns": ["...", "..."],
    "signatureMove": "..."
  },
  "dynamic": {
    "syncScore": 0,
    "syncLabel": "...",
    "summary": "...",
    "style": "...",
    "connectionInsight": "..."
  },
  "surprises": ["...", "..."]
}
```

### UI Design for the Reveal

```
┌──────────────────────────────────────┐
│  🔮 "a chaos architect meets        │
│     a peacekeeper"                   │
├──────────────────────────────────────┤
│                                      │
│  ┌─── SAM ────────────────────────┐  │
│  │ THE INSTIGATOR                 │  │
│  │                                │  │
│  │ "Sam writes like someone who's │  │
│  │ always three steps ahead..."   │  │
│  │                                │  │
│  │ • gravitates toward conflict   │  │
│  │ • uses concrete nouns          │  │
│  │ • responds fast — instinct     │  │
│  │                                │  │
│  │ signature: "suddenly" — used   │  │
│  │ it twice. always escalating.   │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌─── BABE ───────────────────────┐  │
│  │ THE POET                       │  │
│  │                                │  │
│  │ "Babe brings the weather and   │  │
│  │ the feelings..."               │  │
│  │                                │  │
│  │ • introduces atmosphere        │  │
│  │ • emotional vocabulary         │  │
│  │ • takes time — thoughtful      │  │
│  │                                │  │
│  │ signature: "quietly" — Babe    │  │
│  │ softens every scene.           │  │
│  └────────────────────────────────┘  │
│                                      │
├──────────────────────────────────────┤
│  SYNC SCORE                          │
│  ████████░░  8/10                    │
│  "eerily in tune"                    │
│                                      │
│  "Sam builds the world, Babe        │
│  populates it with feelings.         │
│  You two write like a director       │
│  and a screenwriter."                │
│                                      │
├──────────────────────────────────────┤
│  💡 SURPRISES                        │
│                                      │
│  • Neither of you used the word      │
│    "love" but the whole story        │
│    is about finding something        │
│    precious. Make of that what       │
│    you will.                         │
│                                      │
│  • Sam's response time dropped       │
│    to 1.2s after Babe wrote          │
│    "discovered" — something          │
│    clicked.                          │
│                                      │
└──────────────────────────────────────┘

  [ share reveal ↗ ]
```

### Styling Notes

- Headline in coral, large font
- Player cards: P1 card has coral left border, P2 card has ink left border
- Role labels: uppercase monospaced, like the existing mono-label style
- Read text: serif/Georgia for a literary feel (matches the book page)
- Patterns: bullet list in mono
- Sync score: custom progress bar, coral fill
- Surprises: separated by divider, slightly lighter tone
- The whole reveal section has a subtle entrance animation (fade up, staggered)

---

## Architecture: Client-Side AI SDK

### Why client-side?

- **No serverless functions** — no Supabase Edge Functions, no Vercel API routes
- **Zero infrastructure** — same `git push` deploy, no separate function deployments
- **AI SDK v6** handles structured output with Zod schema validation
- **API key protected** via Google Cloud HTTP referrer restriction (domain-locked)

### File structure

```
apps/web/src/lib/
  gemini.ts              ← AI SDK setup + analyzeStory() + polishStory()

apps/web/src/components/games/story-builder/
  reveal-card.tsx        ← The Reveal UI (player profiles, sync score, surprises)
  reveal-loading.tsx     ← Rotating loading messages with pulse animation
```

### Core implementation pattern

```typescript
// apps/web/src/lib/gemini.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY,
});

// Zod schema = single source of truth for:
//   1. Gemini's structured output format
//   2. Response validation
//   3. TypeScript types (z.infer<typeof storyAnalysisSchema>)

const storyAnalysisSchema = z.object({
  headline: z.string(),
  player1: playerProfileSchema,
  player2: playerProfileSchema,
  dynamic: dynamicAnalysisSchema,
  surprises: z.array(z.string()),
});

export async function analyzeStory(input: AnalyzeStoryInput) {
  const { output } = await generateText({
    model: google('gemini-2.5-flash'),
    output: Output.object({ schema: storyAnalysisSchema }),
    prompt: buildAnalysisPrompt(input),
  });
  return output; // Already typed & validated by Zod
}
```

### Client-side invocation

```typescript
// In finished.tsx
import { analyzeStory } from '@/lib/gemini';

const handleReveal = async () => {
  setRevealing(true);
  try {
    const analysis = await analyzeStory({
      storyText,
      turns,
      players: [
        { name: contributions.player1.name, ...contributions.player1 },
        { name: contributions.player2.name, ...contributions.player2 },
      ],
      gameMode: room.gameMode,
      turnTimer: room.turnTimer,
    });
    setAnalysis(analysis);
  } catch (err) {
    setRevealError('Something went wrong. Tap to try again.');
  } finally {
    setRevealing(false);
  }
};
```

---

## Type Definitions (Zod Schemas)

### In `apps/web/src/lib/gemini.ts` (Zod schemas — source of truth)

```typescript
import { z } from 'zod';

const playerProfileSchema = z.object({
  name: z.string(),
  role: z.string().describe('Their storytelling role, e.g. "the instigator", "the poet"'),
  read: z.string().describe('2-3 sentence personality read based on their contributions'),
  patterns: z.array(z.string()).describe('Key patterns observed in their writing'),
  signatureMove: z.string().describe('Their signature word, phrase, or habit'),
});

const dynamicAnalysisSchema = z.object({
  syncScore: z.number().describe('How well they sync, 1-10'),
  syncLabel: z.string().describe('Short label for the sync score, e.g. "eerily in tune"'),
  summary: z.string().describe('The dynamic between them in one sentence'),
  style: z.string().describe('Communication style comparison'),
  connectionInsight: z.string().describe('What their story says about how they connect'),
});

const storyAnalysisSchema = z.object({
  headline: z.string().describe('One-liner summary of the dynamic, e.g. "a chaos architect meets a peacekeeper"'),
  player1: playerProfileSchema,
  player2: playerProfileSchema,
  dynamic: dynamicAnalysisSchema,
  surprises: z.array(z.string()).describe('Fun facts or surprising observations about the story'),
});

// TypeScript types derived from Zod
export type StoryAnalysis = z.infer<typeof storyAnalysisSchema>;
export type PlayerProfile = z.infer<typeof playerProfileSchema>;
export type DynamicAnalysis = z.infer<typeof dynamicAnalysisSchema>;
```

### In `packages/shared/src/types/index.ts` (plain interfaces for cross-package use)

```typescript
export interface StoryAnalysis {
  headline: string;
  player1: PlayerProfile;
  player2: PlayerProfile;
  dynamic: DynamicAnalysis;
  surprises: string[];
}

export interface PlayerProfile {
  name: string;
  role: string;
  read: string;
  patterns: string[];
  signatureMove: string;
}

export interface DynamicAnalysis {
  syncScore: number;
  syncLabel: string;
  summary: string;
  style: string;
  connectionInsight: string;
}
```

### Input type for `analyzeStory()`

```typescript
export interface AnalyzeStoryInput {
  storyText: string;
  turns: Array<{
    playerId: string;
    content: string;
    turnNumber: number;
    responseTimeMs: number;
  }>;
  players: Array<{
    name: string;
    wordCount: number;
    avgResponseTimeMs: number;
  }>;
  gameMode: 'word' | 'sentence';
  turnTimer: number | null;
}
```

> **Note:** No new ports, commands, or handlers needed. The AI call is a simple utility function called directly from the React component. This keeps the architecture lightweight — no CQRS overhead for a read-only, stateless AI call.

---

## Updated "fin." Screen Flow

```
1. Game ends → navigate to /finished/:roomId

2. Screen shows:
   - "fin." title
   - "you two wrote something" subtitle
   - Raw story in book page format
   - Fun stats (fastest fingers, longest word, etc.)
   - ────────────────────────────────
   - [ ✨ polish our story ]        ← NEW
   - [ 🔮 reveal what this says ]   ← NEW
   - ────────────────────────────────
   - [ share story ↗ ]
   - [ again ] [ new game ]
   - Signup nudge (if anonymous)

3. Tap "polish" → loading → polished story streams in below raw story

4. Tap "reveal" → loading with rotating messages → analysis card appears

5. Both results are cached in state (and optionally saved to DB with the story)

6. "share reveal ↗" generates a shareable card/text of the analysis
```

---

## Milestones

### M1: The Reveal — Story Analysis (Priority)
- [ ] Install `ai`, `@ai-sdk/google`, `zod` in `apps/web`
- [ ] Add `VITE_GOOGLE_AI_API_KEY` to `.env` + Vercel dashboard
- [ ] Create `apps/web/src/lib/gemini.ts` — AI SDK setup, Zod schemas, `analyzeStory()` function
- [ ] Add `StoryAnalysis` types to `packages/shared/src/types/index.ts`
- [ ] Create `reveal-card.tsx` — headline, player cards, sync score, surprises (Framer Motion staggered fade-up)
- [ ] Create `reveal-loading.tsx` — rotating message carousel with pulse animation
- [ ] Update `finished.tsx` — "🔮 reveal" button, loading state, error handling, render RevealCard
- [ ] Test locally with real game data
- [ ] Deploy to Vercel + test on both phones

### M2: Polish Story
- [ ] Add `polishStory()` to `gemini.ts`
- [ ] Build the polish prompt
- [ ] Add "✨ polish our story" button to fin screen
- [ ] Render polished text in a second BookPage component below the raw story
- [ ] Cache result in component state

### M3: Persistence (deferred)
- [ ] Migration: add `polished_text text`, `analysis jsonb` to `saved_stories`
- [ ] Add `UPDATE` RLS policy to `saved_stories` (currently missing)
- [ ] Update `SupabaseStoryRepository` to read/write analysis + polished text
- [ ] Check for cached results before calling AI
- [ ] Don't re-call AI if results already exist for this story

---

## Future Enhancements

- **AI story prompts** — before the game starts, offer AI-generated starter prompts based on the players' names or past stories
- **AI game master** — mid-game challenges like "next 3 words must rhyme" or "introduce a villain"
- **Cross-game analysis** — after 5+ games, analyze patterns across all stories ("you always write about escape")
- **Compatibility report** — after multiple games with the same partner, generate a relationship/friendship compatibility report
- **Voice of the story** — AI reads the polished story aloud with TTS (ElevenLabs)