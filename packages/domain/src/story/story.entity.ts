import type {
  StoryId,
  RoomId,
  UserId,
  SavedStoryDTO,
  PlayerContributions,
  GameStats,
} from "@twosome/shared";

export interface CreateStoryProps {
  id: StoryId;
  roomId: RoomId;
  userId: UserId;
  fullText: string;
  playerContributions: PlayerContributions;
  stats: GameStats;
}

export class Story {
  readonly id: StoryId;
  readonly roomId: RoomId;
  readonly userId: UserId;
  readonly fullText: string;
  readonly playerContributions: PlayerContributions;
  readonly stats: GameStats;
  readonly createdAt: string;

  private constructor(props: CreateStoryProps & { createdAt: string }) {
    this.id = props.id;
    this.roomId = props.roomId;
    this.userId = props.userId;
    this.fullText = props.fullText;
    this.playerContributions = props.playerContributions;
    this.stats = props.stats;
    this.createdAt = props.createdAt;
  }

  static create(props: CreateStoryProps): Story {
    return new Story({ ...props, createdAt: new Date().toISOString() });
  }

  static fromDTO(dto: SavedStoryDTO): Story {
    return new Story({
      id: dto.id,
      roomId: dto.roomId,
      userId: dto.userId,
      fullText: dto.fullText,
      playerContributions: dto.playerContributions,
      stats: dto.stats,
      createdAt: dto.createdAt,
    });
  }

  get wordCount(): number {
    return this.fullText.split(/\s+/).filter(Boolean).length;
  }

  get player1Name(): string {
    return this.playerContributions.player1.name;
  }

  get player2Name(): string {
    return this.playerContributions.player2.name;
  }

  toDTO(): SavedStoryDTO {
    return {
      id: this.id,
      roomId: this.roomId,
      userId: this.userId,
      fullText: this.fullText,
      playerContributions: this.playerContributions,
      stats: this.stats,
      createdAt: this.createdAt,
    };
  }
}
