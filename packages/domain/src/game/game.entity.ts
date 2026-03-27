import {
  type RoomId,
  type PlayerId,
  type TurnId,
  type GameMode,
  type TurnPreset,
  type TimerPreset,
  type TurnDTO,
  type GameStats,
  type PlayerContributions,
  NotYourTurnError,
  GameAlreadyFinishedError,
  createId,
} from "@twosome/shared";

export interface GamePlayer {
  id: PlayerId;
  displayName: string;
}

export interface GameConfig {
  roomId: RoomId;
  mode: GameMode;
  turnTimer: TimerPreset | null;
  maxTurns: TurnPreset | null;
  prompt: string | null;
  player1: GamePlayer;
  player2: GamePlayer;
}

export class Game {
  readonly roomId: RoomId;
  readonly mode: GameMode;
  readonly turnTimer: TimerPreset | null;
  readonly maxTurns: TurnPreset | null;
  readonly prompt: string | null;
  readonly player1: GamePlayer;
  readonly player2: GamePlayer;

  private _turns: TurnDTO[] = [];
  private _activePlayerId: PlayerId;
  private _isFinished = false;
  private _startedAt: number;

  constructor(config: GameConfig) {
    this.roomId = config.roomId;
    this.mode = config.mode;
    this.turnTimer = config.turnTimer;
    this.maxTurns = config.maxTurns;
    this.prompt = config.prompt;
    this.player1 = config.player1;
    this.player2 = config.player2;
    this._activePlayerId = config.player1.id;
    this._startedAt = Date.now();
  }

  get activePlayerId(): PlayerId {
    return this._activePlayerId;
  }

  get currentTurnNumber(): number {
    return this._turns.length + 1;
  }

  get turns(): ReadonlyArray<TurnDTO> {
    return this._turns;
  }

  get isFinished(): boolean {
    return this._isFinished;
  }

  get storyText(): string {
    const words = this._turns.map((t) => t.content);
    if (this.prompt) {
      return `${this.prompt} ${words.join(" ")}`;
    }
    return words.join(" ");
  }

  get players(): [GamePlayer, GamePlayer] {
    return [this.player1, this.player2];
  }

  private getOpponent(playerId: PlayerId): PlayerId {
    return playerId === this.player1.id ? this.player2.id : this.player1.id;
  }

  private getPlayerName(playerId: PlayerId): string {
    return playerId === this.player1.id
      ? this.player1.displayName
      : this.player2.displayName;
  }

  submitTurn(playerId: PlayerId, content: string, responseTimeMs: number): TurnDTO {
    if (this._isFinished) throw new GameAlreadyFinishedError();
    if (playerId !== this._activePlayerId) throw new NotYourTurnError();

    const trimmed = content.trim();
    const turn: TurnDTO = {
      id: createId() as TurnId,
      roomId: this.roomId,
      playerId,
      content: trimmed,
      turnNumber: this.currentTurnNumber,
      responseTimeMs,
      createdAt: new Date().toISOString(),
    };

    this._turns.push(turn);
    this._activePlayerId = this.getOpponent(playerId);

    if (this.maxTurns && this._turns.length >= this.maxTurns) {
      this._isFinished = true;
    }

    return turn;
  }

  skipTurn(playerId: PlayerId): void {
    if (this._isFinished) throw new GameAlreadyFinishedError();
    if (playerId !== this._activePlayerId) throw new NotYourTurnError();

    this._activePlayerId = this.getOpponent(playerId);
  }

  forceFinish(): void {
    this._isFinished = true;
  }

  computeStats(): GameStats {
    const p1Turns = this._turns.filter((t) => t.playerId === this.player1.id);
    const p2Turns = this._turns.filter((t) => t.playerId === this.player2.id);

    const allTurns = [...p1Turns, ...p2Turns];
    const fastest = allTurns.length > 0
      ? allTurns.reduce((min, t) => (t.responseTimeMs < min.responseTimeMs ? t : min))
      : null;

    const longestWord = allTurns.reduce<{ word: string; playerId: PlayerId } | null>(
      (best, t) => {
        const words = t.content.split(/\s+/);
        const longest = words.reduce((a, b) => (a.length >= b.length ? a : b), "");
        if (!best || longest.length > best.word.length) {
          return { word: longest, playerId: t.playerId };
        }
        return best;
      },
      null,
    );

    const durationSeconds = Math.round((Date.now() - this._startedAt) / 1000);

    return {
      fastest: fastest
        ? { playerName: this.getPlayerName(fastest.playerId), timeMs: fastest.responseTimeMs }
        : { playerName: "-", timeMs: 0 },
      longestWord: longestWord
        ? { playerName: this.getPlayerName(longestWord.playerId), word: longestWord.word }
        : { playerName: "-", word: "-" },
      skips: { playerName: "-", count: 0 }, // TODO: track skips
      durationSeconds,
    };
  }

  computeContributions(): PlayerContributions {
    const p1Turns = this._turns.filter((t) => t.playerId === this.player1.id);
    const p2Turns = this._turns.filter((t) => t.playerId === this.player2.id);

    const avgTime = (turns: TurnDTO[]) =>
      turns.length > 0
        ? Math.round(turns.reduce((sum, t) => sum + t.responseTimeMs, 0) / turns.length)
        : 0;

    return {
      player1: {
        name: this.player1.displayName,
        userId: null,
        wordCount: p1Turns.reduce((sum, t) => sum + t.content.split(/\s+/).length, 0),
        avgResponseTimeMs: avgTime(p1Turns),
      },
      player2: {
        name: this.player2.displayName,
        userId: null,
        wordCount: p2Turns.reduce((sum, t) => sum + t.content.split(/\s+/).length, 0),
        avgResponseTimeMs: avgTime(p2Turns),
      },
    };
  }
}
