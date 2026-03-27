# Twosome — User Stories

## Epic 1: First-time experience

### US-1.1: Landing on the app
**As a** new visitor
**I want to** see what this app is about in under 3 seconds
**So that** I decide whether to play

**Acceptance criteria:**
- Logo mark, "twosome." title, and tagline "games for two humans ↗" are visible immediately
- Two clear actions: "start something →" and "jump in"
- Footer reads "no signup · no bs · just play"
- No signup wall, no onboarding carousel, no loading screen
- Name input field with placeholder "who are you?"
- App feels native on mobile (no browser chrome feeling, safe area respected)

### US-1.2: Entering a display name
**As a** new visitor
**I want to** type my name before playing
**So that** my partner sees who I am

**Acceptance criteria:**
- Single text input, placeholder "who are you?"
- Max 20 characters
- Name persists across the session (stored in Zustand + localStorage)
- Cannot proceed to create or join a room without entering at least 1 character
- No validation beyond non-empty — emojis, unicode, anything goes

### US-1.3: Anonymous session
**As a** new visitor
**I want to** play immediately without creating an account
**So that** there's zero friction to my first game

**Acceptance criteria:**
- Supabase anonymous auth session is created automatically on first visit
- No visible auth UI — it happens silently in the background
- Session persists if I close and reopen the tab (within session expiry)
- All game features work without signing up (create room, join room, play, see results)
- Only saving stories, friend list, and profile require a real account

---

## Epic 2: Creating a room

### US-2.1: Navigating to room setup
**As a** player
**I want to** tap "start something →" on the home screen
**So that** I can configure a new game

**Acceptance criteria:**
- Navigates to `/setup` route
- Back arrow (←) returns to home screen
- Logo mark is visible in the header
- Display name from home screen carries over

### US-2.2: Choosing game mode
**As a** host
**I want to** choose between "word" and "sentence" mode
**So that** we play the way I want

**Acceptance criteria:**
- Two chips: "word" and "sentence"
- One must be selected at all times (default: "word")
- "word" = each turn you type a single word
- "sentence" = each turn you type a full sentence
- Selection is visually clear (chip-active style: coral border, soft coral bg)

### US-2.3: Setting the turn timer
**As a** host
**I want to** choose how much time each player gets per turn
**So that** the game has the right pace

**Acceptance criteria:**
- Four chips: "5s", "10s", "15s", "off"
- Default: "10s"
- "off" means no time limit (turn lasts until player submits)
- When timer is active, it counts down during gameplay and auto-skips on expiry

### US-2.4: Setting story length
**As a** host
**I want to** choose how many turns the story lasts
**So that** the game has a clear endpoint

**Acceptance criteria:**
- Four chips: "10", "20", "50", "∞"
- Default: "20"
- "∞" means the game continues until a player manually ends it
- Total turns = combined turns for both players (20 turns = 10 per player)

### US-2.5: Adding a starter prompt
**As a** host
**I want to** optionally add a story starter
**So that** the story begins with a fun premise

**Acceptance criteria:**
- Text input with placeholder "once upon a..."
- Max 100 characters
- Optional — can be left blank
- If provided, the prompt appears at the start of the story in italic/muted text
- The prompt does NOT count as a turn

### US-2.6: Creating the room
**As a** host
**I want to** tap "let's go →" to create the room
**So that** I get a room code to share

**Acceptance criteria:**
- Button shows loading state ("creating...") while request is in progress
- Room is created in Supabase with all selected settings
- A unique 6-character alphanumeric room code is generated (no ambiguous chars: I/O/0/1)
- Host is automatically added as player 1 in the room
- Host is redirected to `/room/:code` (the lobby)
- Room has status "waiting"

---

## Epic 3: Joining a room

### US-3.1: Entering a room code
**As a** player 2
**I want to** enter a room code to join my partner's game
**So that** we can play together

**Acceptance criteria:**
- On home screen, tapping "jump in" reveals a room code input field
- Input auto-uppercases, max 6 characters, monospaced tracking-wide style
- A "go" button appears next to the input
- "go" is disabled until exactly 6 characters are entered
- On submit, navigates to `/room/:code`

### US-3.2: Joining the lobby
**As a** player 2
**I want to** see the host and game settings when I join
**So that** I know what I'm getting into

**Acceptance criteria:**
- Room is fetched from Supabase by code
- If room not found → error message: "room not found"
- If room is full (2 players already) → error: "this room's taken — they've got company already"
- If room is available → player 2 is created in `room_players` table
- Player 2 joins the Supabase realtime channel for this room
- Both players see each other's cards in the lobby
- Game settings chips are visible (mode, timer, turns)

### US-3.3: Sharing the room code
**As a** host in the lobby
**I want to** copy the room code easily
**So that** I can send it to my partner

**Acceptance criteria:**
- Room code is displayed as 6 individual character boxes (large, bold, monospaced)
- "tap to copy" text is below the code in coral
- Tapping it copies the code to clipboard
- Works on both mobile (navigator.clipboard) and desktop
- No toast/notification needed — the text briefly changing to "copied!" is sufficient

---

## Epic 4: The lobby

### US-4.1: Seeing players in the lobby
**As a** player
**I want to** see who's in the room
**So that** I know when my partner has joined

**Acceptance criteria:**
- Player cards show: avatar circle (initial letter), display name, role ("host" / "just joined"), ready status
- Host's avatar is coral (#F43F5E), player 2's avatar is ink black (#1A1A1A)
- If only 1 player, a dashed empty card shows "waiting for player 2..."
- Header shows "waiting on your person..." when 1 player, "ready up" when 2 players
- Player list updates in real-time via Supabase presence + polling fallback (every 2 seconds)

### US-4.2: Toggling ready status
**As a** player
**I want to** tap my player card to toggle "ready"
**So that** both players can signal they're ready to start

**Acceptance criteria:**
- Tapping your own player card toggles ready state
- Ready state is synced via Supabase (realtime broadcast + database update)
- When ready: card border turns coral, background turns soft coral, status shows "ready" in coral
- When not ready: card border is ink black, status shows ". . ." in muted gray
- You can only toggle YOUR OWN card, not your partner's
- Both players must be ready before the game can start

### US-4.3: Starting the game
**As the** host
**I want to** tap "let's go" when both players are ready
**So that** the game begins

**Acceptance criteria:**
- "let's go" button is only enabled when: 2 players present AND both are ready AND you're the host
- When disabled: button is faded (opacity 0.35)
- On tap: room status updates to "playing", game state is initialized
- A "game.started" event is broadcast to both players via realtime
- Both players are navigated to `/play/:roomId`
- Player 1 (host) takes the first turn

### US-4.4: Player disconnection in lobby
**As a** player
**I want to** know if my partner disconnects
**So that** I'm not stuck waiting forever

**Acceptance criteria:**
- If a player leaves the page or closes the tab, their presence is removed
- The remaining player sees the empty "waiting for player 2..." card again
- Ready states reset if a player leaves
- The disconnected player's `room_player` row is cleaned up

---

## Epic 5: Gameplay — Story Builder

### US-5.1: Seeing the game board
**As a** player
**I want to** see a clear game interface
**So that** I know what to do and whose turn it is

**Acceptance criteria:**
- Header: logo mark + turn counter ("8 / 20") + timer ring (if timer is enabled)
- Progress bar showing completion percentage (coral gradient fill)
- Turn indicator pill: "you're up" (coral, when it's your turn) or "waiting" (muted, when it's not)
- Partner status text: "babe is watching" / "babe is thinking"
- Story display area showing the growing story
- Input area at the bottom
- Player color legend: coral dot = player 1 name, ink dot = player 2 name

### US-5.2: Taking a turn (word mode)
**As the** active player in word mode
**I want to** type a single word and submit it
**So that** the story grows by one word

**Acceptance criteria:**
- Input placeholder: "type a word..."
- Max 30 characters
- Submit via Enter key or tapping the ↑ button
- Input is cleared after submission
- The word appears immediately in the story area (optimistic update)
- The turn is broadcast to the other player via realtime
- Active player swaps to the other player
- Timer resets (if timer is enabled)
- Turn counter increments

### US-5.3: Taking a turn (sentence mode)
**As the** active player in sentence mode
**I want to** type a sentence and submit it
**So that** the story grows by one sentence

**Acceptance criteria:**
- Input placeholder: "type a sentence..."
- Max 200 characters
- Same submit behavior as word mode
- Sentence appears in the story with proper spacing

### US-5.4: Waiting for partner's turn
**As the** inactive player
**I want to** see what's happening while I wait
**So that** I stay engaged

**Acceptance criteria:**
- Input field is disabled with muted styling
- Turn indicator shows "waiting" pill (muted)
- Status text shows "[partner name] is thinking"
- Story updates in real-time as partner submits
- Blinking cursor is NOT shown (only shown for active player)

### US-5.5: Timer countdown
**As a** player
**I want to** see a countdown timer during my turn
**So that** I know how much time I have

**Acceptance criteria:**
- Timer ring in the header shows remaining seconds
- Timer counts down from the configured value (5/10/15)
- At 3 seconds or below: timer ring turns coral (urgent state)
- At 0 seconds: turn is auto-skipped, active player swaps
- Timer resets when a new turn starts
- Timer is NOT shown when timer is set to "off"

### US-5.6: Timer expiry (auto-skip)
**As the** active player who didn't submit in time
**I want to** have my turn auto-skipped
**So that** the game doesn't stall

**Acceptance criteria:**
- When timer hits 0, a "turn.skipped" event is broadcast
- Active player swaps to the other player
- No word is added to the story for the skipped turn
- The skipped turn counts toward the skip stat
- The skip does NOT count as a turn toward max turns

### US-5.7: Story display with color coding
**As a** player
**I want to** see who wrote which part of the story
**So that** I can follow the back-and-forth

**Acceptance criteria:**
- Player 1's contributions are in coral (#F43F5E), bold weight
- Player 2's contributions are in ink black (#1A1A1A), normal weight
- Story area auto-scrolls to the latest word/sentence
- Starter prompt (if any) appears at the beginning in muted italic
- A blinking coral cursor appears after the last word when it's your turn

### US-5.8: Game completion
**As a** player
**I want to** see the game end when we reach max turns
**So that** we can see our completed story

**Acceptance criteria:**
- When the final turn is submitted and total turns = max turns, game ends automatically
- A "game.finished" event is broadcast with the full story, stats, and contributions
- Both players are navigated to `/finished/:roomId`
- Room status updates to "finished" in the database
- If max turns is "∞", neither player can auto-finish — they must manually end (future feature)

### US-5.9: Player disconnection during gameplay
**As a** player
**I want to** know if my partner disconnects mid-game
**So that** I'm not stuck in a broken game

**Acceptance criteria:**
- If partner's presence drops from the realtime channel, show a message: "[name] vanished. rude."
- Game is paused — no timer countdown
- Options: "wait" (hope they reconnect) or "end game" (finish with what you have)
- If partner reconnects within 60 seconds, game resumes where it left off

---

## Epic 6: Story completion ("fin.")

### US-6.1: Seeing the finished story
**As a** player
**I want to** see our completed story beautifully rendered
**So that** the moment feels special

**Acceptance criteria:**
- "fin." title in large coral text (48px, font-weight 900)
- Subtitle: "you two wrote something"
- Story rendered as a "book page":
  - Background: warm off-white (#FFFCF7)
  - Left margin line in coral (12% opacity)
  - Font: Georgia/serif, 14px, line-height 2
  - Player 1's words in coral italic
  - Player 2's words in ink black
  - Date stamp at top: "twosome — [date]"
  - Footer: "[Player 1] & [Player 2]" + "[X] words · [duration]"
- Shadow effect on the book page (4px offset, subtle)

### US-6.2: Seeing game stats
**As a** player
**I want to** see fun stats about the game
**So that** we can laugh and compare

**Acceptance criteria:**
- Three stat rows below the book page:
  - "fastest fingers" — player name + fastest response time (e.g., "Sam · 1.8s")
  - "longest word" — player name + the word (e.g., "Babe · 'discovered'")
  - "caught slacking" — player name + skip count (e.g., "Sam · 3x") — only shown if skips > 0
- Each stat has a small icon (⚡ 💬 😴), label, and value
- Stats are computed from the turns data

### US-6.3: Sharing the story
**As a** player
**I want to** share our story
**So that** we can show friends what we created

**Acceptance criteria:**
- "share story ↗" is the primary coral button
- On mobile: uses Web Share API (navigator.share) with the story text + "— written on twosome."
- On desktop: copies the story text to clipboard
- Future: generate a shareable image card (og:image style) with the story, player names, and Twosome branding

### US-6.4: Playing again
**As a** player
**I want to** play another round with the same person
**So that** we can keep having fun

**Acceptance criteria:**
- "again" button resets the game state and returns to the lobby (`/room/:code`)
- Same room, same players, same settings
- Both players need to toggle ready again
- Turn order can optionally swap (player 2 goes first this time)

### US-6.5: Starting a new game
**As a** player
**I want to** start fresh with different settings or a different partner
**So that** I have full control

**Acceptance criteria:**
- "new game" button fully resets all state and returns to home screen (`/`)
- Room is not deleted — the story remains in the database
- Player's display name is preserved

---

## Epic 7: Authentication & user accounts

### US-7.1: Signup nudge after first game
**As an** anonymous player who just finished a game
**I want to** be gently prompted to sign up
**So that** I can save my story

**Acceptance criteria:**
- After the first game ends, a signup nudge appears on the "fin." screen
- Copy: "sign up to keep this — one tap, we promise"
- Two buttons: Google and Apple sign-in
- "maybe later" dismiss link below
- Nudge is dismissible and never blocks gameplay
- If dismissed, it doesn't appear again in the same session

### US-7.2: Signing up with Google
**As an** anonymous player
**I want to** sign up with my Google account
**So that** I don't need to remember a password

**Acceptance criteria:**
- Tapping "Google" calls Supabase `linkIdentity({ provider: 'google' })`
- This upgrades the anonymous session — all data (the story they just played) is preserved
- After OAuth redirect, user lands back on the app with a full account
- Display name is pre-filled from Google profile (can be changed later)
- Avatar URL is pulled from Google profile

### US-7.3: Signing up with Apple
**As an** anonymous player
**I want to** sign up with my Apple ID
**So that** I can use my preferred auth method

**Acceptance criteria:**
- Same flow as Google but with Apple as the provider
- Supports "Hide My Email" relay
- Display name may be "Private" if user chose to hide it — handle gracefully

### US-7.4: Returning user auto-login
**As a** returning user
**I want to** be automatically signed in
**So that** I don't have to log in every time

**Acceptance criteria:**
- Supabase session persists in localStorage
- On app load, session is checked and user is auto-authenticated
- If session is expired, user falls back to anonymous mode (not an error state)
- User's display name and avatar are restored from their profile

---

## Epic 8: Story archive

### US-8.1: Saving a story
**As a** signed-in player
**I want to** save a completed story
**So that** I can revisit it later

**Acceptance criteria:**
- "save story" action is available on the "fin." screen (only for signed-in users)
- Story is saved to `saved_stories` table with full text, contributions, stats, and date
- Each player saves their own copy independently
- Unique constraint: one save per player per room
- Confirmation: brief "saved!" feedback

### US-8.2: Viewing saved stories
**As a** signed-in player
**I want to** browse my saved stories
**So that** I can relive past games

**Acceptance criteria:**
- Story archive accessible from profile/home screen
- Stories listed in reverse chronological order
- Each card shows: date, partner name, word count, duration, first few words as preview
- Tapping a card opens the full story in book page format with stats

### US-8.3: Deleting a saved story
**As a** signed-in player
**I want to** delete a story I no longer want
**So that** I control my archive

**Acceptance criteria:**
- Swipe-to-delete or delete button on each story card
- Confirmation: "delete this story? it's gone forever"
- Only deletes YOUR copy — partner's copy is unaffected

---

## Epic 9: Friends & social

### US-9.1: Adding a friend after a game
**As a** signed-in player
**I want to** add my game partner as a friend
**So that** we can play again without room codes

**Acceptance criteria:**
- After a game, if both players are signed in, show "add [name] as a friend?"
- Sends a friend request (status: "pending")
- Partner sees the request next time they open the app
- Accept/decline actions on the request

### US-9.2: Viewing friend list
**As a** signed-in player
**I want to** see my friends
**So that** I can start games with them directly

**Acceptance criteria:**
- Friend list accessible from profile/home screen
- Shows friend name, avatar, and last played date
- "Invite to play" button next to each friend
- Empty state: "sign up to start building your crew"

### US-9.3: Inviting a friend to play
**As a** signed-in player
**I want to** invite a friend directly
**So that** we skip the room code step

**Acceptance criteria:**
- Tapping "invite to play" on a friend creates a room and sends a push notification (future) or in-app notification
- Friend sees the invitation and can accept to join the lobby directly
- Falls back to room code sharing if push isn't available

### US-9.4: Match history
**As a** signed-in player
**I want to** see who I've played with
**So that** I can reconnect with past partners

**Acceptance criteria:**
- List of all players I've shared a room with, sorted by most recent
- Shows: name, avatar, number of games played together, last played date
- Tap to view shared stories or send friend request

---

## Epic 10: Progressive Web App

### US-10.1: Installing the app
**As a** mobile user
**I want to** add Twosome to my home screen
**So that** it feels like a native app

**Acceptance criteria:**
- PWA manifest is configured with name, icons, theme color (#1A1A1A), background color (#F5F1EB)
- Display mode: standalone (no browser chrome)
- Orientation: portrait
- Service worker registered for offline landing page
- Install prompt appears on supported browsers

### US-10.2: Offline landing page
**As a** user without internet
**I want to** see a friendly message
**So that** I know the app needs connectivity

**Acceptance criteria:**
- If offline, show the Twosome logo and "you need internet to play with someone — obviously"
- No broken UI or error screens
- When connectivity returns, app auto-recovers

---

## Epic 11: Edge cases & error handling

### US-11.1: Room expired
**As a** player
**I want to** see a clear message if the room code is old
**So that** I know to create a new room

**Acceptance criteria:**
- Rooms older than 24 hours with status "finished" are auto-cleaned
- If a player tries to join a cleaned-up room: "this room has expired — start a new one"

### US-11.2: Network interruption during gameplay
**As a** player
**I want to** not lose my game progress if my connection drops briefly
**So that** temporary network issues don't ruin the experience

**Acceptance criteria:**
- Turns are stored locally in Zustand before being sent to Supabase
- If a turn fails to send, retry up to 3 times with exponential backoff
- If still failing, show: "having trouble connecting — retrying..."
- On reconnection, sync local state with server state

### US-11.3: Both players submit at the same time
**As a** player
**I want to** not have conflicting turns
**So that** the story stays coherent

**Acceptance criteria:**
- Turn submission is guarded by `activePlayerId` check on the domain level
- If a player submits when it's not their turn, the `NotYourTurnError` is thrown
- The UI disables the input for the inactive player
- In the rare race condition where both submit simultaneously, the server-side turn number acts as the tiebreaker

### US-11.4: Invalid room code
**As a** player
**I want to** see clear feedback for wrong codes
**So that** I can correct my mistake

**Acceptance criteria:**
- If code is less than 6 characters: "go" button stays disabled
- If code is 6 characters but no room found: "room not found"
- If room found but full: "this room's taken — they've got company already"
- If room found but game already started: "this game is already in progress"

### US-11.5: Page refresh during gameplay
**As a** player
**I want to** recover my game if I accidentally refresh
**So that** I don't lose progress

**Acceptance criteria:**
- On page load, check if there's an active game for this player
- If yes, restore game state from the database (room, turns, active player)
- Rejoin the realtime channel
- Resume gameplay from where it was

---

## Non-functional requirements

### Performance
- Time to interactive: < 2 seconds on 3G
- Turn submission to display on partner's screen: < 500ms
- Lobby join to visibility: < 1 second

### Accessibility
- All interactive elements are keyboard navigable
- Color is not the only indicator of state (ready/not ready has text + border change)
- Touch targets are minimum 44x44px
- Input labels are associated with their fields

### Mobile UX
- Safe area insets respected (notch, home indicator)
- Keyboard pushes content up, doesn't overlay
- No horizontal scrolling anywhere
- Tap targets are comfortable for thumb use
- Pull-to-refresh does not interfere with gameplay

### Security
- Anonymous users cannot access other users' saved stories
- RLS policies enforce data access at the database level
- Room codes are not sequential (cryptographically random)
- Rate limiting on room creation (prevent spam)