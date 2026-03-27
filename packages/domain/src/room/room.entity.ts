import {
  type RoomId,
  type RoomCode,
  type UserId,
  type GameMode,
  type TimerPreset,
  type TurnPreset,
  type RoomStatus,
  type RoomDTO,
  RoomNotReadyError,
  RoomFullError,
  GameAlreadyFinishedError,
} from "@twosome/shared";

export interface CreateRoomProps {
  id: RoomId;
  code: RoomCode;
  hostId: UserId | null;
  gameMode: GameMode;
  turnTimer: TimerPreset | null;
  maxTurns: TurnPreset | null;
  prompt: string | null;
}

export class Room {
  readonly id: RoomId;
  readonly code: RoomCode;
  readonly hostId: UserId | null;
  readonly gameMode: GameMode;
  readonly turnTimer: TimerPreset | null;
  readonly maxTurns: TurnPreset | null;
  readonly prompt: string | null;
  private _status: RoomStatus;
  private _playerCount: number;
  readonly createdAt: string;

  private constructor(props: CreateRoomProps & { status: RoomStatus; playerCount: number; createdAt: string }) {
    this.id = props.id;
    this.code = props.code;
    this.hostId = props.hostId;
    this.gameMode = props.gameMode;
    this.turnTimer = props.turnTimer;
    this.maxTurns = props.maxTurns;
    this.prompt = props.prompt;
    this._status = props.status;
    this._playerCount = props.playerCount;
    this.createdAt = props.createdAt;
  }

  static create(props: CreateRoomProps): Room {
    return new Room({
      ...props,
      status: "waiting",
      playerCount: 0,
      createdAt: new Date().toISOString(),
    });
  }

  static fromDTO(dto: RoomDTO, playerCount: number): Room {
    return new Room({
      id: dto.id,
      code: dto.code,
      hostId: dto.hostId,
      gameMode: dto.gameMode,
      turnTimer: dto.turnTimer,
      maxTurns: dto.maxTurns,
      prompt: dto.prompt,
      status: dto.status,
      playerCount,
      createdAt: dto.createdAt,
    });
  }

  get status(): RoomStatus {
    return this._status;
  }

  get playerCount(): number {
    return this._playerCount;
  }

  get isFull(): boolean {
    return this._playerCount >= 2;
  }

  get isWaiting(): boolean {
    return this._status === "waiting";
  }

  get isPlaying(): boolean {
    return this._status === "playing";
  }

  get isFinished(): boolean {
    return this._status === "finished";
  }

  canJoin(): void {
    if (this.isFull) {
      throw new RoomFullError(this.code);
    }
    if (!this.isWaiting) {
      throw new GameAlreadyFinishedError();
    }
  }

  addPlayer(): void {
    this.canJoin();
    this._playerCount++;
  }

  canStart(): void {
    if (this._playerCount < 2) {
      throw new RoomNotReadyError();
    }
    if (!this.isWaiting) {
      throw new GameAlreadyFinishedError();
    }
  }

  start(): void {
    this.canStart();
    this._status = "playing";
  }

  finish(): void {
    this._status = "finished";
  }

  toDTO(): RoomDTO {
    return {
      id: this.id,
      code: this.code,
      hostId: this.hostId,
      gameMode: this.gameMode,
      turnTimer: this.turnTimer,
      maxTurns: this.maxTurns,
      prompt: this.prompt,
      status: this._status,
      createdAt: this.createdAt,
    };
  }
}
