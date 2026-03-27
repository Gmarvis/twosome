import type { RoomId, PlayerId, RoomCode } from "@twosome/shared";
import { generateRoomCode, createId, Events } from "@twosome/shared";
import { Room, type RoomRepository } from "@twosome/domain";
import { Player, type PlayerRepository } from "@twosome/domain";
import type { CommandHandler, EventBus } from "../../ports/cqrs";
import type { RealtimePort } from "../../ports/realtime.port";
import type { CreateRoomCommand, JoinRoomCommand, ToggleReadyCommand } from "../../commands";

// ============================================================
// Create room
// ============================================================

export interface CreateRoomResult {
  roomId: RoomId;
  code: RoomCode;
  playerId: PlayerId;
}

export class CreateRoomHandler implements CommandHandler<CreateRoomCommand, CreateRoomResult> {
  constructor(
    private readonly roomRepo: RoomRepository,
    private readonly playerRepo: PlayerRepository,
    private readonly realtime: RealtimePort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateRoomCommand): Promise<CreateRoomResult> {
    const { hostDisplayName, hostUserId, gameMode, turnTimer, maxTurns, prompt } = command.payload;

    const roomId = createId() as RoomId;
    const code = generateRoomCode();
    const playerId = createId() as PlayerId;

    const room = Room.create({
      id: roomId,
      code,
      hostId: hostUserId,
      gameMode,
      turnTimer,
      maxTurns,
      prompt,
    });

    const player = Player.create({
      id: playerId,
      roomId,
      userId: hostUserId,
      displayName: hostDisplayName,
      isHost: true,
    });
    player.setReady(true);

    room.addPlayer();

    await this.roomRepo.create(room);
    await this.playerRepo.create(player);
    await this.playerRepo.updateReady(playerId, true);
    await this.realtime.joinRoom(roomId, playerId, hostDisplayName);

    this.eventBus.publish(
      Events.roomCreated({
        roomId,
        code,
        hostId: hostUserId,
        gameMode,
        turnTimer,
        maxTurns,
        prompt,
      }),
    );

    this.eventBus.publish(
      Events.playerJoined({
        roomId,
        playerId,
        displayName: hostDisplayName,
        isHost: true,
      }),
    );

    return { roomId, code, playerId };
  }
}

// ============================================================
// Join room
// ============================================================

export interface JoinRoomResult {
  roomId: RoomId;
  playerId: PlayerId;
}

export class JoinRoomHandler implements CommandHandler<JoinRoomCommand, JoinRoomResult> {
  constructor(
    private readonly roomRepo: RoomRepository,
    private readonly playerRepo: PlayerRepository,
    private readonly realtime: RealtimePort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: JoinRoomCommand): Promise<JoinRoomResult> {
    const { code, displayName, userId } = command.payload;

    const room = await this.roomRepo.findByCode(code);
    if (!room) {
      throw new Error(`Room not found: ${code}`);
    }

    room.canJoin();

    const playerId = createId() as PlayerId;
    const player = Player.create({
      id: playerId,
      roomId: room.id,
      userId,
      displayName,
      isHost: false,
    });
    player.setReady(true);

    room.addPlayer();

    await this.playerRepo.create(player);
    await this.playerRepo.updateReady(playerId, true);
    await this.realtime.joinRoom(room.id, playerId, displayName);

    this.eventBus.publish(
      Events.playerJoined({
        roomId: room.id,
        playerId,
        displayName,
        isHost: false,
      }),
    );

    return { roomId: room.id, playerId };
  }
}

// ============================================================
// Toggle ready
// ============================================================

export class ToggleReadyHandler implements CommandHandler<ToggleReadyCommand> {
  constructor(
    private readonly playerRepo: PlayerRepository,
    private readonly realtime: RealtimePort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ToggleReadyCommand): Promise<void> {
    const { roomId, playerId } = command.payload;

    const player = await this.playerRepo.findById(playerId);
    if (!player) throw new Error("Player not found");

    player.toggleReady();

    await this.playerRepo.updateReady(playerId, player.isReady);
    await this.realtime.updatePresence(roomId, { isReady: player.isReady });

    this.eventBus.publish(
      Events.playerReady({
        roomId,
        playerId,
        isReady: player.isReady,
      }),
    );
  }
}
