import type { PlayerId, RoomId } from "@twosome/shared";
import type { Player } from "./player.entity";

export interface PlayerRepository {
  create(player: Player): Promise<void>;
  findById(id: PlayerId): Promise<Player | null>;
  findByRoomId(roomId: RoomId): Promise<Player[]>;
  updateReady(id: PlayerId, isReady: boolean): Promise<void>;
  remove(id: PlayerId): Promise<void>;
}
