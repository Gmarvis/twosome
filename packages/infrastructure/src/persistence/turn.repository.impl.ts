import type { RoomId, TurnDTO, TurnId } from "@twosome/shared";
import { getSupabaseClient } from "../supabase/client";

export class SupabaseTurnRepository {
  private get db() {
    return getSupabaseClient();
  }

  async save(turn: TurnDTO): Promise<void> {
    const { error } = await this.db.from("turns").insert({
      id: turn.id,
      room_id: turn.roomId,
      player_id: turn.playerId,
      content: turn.content,
      turn_number: turn.turnNumber,
      response_time_ms: turn.responseTimeMs,
    });

    if (error) {
      console.error("[TurnRepo] save failed:", error.message);
    }
  }

  async findByRoomId(roomId: RoomId): Promise<TurnDTO[]> {
    const { data, error } = await this.db
      .from("turns")
      .select("*")
      .eq("room_id", roomId)
      .order("turn_number", { ascending: true });

    if (error || !data) return [];
    return data.map((row): TurnDTO => ({
      id: row.id as TurnId,
      roomId: row.room_id as RoomId,
      playerId: row.player_id,
      content: row.content,
      turnNumber: row.turn_number,
      responseTimeMs: row.response_time_ms,
      createdAt: row.created_at,
    }));
  }
}
