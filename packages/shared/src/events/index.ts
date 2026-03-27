import type { GameMode, GameStats, PlayerId, PlayerContributions, RoomCode, RoomId, StoryId, TurnPreset, TimerPreset, UserId } from "../types";

// ============================================================
// Base event
// ============================================================

export interface DomainEvent<T extends string = string, P = unknown> {
  type: T;
  payload: P;
  timestamp: number;
}

function createEvent<T extends string, P>(type: T, payload: P): DomainEvent<T, P> {
  return { type, payload, timestamp: Date.now() };
}

// ============================================================
// Room events
// ============================================================

export interface RoomCreatedPayload {
  roomId: RoomId;
  code: RoomCode;
  hostId: UserId | null;
  gameMode: GameMode;
  turnTimer: TimerPreset | null;
  maxTurns: TurnPreset | null;
  prompt: string | null;
}

export interface PlayerJoinedPayload {
  roomId: RoomId;
  playerId: PlayerId;
  displayName: string;
  isHost: boolean;
}

export interface PlayerReadyPayload {
  roomId: RoomId;
  playerId: PlayerId;
  isReady: boolean;
}

export interface PlayerDisconnectedPayload {
  roomId: RoomId;
  playerId: PlayerId;
  displayName: string;
}

// ============================================================
// Game events
// ============================================================

export interface GameStartedPayload {
  roomId: RoomId;
  firstPlayerId: PlayerId;
}

export interface TurnSubmittedPayload {
  roomId: RoomId;
  playerId: PlayerId;
  content: string;
  turnNumber: number;
  responseTimeMs: number;
}

export interface TurnSkippedPayload {
  roomId: RoomId;
  playerId: PlayerId;
  turnNumber: number;
}

export interface TurnTimerTickPayload {
  roomId: RoomId;
  secondsRemaining: number;
}

export interface GameFinishedPayload {
  roomId: RoomId;
  storyId: StoryId;
  fullText: string;
  contributions: PlayerContributions;
  stats: GameStats;
}

// ============================================================
// Play-again event
// ============================================================

export interface PlayAgainPayload {
  roomId: RoomId;
  newRoomCode: string;
}

// ============================================================
// Typing events
// ============================================================

export interface PlayerTypingPayload {
  roomId: RoomId;
  playerId: PlayerId;
}

// ============================================================
// Event type map
// ============================================================

export type RoomCreated = DomainEvent<"room.created", RoomCreatedPayload>;
export type PlayerJoined = DomainEvent<"player.joined", PlayerJoinedPayload>;
export type PlayerReady = DomainEvent<"player.ready", PlayerReadyPayload>;
export type PlayerDisconnected = DomainEvent<"player.disconnected", PlayerDisconnectedPayload>;
export type GameStarted = DomainEvent<"game.started", GameStartedPayload>;
export type TurnSubmitted = DomainEvent<"turn.submitted", TurnSubmittedPayload>;
export type TurnSkipped = DomainEvent<"turn.skipped", TurnSkippedPayload>;
export type TurnTimerTick = DomainEvent<"turn.timer.tick", TurnTimerTickPayload>;
export type GameFinished = DomainEvent<"game.finished", GameFinishedPayload>;
export type PlayAgain = DomainEvent<"play.again", PlayAgainPayload>;
export type PlayerTyping = DomainEvent<"player.typing", PlayerTypingPayload>;

export type TwosomeEvent =
  | RoomCreated
  | PlayerJoined
  | PlayerReady
  | PlayerDisconnected
  | GameStarted
  | TurnSubmitted
  | TurnSkipped
  | TurnTimerTick
  | GameFinished
  | PlayAgain
  | PlayerTyping;

// ============================================================
// Event factories
// ============================================================

export const Events = {
  roomCreated: (p: RoomCreatedPayload) => createEvent("room.created", p),
  playerJoined: (p: PlayerJoinedPayload) => createEvent("player.joined", p),
  playerReady: (p: PlayerReadyPayload) => createEvent("player.ready", p),
  playerDisconnected: (p: PlayerDisconnectedPayload) => createEvent("player.disconnected", p),
  gameStarted: (p: GameStartedPayload) => createEvent("game.started", p),
  turnSubmitted: (p: TurnSubmittedPayload) => createEvent("turn.submitted", p),
  turnSkipped: (p: TurnSkippedPayload) => createEvent("turn.skipped", p),
  turnTimerTick: (p: TurnTimerTickPayload) => createEvent("turn.timer.tick", p),
  gameFinished: (p: GameFinishedPayload) => createEvent("game.finished", p),
  playAgain: (p: PlayAgainPayload) => createEvent("play.again", p),
  playerTyping: (p: PlayerTypingPayload) => createEvent("player.typing", p),
} as const;
