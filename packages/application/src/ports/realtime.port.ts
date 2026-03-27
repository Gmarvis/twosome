import type { RoomId, PlayerId, TwosomeEvent } from "@twosome/shared";

export interface PresenceState {
  playerId: PlayerId;
  displayName: string;
  isReady: boolean;
  onlineAt: string;
}

export interface RealtimePort {
  joinRoom(roomId: RoomId, playerId: PlayerId, displayName: string): Promise<void>;
  leaveRoom(roomId: RoomId): Promise<void>;
  broadcast(roomId: RoomId, event: TwosomeEvent): Promise<void>;
  onBroadcast(roomId: RoomId, callback: (event: TwosomeEvent) => void): () => void;
  onPresenceSync(roomId: RoomId, callback: (players: PresenceState[]) => void): () => void;
  trackPresence(roomId: RoomId, state: PresenceState): Promise<void>;
  updatePresence(roomId: RoomId, state: Partial<PresenceState>): Promise<void>;
}
