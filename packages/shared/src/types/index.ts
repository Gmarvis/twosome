// ============================================================
// Brand identity types
// ============================================================

export type PlayerId = string & { readonly __brand: "PlayerId" };
export type RoomId = string & { readonly __brand: "RoomId" };
export type UserId = string & { readonly __brand: "UserId" };
export type StoryId = string & { readonly __brand: "StoryId" };
export type TurnId = string & { readonly __brand: "TurnId" };
export type FriendshipId = string & { readonly __brand: "FriendshipId" };
export type RoomCode = string & { readonly __brand: "RoomCode" };

// ============================================================
// Enums
// ============================================================

export const GameMode = {
  WORD: "word",
  SENTENCE: "sentence",
} as const;
export type GameMode = (typeof GameMode)[keyof typeof GameMode];

export const RoomStatus = {
  WAITING: "waiting",
  PLAYING: "playing",
  FINISHED: "finished",
} as const;
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const FriendshipStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
} as const;
export type FriendshipStatus =
  (typeof FriendshipStatus)[keyof typeof FriendshipStatus];

// ============================================================
// Timer presets
// ============================================================

export const TimerPresets = [5, 10, 15] as const;
export type TimerPreset = (typeof TimerPresets)[number];

export const TurnPresets = [10, 20, 50] as const;
export type TurnPreset = (typeof TurnPresets)[number];

// ============================================================
// DTOs (Data Transfer Objects)
// ============================================================

export interface UserDTO {
  id: UserId;
  displayName: string;
  avatarUrl: string | null;
  avatarColor: string;
  totalGames: number;
  totalWords: number;
  createdAt: string;
}

export interface RoomDTO {
  id: RoomId;
  code: RoomCode;
  hostId: UserId | null;
  gameMode: GameMode;
  turnTimer: TimerPreset | null;
  maxTurns: TurnPreset | null;
  prompt: string | null;
  status: RoomStatus;
  createdAt: string;
}

export interface RoomPlayerDTO {
  id: PlayerId;
  roomId: RoomId;
  userId: UserId | null;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: string;
}

export interface TurnDTO {
  id: TurnId;
  roomId: RoomId;
  playerId: PlayerId;
  content: string;
  turnNumber: number;
  responseTimeMs: number;
  createdAt: string;
}

export interface SavedStoryDTO {
  id: StoryId;
  roomId: RoomId;
  userId: UserId;
  fullText: string;
  playerContributions: PlayerContributions;
  stats: GameStats;
  createdAt: string;
}

// ============================================================
// Composite types
// ============================================================

export interface PlayerContribution {
  name: string;
  userId: UserId | null;
  wordCount: number;
  avgResponseTimeMs: number;
}

export interface PlayerContributions {
  player1: PlayerContribution;
  player2: PlayerContribution;
}

export interface GameStats {
  fastest: { playerName: string; timeMs: number };
  longestWord: { playerName: string; word: string };
  skips: { playerName: string; count: number };
  durationSeconds: number;
}

// ============================================================
// AI Analysis types
// ============================================================

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

export interface StoryAnalysis {
  headline: string;
  player1: PlayerProfile;
  player2: PlayerProfile;
  dynamic: DynamicAnalysis;
  surprises: string[];
}
