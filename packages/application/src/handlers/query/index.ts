import type { QueryHandler } from "../../ports/cqrs";
import type { RoomRepository, PlayerRepository, StoryRepository } from "@twosome/domain";
import type {
  GetRoomByCodeQuery,
  GetRoomByCodeResult,
  GetRoomByIdQuery,
  GetRoomByIdResult,
  GetStoryArchiveQuery,
  GetStoryArchiveResult,
  GetGameResultQuery,
  GetGameResultResult,
} from "../../queries";
import { getActiveGame } from "../command/game.handlers";

// ============================================================
// Get room by code
// ============================================================

export class GetRoomByCodeHandler
  implements QueryHandler<GetRoomByCodeQuery, GetRoomByCodeResult | null>
{
  constructor(
    private readonly roomRepo: RoomRepository,
    private readonly playerRepo: PlayerRepository,
  ) {}

  async execute(query: GetRoomByCodeQuery): Promise<GetRoomByCodeResult | null> {
    const room = await this.roomRepo.findByCode(query.payload.code);
    if (!room) return null;

    const players = await this.playerRepo.findByRoomId(room.id);

    return {
      room: room.toDTO(),
      players: players.map((p) => p.toDTO()),
    };
  }
}

// ============================================================
// Get room by ID
// ============================================================

export class GetRoomByIdHandler
  implements QueryHandler<GetRoomByIdQuery, GetRoomByIdResult | null>
{
  constructor(
    private readonly roomRepo: RoomRepository,
    private readonly playerRepo: PlayerRepository,
  ) {}

  async execute(query: GetRoomByIdQuery): Promise<GetRoomByIdResult | null> {
    const room = await this.roomRepo.findById(query.payload.roomId);
    if (!room) return null;

    const players = await this.playerRepo.findByRoomId(room.id);

    return {
      room: room.toDTO(),
      players: players.map((p) => p.toDTO()),
    };
  }
}

// ============================================================
// Get story archive
// ============================================================

export class GetStoryArchiveHandler
  implements QueryHandler<GetStoryArchiveQuery, GetStoryArchiveResult>
{
  constructor(private readonly storyRepo: StoryRepository) {}

  async execute(query: GetStoryArchiveQuery): Promise<GetStoryArchiveResult> {
    const stories = await this.storyRepo.findByUserId(query.payload.userId);
    return stories.map((s) => s.toDTO());
  }
}

// ============================================================
// Get game result
// ============================================================

export class GetGameResultHandler
  implements QueryHandler<GetGameResultQuery, GetGameResultResult | null>
{
  async execute(query: GetGameResultQuery): Promise<GetGameResultResult | null> {
    const game = getActiveGame(query.payload.roomId);
    if (!game) return null;

    return {
      storyText: game.storyText,
      contributions: game.computeContributions(),
      stats: game.computeStats(),
      turns: [...game.turns],
    };
  }
}
