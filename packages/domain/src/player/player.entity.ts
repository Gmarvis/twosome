import type { PlayerId, RoomId, UserId, RoomPlayerDTO } from "@twosome/shared";

export interface CreatePlayerProps {
  id: PlayerId;
  roomId: RoomId;
  userId: UserId | null;
  displayName: string;
  isHost: boolean;
}

export class Player {
  readonly id: PlayerId;
  readonly roomId: RoomId;
  readonly userId: UserId | null;
  readonly displayName: string;
  readonly isHost: boolean;
  private _isReady: boolean;
  readonly joinedAt: string;

  private constructor(props: CreatePlayerProps & { isReady: boolean; joinedAt: string }) {
    this.id = props.id;
    this.roomId = props.roomId;
    this.userId = props.userId;
    this.displayName = props.displayName;
    this.isHost = props.isHost;
    this._isReady = props.isReady;
    this.joinedAt = props.joinedAt;
  }

  static create(props: CreatePlayerProps): Player {
    return new Player({
      ...props,
      isReady: false,
      joinedAt: new Date().toISOString(),
    });
  }

  static fromDTO(dto: RoomPlayerDTO): Player {
    return new Player({
      id: dto.id,
      roomId: dto.roomId,
      userId: dto.userId,
      displayName: dto.displayName,
      isHost: dto.isHost,
      isReady: dto.isReady,
      joinedAt: dto.joinedAt,
    });
  }

  get isReady(): boolean {
    return this._isReady;
  }

  toggleReady(): void {
    this._isReady = !this._isReady;
  }

  setReady(ready: boolean): void {
    this._isReady = ready;
  }

  get initial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  toDTO(): RoomPlayerDTO {
    return {
      id: this.id,
      roomId: this.roomId,
      userId: this.userId,
      displayName: this.displayName,
      isHost: this.isHost,
      isReady: this._isReady,
      joinedAt: this.joinedAt,
    };
  }
}
