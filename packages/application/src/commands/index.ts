import type { Command } from "../ports/cqrs";
import type {
  GameMode,
  TimerPreset,
  TurnPreset,
  RoomCode,
  RoomId,
  PlayerId,
  UserId,
  StoryId,
} from "@twosome/shared";

// ============================================================
// Room commands
// ============================================================

export interface CreateRoomPayload {
  hostDisplayName: string;
  hostUserId: UserId | null;
  gameMode: GameMode;
  turnTimer: TimerPreset | null;
  maxTurns: TurnPreset | null;
  prompt: string | null;
}
export type CreateRoomCommand = Command<"room.create", CreateRoomPayload>;

export const createRoomCommand = (payload: CreateRoomPayload): CreateRoomCommand => ({
  type: "room.create",
  payload,
});

// ---

export interface JoinRoomPayload {
  code: RoomCode;
  displayName: string;
  userId: UserId | null;
}
export type JoinRoomCommand = Command<"room.join", JoinRoomPayload>;

export const joinRoomCommand = (payload: JoinRoomPayload): JoinRoomCommand => ({
  type: "room.join",
  payload,
});

// ============================================================
// Player commands
// ============================================================

export interface ToggleReadyPayload {
  roomId: RoomId;
  playerId: PlayerId;
}
export type ToggleReadyCommand = Command<"player.toggleReady", ToggleReadyPayload>;

export const toggleReadyCommand = (payload: ToggleReadyPayload): ToggleReadyCommand => ({
  type: "player.toggleReady",
  payload,
});

// ============================================================
// Game commands
// ============================================================

export interface StartGamePayload {
  roomId: RoomId;
}
export type StartGameCommand = Command<"game.start", StartGamePayload>;

export const startGameCommand = (payload: StartGamePayload): StartGameCommand => ({
  type: "game.start",
  payload,
});

// ---

export interface SubmitTurnPayload {
  roomId: RoomId;
  playerId: PlayerId;
  content: string;
  responseTimeMs: number;
}
export type SubmitTurnCommand = Command<"game.submitTurn", SubmitTurnPayload>;

export const submitTurnCommand = (payload: SubmitTurnPayload): SubmitTurnCommand => ({
  type: "game.submitTurn",
  payload,
});

// ---

export interface SkipTurnPayload {
  roomId: RoomId;
  playerId: PlayerId;
}
export type SkipTurnCommand = Command<"game.skipTurn", SkipTurnPayload>;

export const skipTurnCommand = (payload: SkipTurnPayload): SkipTurnCommand => ({
  type: "game.skipTurn",
  payload,
});

// ---

export interface FinishGamePayload {
  roomId: RoomId;
}
export type FinishGameCommand = Command<"game.finish", FinishGamePayload>;

export const finishGameCommand = (payload: FinishGamePayload): FinishGameCommand => ({
  type: "game.finish",
  payload,
});

// ============================================================
// Story commands
// ============================================================

export interface SaveStoryPayload {
  roomId: RoomId;
  userId: UserId;
}
export type SaveStoryCommand = Command<"story.save", SaveStoryPayload>;

export const saveStoryCommand = (payload: SaveStoryPayload): SaveStoryCommand => ({
  type: "story.save",
  payload,
});
