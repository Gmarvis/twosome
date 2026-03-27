import type { StoryId } from "@twosome/shared";
import { Events, createId } from "@twosome/shared";
import { type RoomRepository, type PlayerRepository, Game } from "@twosome/domain";
import type { CommandHandler, EventBus } from "../../ports/cqrs";
import type { RealtimePort } from "../../ports/realtime.port";
import type {
  StartGameCommand,
  SubmitTurnCommand,
  SkipTurnCommand,
  FinishGameCommand,
} from "../../commands";

// In-memory game instances (client-side state)
const activeGames = new Map<string, Game>();

export function getActiveGame(roomId: string): Game | undefined {
  return activeGames.get(roomId);
}

export function registerGame(roomId: string, game: Game): void {
  activeGames.set(roomId, game);
}

// ============================================================
// Start game
// ============================================================

export class StartGameHandler implements CommandHandler<StartGameCommand> {
  constructor(
    private readonly roomRepo: RoomRepository,
    private readonly playerRepo: PlayerRepository,
    private readonly realtime: RealtimePort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: StartGameCommand): Promise<void> {
    const { roomId } = command.payload;

    const room = await this.roomRepo.findById(roomId);
    if (!room) throw new Error("Room not found");

    const players = await this.playerRepo.findByRoomId(roomId);
    if (players.length < 2) throw new Error("Need 2 players");

    room.start();
    await this.roomRepo.updateStatus(roomId, "playing");

    const game = new Game({
      roomId,
      mode: room.gameMode,
      turnTimer: room.turnTimer,
      maxTurns: room.maxTurns,
      prompt: room.prompt,
      player1: { id: players[0].id, displayName: players[0].displayName },
      player2: { id: players[1].id, displayName: players[1].displayName },
    });

    activeGames.set(roomId, game);

    const event = Events.gameStarted({
      roomId,
      firstPlayerId: players[0].id,
    });

    this.eventBus.publish(event);
    await this.realtime.broadcast(roomId, event);
  }
}

// ============================================================
// Submit turn
// ============================================================

export class SubmitTurnHandler implements CommandHandler<SubmitTurnCommand> {
  constructor(
    private readonly realtime: RealtimePort,
    private readonly eventBus: EventBus,
    private readonly turnRepo?: { save(turn: any): Promise<void> },
  ) {}

  async execute(command: SubmitTurnCommand): Promise<void> {
    const { roomId, playerId, content, responseTimeMs } = command.payload;

    const game = activeGames.get(roomId);
    if (!game) throw new Error("No active game");

    const turn = game.submitTurn(playerId, content, responseTimeMs);

    // Persist turn to database (fire-and-forget, don't block gameplay)
    if (this.turnRepo) {
      this.turnRepo.save(turn).catch((err) =>
        console.error("[SubmitTurn] DB save failed:", err),
      );
    }

    const event = Events.turnSubmitted({
      roomId,
      playerId,
      content: turn.content,
      turnNumber: turn.turnNumber,
      responseTimeMs,
    });

    this.eventBus.publish(event);
    await this.realtime.broadcast(roomId, event);

    if (game.isFinished) {
      const stats = game.computeStats();
      const contributions = game.computeContributions();

      const finishEvent = Events.gameFinished({
        roomId,
        storyId: createId() as StoryId,
        fullText: game.storyText,
        contributions,
        stats,
      });

      this.eventBus.publish(finishEvent);
      await this.realtime.broadcast(roomId, finishEvent);
    }
  }
}

// ============================================================
// Skip turn
// ============================================================

export class SkipTurnHandler implements CommandHandler<SkipTurnCommand> {
  constructor(
    private readonly realtime: RealtimePort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SkipTurnCommand): Promise<void> {
    const { roomId, playerId } = command.payload;

    const game = activeGames.get(roomId);
    if (!game) throw new Error("No active game");

    game.skipTurn(playerId);

    const event = Events.turnSkipped({
      roomId,
      playerId,
      turnNumber: game.currentTurnNumber - 1,
    });

    this.eventBus.publish(event);
    await this.realtime.broadcast(roomId, event);
  }
}

// ============================================================
// Finish game (manual)
// ============================================================

export class FinishGameHandler implements CommandHandler<FinishGameCommand> {
  constructor(
    private readonly roomRepo: RoomRepository,
    private readonly realtime: RealtimePort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: FinishGameCommand): Promise<void> {
    const { roomId } = command.payload;

    const game = activeGames.get(roomId);
    if (!game) throw new Error("No active game");

    game.forceFinish();
    await this.roomRepo.updateStatus(roomId, "finished");

    const stats = game.computeStats();
    const contributions = game.computeContributions();

    const event = Events.gameFinished({
      roomId,
      storyId: createId() as StoryId,
      fullText: game.storyText,
      contributions,
      stats,
    });

    this.eventBus.publish(event);
    await this.realtime.broadcast(roomId, event);

    activeGames.delete(roomId);
  }
}
