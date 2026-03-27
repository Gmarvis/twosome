# Twosome — Product & Technical Spec v1

## Brand

**Name:** twosome.
**Tagline:** games for two humans ↗
**Positioning:** A quirky, fun real-time game app for two people. Works for friends, early connections, or couples — the brand never labels the relationship. The romance is in the subtext, not the branding.

### Visual Identity

- **Logo mark:** Black rounded square with two overlapping circles — one Hot Coral, one white. The coral circle nudges into the white one (the "nudge" concept — implies connection without stating it).
- **Typography:** Outfit (display, headings — weight 700-900) + Space Mono (utility text, labels, stats)
- **Accent color:** Hot Coral `#F43F5E` — warm, flirty, bold without being aggressive
- **Color system:**
  - Background: `#F5F1EB` (warm paper)
  - Ink: `#1A1A1A` (near-black)
  - Ink 50%: `rgba(26,26,26,0.5)` (muted text)
  - Ink 20%: `rgba(26,26,26,0.15)` (borders, dividers)
  - White: `#FFFFFF` (cards, inputs)
  - Pop: `#F43F5E` (Hot Coral — accent, player 1)
  - Pop Dark: `#BE123C` (dark coral for text on coral bg)
  - Pop Soft: `#FFF1F2` (light coral for chip/badge bg)
  - Warm Gray: `#3D3A37` (softer alternative to pure black for body text)
- **Design language:** Thick 2.5px borders, monospaced utility labels, no gradients (except the logo mark), no shadows, no rounded-everything. Bold, graphic, intentional.
- **Player colors:** Player 1 = Hot Coral / Player 2 = Ink Black

### Brand Voice

The voice is a friend who's fun but not trying too hard. Lowercase, casual, occasionally cheeky.

Key copy:
- "start something" (not "create room")
- "jump in" (not "join room")
- "you're up" (not "your turn")
- "waiting on your person..." (lobby waiting state)
- "who are you?" (name input placeholder)
- "once upon a..." (starter prompt placeholder)
- "no signup · no bs · just play" (footer)
- "fin." (story complete title)
- "you two wrote something" (completion subtitle)
- "your person vanished. rude." (partner disconnect)
- "this room's taken — they've got company already" (room full error)

---

## V1 Scope: Story Builder

### Concept

Two players take turns adding to a shared story in real-time. Each turn, a player adds either a single word or a sentence (chosen at room creation). The result is a collaborative, often hilarious story you built together — color-coded by player, saveable, and shareable.

### User Flow

#### 1. Home Screen
- App logo + "twosome." branding
- Name input (placeholder: "who are you?")
- "start something →" button (creates room)
- "jump in" button (joins room)
- Footer: "no signup · no bs · just play"

#### 2. Room Setup (Host only)
- Game title: "story builder" / subtitle: "build nonsense together"
- Mode selection chips: "word" | "sentence"
- Timer selection chips: 5s | 10s | 15s | off
- Turn count chips: 10 | 20 | 50 | ∞
- Optional starter prompt input (placeholder: "once upon a...")
- "let's go →" button

#### 3. Lobby
- 6-character room code displayed in individual character boxes
- "tap to copy" action (copies room code to clipboard)
- Header status: "waiting on your person..."
- Player cards showing:
  - Avatar circle (P1 = coral bg, P2 = ink bg) with initial letter
  - Display name
  - Role (host / joined)
  - Ready status (coral "ready" / muted "...")
- Game settings pills (mode, timer, turns)
- "let's go" button — disabled until both players ready

#### 4. Gameplay
- Header: logo mark + turn counter ("8 / 20") + timer ring (coral border, countdown number)
- Progress bar (coral gradient fill)
- Turn indicator pill: "you're up" (coral bg) or "waiting" (muted bg)
- Partner status: "babe is watching" (when it's your turn)
- Story area: white card with thick border, story text grows in real-time
  - Player 1 words in Hot Coral, bold
  - Player 2 words in Ink Black, normal weight
  - Blinking cursor in active player's color
- Input area: text field + send button (↑ arrow)
- Player color legend at bottom

#### 5. Story Complete ("fin.")
- "fin." title in Hot Coral (48px)
- Subtitle: "you two wrote something"
- Story rendered as a "book page":
  - Slightly warm white background (#FFFCF7)
  - Left margin line in coral
  - Serif font (Georgia) for the story text
  - Player words still color-coded (P1 italic coral, P2 normal ink)
  - Date stamp header: "twosome — march 27, 2026"
  - Footer: "Sam & Babe" + "20 words · 2m 14s"
- Fun stats with playful labels:
  - "fastest fingers" → player name + time
  - "longest word" → player name + the word
  - "caught slacking" → player name + skip count
- Actions: "share story ↗" (primary), "again" / "new game" (secondary)

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Vite + React + TypeScript | Sam's core stack, fast dev cycle |
| Styling | Tailwind CSS | Rapid UI, mobile-first |
| Real-time | Supabase Realtime (Presence + Broadcast) | Familiar from Rabbit Dairy, handles rooms + turn sync |
| Database | Supabase Postgres | Store rooms, games, saved stories |
| Auth | Supabase Auth (anonymous → Google/Apple social login) | Zero friction start, one-tap upgrade |
| Deployment | Vercel | Quick, free tier works for MVP |
| PWA | vite-plugin-pwa | Installable on mobile, offline landing |
| Future native | Capacitor | Wrap PWA for App Store + native APIs (push, haptics) |

### Why PWA → Capacitor?

1. Ship v1 as PWA in days, not weeks
2. Validate the idea with real users
3. Direct link sharing (zero friction to join a game)
4. When ready, wrap with Capacitor to add:
   - Push notifications ("you're up" / "your person is waiting")
   - Haptic feedback (submit word, timer warning, game complete)
   - Game sounds
   - App Store presence
5. No code rewrite — same React app, native shell

---

## User System & Auth

### Philosophy: Play First, Sign Up Later

The core promise is "no signup · no bs · just play." Users can play their first game completely anonymously. After they've experienced the product, we nudge them to create an account to unlock persistence.

### Auth Flow

1. **First visit:** Supabase anonymous auth session created automatically. User picks a display name and plays immediately.
2. **Post-game nudge:** After the first game ends, the "save story" button triggers a signup prompt: "sign up to keep this — it'd be a shame to lose it."
3. **Sign up:** Google or Apple social login (one tap). Supabase `linkIdentity()` upgrades the anonymous session to a real account — all data from the anonymous session is preserved.
4. **Returning user:** Auto-signed-in via Supabase session persistence. Lands on home screen with their name, avatar, and friend list.

### Nudge Moments (Gentle, Never Blocking)

| Moment | Copy | Can dismiss? |
|---|---|---|
| After first game, taps "save story" | "sign up to keep this — one tap, we promise" | Yes, story is lost |
| Second game start (still anonymous) | "add [partner] as a friend? no more codes next time" | Yes |
| Home screen after 2+ anon games | Small banner: "you've got 3 unsaved stories" | Yes |
| Friend list (empty, not signed in) | "sign up to start building your crew" | Yes |

A hard wall is never shown. Anonymous users can play unlimited games — they just can't save stories, add friends, or build a profile.

### What an Account Unlocks

| Feature | Anonymous | Signed in |
|---|---|---|
| Play games | Yes | Yes |
| See story at end of game | Yes | Yes |
| Save stories to archive | No | Yes |
| View past stories | No | Yes |
| Friend list | No | Yes |
| Invite friend directly (no code) | No | Yes |
| Player profile + avatar | No | Yes |
| Match history | No | Yes |
| Lifetime stats | No | Yes |

---

## Data Model (Supabase)

### users (extends Supabase auth.users)
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, matches auth.users.id |
| display_name | text | Chosen display name |
| avatar_url | text | From social login or custom upload |
| avatar_color | text | Fallback color for initial-letter avatar (e.g., "#F43F5E") |
| total_games | int | Lifetime game count, default 0 |
| total_words | int | Lifetime words written, default 0 |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### friends
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → users.id (the requester) |
| friend_id | uuid | FK → users.id (the friend) |
| status | text | "pending" / "accepted" |
| created_at | timestamptz | Default now() |

*Unique constraint on (user_id, friend_id). Friendship is bidirectional — when accepted, query both directions.*

### rooms
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| code | text | Unique, 6-char alphanumeric |
| host_id | uuid | FK → users.id (nullable for anonymous) |
| game_mode | text | "word" or "sentence" |
| turn_timer | int | Seconds (5, 10, 15) or null (no timer) |
| max_turns | int | 10, 20, 50, or null (unlimited) |
| prompt | text | Optional starter prompt |
| status | text | "waiting" / "playing" / "finished" |
| created_at | timestamptz | Default now() |

### room_players
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| room_id | uuid | FK → rooms.id |
| user_id | uuid | FK → users.id (nullable for anonymous) |
| display_name | text | Name shown in game |
| is_host | bool | Default false |
| is_ready | bool | Default false |
| joined_at | timestamptz | Default now() |

### turns
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| room_id | uuid | FK → rooms.id |
| player_id | uuid | FK → room_players.id |
| content | text | The word or sentence submitted |
| turn_number | int | Sequential turn index |
| response_time_ms | int | Time taken to submit (for stats) |
| created_at | timestamptz | Default now() |

### saved_stories
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| room_id | uuid | FK → rooms.id |
| user_id | uuid | FK → users.id (who saved it — both players can save independently) |
| full_text | text | Complete story string |
| player_contributions | jsonb | { player1: { name, user_id, words, avg_time }, player2: { ... } } |
| stats | jsonb | { fastest: { player, time }, longest_word: { player, word }, skips: { player, count }, duration_seconds } |
| created_at | timestamptz | Default now() |

*Unique constraint on (room_id, user_id) — each player saves their own copy.*

---

## Real-time Architecture

Using Supabase Realtime Channels, one channel per room:

### Presence
- Track who's in the room
- Ready status toggle
- Online/offline detection
- Typing indicator (player is composing their word)

### Broadcast Events
| Event | Payload | Trigger |
|---|---|---|
| player_ready | { player_id, is_ready } | Player toggles ready |
| game_start | { first_player_id } | Both players ready, host starts |
| turn_submit | { player_id, content, turn_number } | Player submits word/sentence |
| turn_skip | { player_id, turn_number } | Timer expires |
| game_end | { story_id } | Max turns reached or both agree to end |
| typing | { player_id } | Player is composing (debounced) |

### Flow
```
Player A submits word
  → INSERT into turns table
  → Broadcast "turn_submit" event
  → Both clients update story display
  → Active player swaps
  → Timer resets
```

---

## Project Structure

```
twosome/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── ui/              # Button, Input, Chip, PlayerCard, Timer
│   │   ├── layout/          # PhoneFrame (dev only), Header, BottomNav
│   │   ├── auth/            # SignUpNudge, SocialLoginButtons, AuthGuard
│   │   ├── profile/         # ProfileScreen, AvatarEditor, StatsOverview
│   │   ├── friends/         # FriendList, AddFriend, FriendInvite
│   │   ├── stories/         # StoryArchive, StoryCard, StoryDetail
│   │   ├── room/            # CreateRoom, JoinRoom, Lobby
│   │   └── games/
│   │       └── story-builder/
│   │           ├── GameBoard.tsx
│   │           ├── StoryDisplay.tsx
│   │           ├── TurnInput.tsx
│   │           ├── StoryComplete.tsx
│   │           └── BookPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts        # Auth state, anonymous → social upgrade
│   │   ├── useUser.ts        # User profile CRUD
│   │   ├── useFriends.ts     # Friend list, requests, invites
│   │   ├── useRoom.ts        # Room CRUD + subscription
│   │   ├── usePresence.ts    # Player presence tracking
│   │   ├── useGameState.ts   # Turn management, timer, game flow
│   │   └── useStory.ts       # Story accumulation + stats
│   ├── lib/
│   │   ├── supabase.ts       # Client init
│   │   ├── auth.ts           # Social login helpers, session upgrade
│   │   ├── realtime.ts       # Channel helpers
│   │   ├── roomCode.ts       # Generate/validate 6-char codes
│   │   └── stats.ts          # Calculate game stats
│   ├── stores/
│   │   ├── authStore.ts      # Zustand: auth state, user profile
│   │   ├── gameStore.ts      # Zustand: game state
│   │   └── playerStore.ts    # Zustand: local player info
│   ├── types/
│   │   └── index.ts          # Shared TypeScript types
│   └── styles/
│       └── index.css          # Tailwind base + custom properties
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
├── capacitor.config.ts        # Future: native wrapper config
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## MVP Milestones

### M1: Foundation (Day 1-2)
- [ ] Vite + React + TS + Tailwind project setup
- [ ] Supabase project creation + tables + RLS policies
- [ ] Supabase anonymous auth (auto-session on first visit)
- [ ] Design system: colors, typography, components (Button, Input, Chip)
- [ ] PWA manifest + service worker setup

### M2: Room System (Day 3-4)
- [ ] Room code generation (6-char, collision-resistant)
- [ ] Create room flow (setup screen → room created in DB)
- [ ] Join room flow (enter code → validate → join)
- [ ] Lobby screen with Supabase Presence (both players visible)
- [ ] Ready toggle with real-time sync

### M3: Story Builder Core (Day 5-7)
- [ ] Turn-based input with real-time sync via Broadcast
- [ ] Story display with player color-coding
- [ ] Turn timer (countdown, auto-skip on expire)
- [ ] Progress tracking (turn counter, progress bar)
- [ ] Game completion detection (max turns reached)

### M4: Auth & User System (Day 8-9)
- [ ] Google + Apple social login (Supabase Auth providers)
- [ ] Anonymous → authenticated session upgrade (linkIdentity)
- [ ] Post-game signup nudge ("save this story?")
- [ ] User profile screen (name, avatar from social, stats)
- [ ] Story archive (save to Supabase, view past stories)

### M5: Social & Polish (Day 10-12)
- [ ] Friend list (add by username or from match history)
- [ ] Direct invite (start game with friend, skip room code)
- [ ] Match history (who you played with, when)
- [ ] "fin." screen with book page story rendering
- [ ] Fun stats calculation + display
- [ ] Share story (generate shareable image/link)
- [ ] Typing indicator
- [ ] Disconnect handling ("your person vanished. rude.")
- [ ] Mobile UX polish (safe areas, keyboard handling, scroll behavior)

### M6: Capacitor Upgrade (Future)
- [ ] Capacitor integration
- [ ] Push notifications ("you're up" / "your person is waiting")
- [ ] Haptic feedback (word submit, timer at 3s, game complete)
- [ ] App Store submission (iOS + Android)

---

## Future Games (V2+)

The room/lobby system is game-agnostic. Adding games = adding a new component that consumes the same room context.

1. **Couples Quiz** — "How well do you know me?" Both answer the same questions, compare results.
2. **Tap Battle** — Real-time reflex/speed tapping competition.
3. **Draw & Guess** — One draws on a canvas, the other guesses.
4. **Truth or Dare** — Randomized prompts with custom additions.
5. **Love Letter** — Timed writing challenge, then read each other's letters.

---

## Competitive Landscape

| App | What it does | How Twosome differs |
|---|---|---|
| One Word (web) | Collaborative word-at-a-time story | Bare-bones, no rooms, no branding, no stats, no save |
| Lovify / Flamme / Couple Game | Quiz-based couples apps | Quiz only, no creative games, branded as "couples" (limits audience) |
| Words With Friends / Wordfeud | Competitive Scrabble-style | Competitive vocabulary tests, not collaborative creativity |
| Jackbox Games | Party games for groups | Requires 3+ players, not mobile-first, not designed for two |

**Twosome's gap:** Real-time, mobile-first, creative mini-games designed for two people — without labeling itself a "couples" app.

---

## Open Questions

- **Monetization:** Free forever? Freemium (free games + premium games)? Cosmetics (story themes, avatars)?
- **Moderation:** User-generated content (story text) — any content filtering needed?
- **Analytics:** What events to track for product decisions?
- **Sound design:** Game sounds and music — budget for audio assets?
- **Localization:** English-only for v1, or plan for French (Cameroon market)?