export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class RoomNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Room not found: ${identifier}`, "ROOM_NOT_FOUND");
    this.name = "RoomNotFoundError";
  }
}

export class RoomFullError extends DomainError {
  constructor(code: string) {
    super(
      `This room's taken — they've got company already (${code})`,
      "ROOM_FULL",
    );
    this.name = "RoomFullError";
  }
}

export class RoomNotReadyError extends DomainError {
  constructor() {
    super("Both players need to be ready", "ROOM_NOT_READY");
    this.name = "RoomNotReadyError";
  }
}

export class NotYourTurnError extends DomainError {
  constructor() {
    super("Hold on — it's not your turn yet", "NOT_YOUR_TURN");
    this.name = "NotYourTurnError";
  }
}

export class GameAlreadyFinishedError extends DomainError {
  constructor() {
    super("This game is already done", "GAME_FINISHED");
    this.name = "GameAlreadyFinishedError";
  }
}

export class InvalidGameModeError extends DomainError {
  constructor(mode: string) {
    super(`Invalid game mode: ${mode}`, "INVALID_GAME_MODE");
    this.name = "InvalidGameModeError";
  }
}

export class PlayerDisconnectedError extends DomainError {
  constructor(playerName: string) {
    super(`${playerName} vanished. rude.`, "PLAYER_DISCONNECTED");
    this.name = "PlayerDisconnectedError";
  }
}
