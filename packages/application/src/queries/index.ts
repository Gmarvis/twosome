import type { Query } from "../ports/cqrs";
import type {
  RoomId,
  RoomCode,
  UserId,
  PlayerId,
  RoomDTO,
  RoomPlayerDTO,
  TurnDTO,
  SavedStoryDTO,
  GameStats,
  PlayerContributions,
} from "@twosome/shared";

// ============================================================
// Room queries
// ============================================================

export interface GetRoomByCodePayload {
  code: RoomCode;
}
export type GetRoomByCodeQuery = Query<"room.getByCode", GetRoomByCodePayload>;

export const getRoomByCodeQuery = (payload: GetRoomByCodePayload): GetRoomByCodeQuery => ({
  type: "room.getByCode",
  payload,
});

export interface GetRoomByCodeResult {
  room: RoomDTO;
  players: RoomPlayerDTO[];
}

// ---

export interface GetRoomByIdPayload {
  roomId: RoomId;
}
export type GetRoomByIdQuery = Query<"room.getById", GetRoomByIdPayload>;

export const getRoomByIdQuery = (payload: GetRoomByIdPayload): GetRoomByIdQuery => ({
  type: "room.getById",
  payload,
});

export interface GetRoomByIdResult {
  room: RoomDTO;
  players: RoomPlayerDTO[];
}

// ============================================================
// Game state queries
// ============================================================

export interface GetGameStatePayload {
  roomId: RoomId;
}
export type GetGameStateQuery = Query<"game.getState", GetGameStatePayload>;

export const getGameStateQuery = (payload: GetGameStatePayload): GetGameStateQuery => ({
  type: "game.getState",
  payload,
});

export interface GetGameStateResult {
  room: RoomDTO;
  players: RoomPlayerDTO[];
  turns: TurnDTO[];
  activePlayerId: PlayerId | null;
  currentTurnNumber: number;
  storyText: string;
  isFinished: boolean;
}

// ============================================================
// Story queries
// ============================================================

export interface GetStoryArchivePayload {
  userId: UserId;
}
export type GetStoryArchiveQuery = Query<"story.getArchive", GetStoryArchivePayload>;

export const getStoryArchiveQuery = (payload: GetStoryArchivePayload): GetStoryArchiveQuery => ({
  type: "story.getArchive",
  payload,
});

export type GetStoryArchiveResult = SavedStoryDTO[];

// ---

export interface GetGameResultPayload {
  roomId: RoomId;
}
export type GetGameResultQuery = Query<"game.getResult", GetGameResultPayload>;

export const getGameResultQuery = (payload: GetGameResultPayload): GetGameResultQuery => ({
  type: "game.getResult",
  payload,
});

export interface GetGameResultResult {
  storyText: string;
  contributions: PlayerContributions;
  stats: GameStats;
  turns: TurnDTO[];
}
