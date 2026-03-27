// Supabase client
export { getSupabaseClient } from "./supabase/client";

// Repository implementations
export { SupabaseRoomRepository } from "./persistence/room.repository.impl";
export { SupabasePlayerRepository } from "./persistence/player.repository.impl";
export { SupabaseStoryRepository } from "./persistence/story.repository.impl";
export { SupabaseTurnRepository } from "./persistence/turn.repository.impl";

// Adapters
export { SupabaseRealtimeAdapter } from "./realtime/realtime.adapter";
export { SupabaseAuthAdapter } from "./auth/auth.adapter";
