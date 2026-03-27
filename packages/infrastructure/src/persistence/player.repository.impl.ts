import type { PlayerId, RoomId, RoomPlayerDTO } from "@twosome/shared";
import { Player, type PlayerRepository } from "@twosome/domain";
import { getSupabaseClient } from "../supabase/client";

export class SupabasePlayerRepository implements PlayerRepository {
  private get db() {
    return getSupabaseClient();
  }

  async create(player: Player): Promise<void> {
    const dto = player.toDTO();
    const { error } = await this.db.from("room_players").insert({
      id: dto.id,
      room_id: dto.roomId,
      user_id: dto.userId,
      display_name: dto.displayName,
      is_host: dto.isHost,
      is_ready: dto.isReady,
    });

    if (error) throw new Error(`Failed to create player: ${error.message}`);
  }

  async findById(id: PlayerId): Promise<Player | null> {
    const { data, error } = await this.db
      .from("room_players")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return Player.fromDTO(this.toDTO(data));
  }

  async findByRoomId(roomId: RoomId): Promise<Player[]> {
    const { data, error } = await this.db
      .from("room_players")
      .select("*")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });

    if (error || !data) return [];
    return data.map((row) => Player.fromDTO(this.toDTO(row)));
  }

  async updateReady(id: PlayerId, isReady: boolean): Promise<void> {
    const { error } = await this.db
      .from("room_players")
      .update({ is_ready: isReady })
      .eq("id", id);

    if (error) throw new Error(`Failed to update ready: ${error.message}`);
  }

  async remove(id: PlayerId): Promise<void> {
    const { error } = await this.db
      .from("room_players")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to remove player: ${error.message}`);
  }

  private toDTO(row: any): RoomPlayerDTO {
    return {
      id: row.id,
      roomId: row.room_id,
      userId: row.user_id,
      displayName: row.display_name,
      isHost: row.is_host,
      isReady: row.is_ready,
      joinedAt: row.joined_at,
    };
  }
}
