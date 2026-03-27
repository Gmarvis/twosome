import type { StoryId, RoomId, UserId, SavedStoryDTO } from "@twosome/shared";
import { Story, type StoryRepository } from "@twosome/domain";
import { getSupabaseClient } from "../supabase/client";

export class SupabaseStoryRepository implements StoryRepository {
  private get db() {
    return getSupabaseClient();
  }

  async save(story: Story): Promise<void> {
    const dto = story.toDTO();
    const { error } = await this.db.from("saved_stories").upsert({
      id: dto.id,
      room_id: dto.roomId,
      user_id: dto.userId,
      full_text: dto.fullText,
      player_contributions: dto.playerContributions,
      stats: dto.stats,
    });

    if (error) throw new Error(`Failed to save story: ${error.message}`);
  }

  async findById(id: StoryId): Promise<Story | null> {
    const { data, error } = await this.db
      .from("saved_stories")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return Story.fromDTO(this.toDTO(data));
  }

  async findByUserId(userId: UserId): Promise<Story[]> {
    const { data, error } = await this.db
      .from("saved_stories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => Story.fromDTO(this.toDTO(row)));
  }

  async findByRoomId(roomId: RoomId): Promise<Story | null> {
    const { data, error } = await this.db
      .from("saved_stories")
      .select("*")
      .eq("room_id", roomId)
      .limit(1)
      .single();

    if (error || !data) return null;
    return Story.fromDTO(this.toDTO(data));
  }

  async delete(id: StoryId): Promise<void> {
    const { error } = await this.db
      .from("saved_stories")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete story: ${error.message}`);
  }

  private toDTO(row: any): SavedStoryDTO {
    return {
      id: row.id,
      roomId: row.room_id,
      userId: row.user_id,
      fullText: row.full_text,
      playerContributions: row.player_contributions,
      stats: row.stats,
      createdAt: row.created_at,
    };
  }
}
