import type { StoryId, RoomId, UserId } from "@twosome/shared";
import type { Story } from "./story.entity";

export interface StoryRepository {
  save(story: Story): Promise<void>;
  findById(id: StoryId): Promise<Story | null>;
  findByUserId(userId: UserId): Promise<Story[]>;
  findByRoomId(roomId: RoomId): Promise<Story | null>;
  delete(id: StoryId): Promise<void>;
}
