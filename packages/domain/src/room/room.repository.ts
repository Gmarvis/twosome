import type { RoomId, RoomCode } from "@twosome/shared";
import type { Room } from "./room.entity";

export interface RoomRepository {
  create(room: Room): Promise<void>;
  findById(id: RoomId): Promise<Room | null>;
  findByCode(code: RoomCode): Promise<Room | null>;
  updateStatus(id: RoomId, status: Room["status"]): Promise<void>;
}
