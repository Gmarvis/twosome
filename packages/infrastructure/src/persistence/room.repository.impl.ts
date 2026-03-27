import type { RoomId, RoomCode, RoomDTO } from "@twosome/shared";
import { Room, type RoomRepository } from "@twosome/domain";
import { getSupabaseClient } from "../supabase/client";

export class SupabaseRoomRepository implements RoomRepository {
  private get db() {
    return getSupabaseClient();
  }

  async create(room: Room): Promise<void> {
    const dto = room.toDTO();
    const { error } = await this.db.from("rooms").insert({
      id: dto.id,
      code: dto.code,
      host_id: dto.hostId,
      game_mode: dto.gameMode,
      turn_timer: dto.turnTimer,
      max_turns: dto.maxTurns,
      prompt: dto.prompt,
      status: dto.status,
    });

    if (error) throw new Error(`Failed to create room: ${error.message}`);
  }

  async findById(id: RoomId): Promise<Room | null> {
    const { data: room, error } = await this.db
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !room) return null;

    const { count } = await this.db
      .from("room_players")
      .select("*", { count: "exact", head: true })
      .eq("room_id", id);

    return Room.fromDTO(this.toDTO(room), count ?? 0);
  }

  async findByCode(code: RoomCode): Promise<Room | null> {
    const { data: room, error } = await this.db
      .from("rooms")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !room) return null;

    const { count } = await this.db
      .from("room_players")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id);

    return Room.fromDTO(this.toDTO(room), count ?? 0);
  }

  async updateStatus(id: RoomId, status: string): Promise<void> {
    const { error } = await this.db
      .from("rooms")
      .update({ status })
      .eq("id", id);

    if (error) throw new Error(`Failed to update room status: ${error.message}`);
  }

  private toDTO(row: any): RoomDTO {
    return {
      id: row.id,
      code: row.code,
      hostId: row.host_id,
      gameMode: row.game_mode,
      turnTimer: row.turn_timer,
      maxTurns: row.max_turns,
      prompt: row.prompt,
      status: row.status,
      createdAt: row.created_at,
    };
  }
}
