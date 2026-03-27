import type { RealtimeChannel } from "@supabase/supabase-js";
import type { RoomId, PlayerId, TwosomeEvent } from "@twosome/shared";
import type { RealtimePort, PresenceState } from "@twosome/application";
import { getSupabaseClient } from "../supabase/client";

type BroadcastCallback = (event: TwosomeEvent) => void;
type PresenceCallback = (players: PresenceState[]) => void;

export class SupabaseRealtimeAdapter implements RealtimePort {
  private channels = new Map<string, RealtimeChannel>();
  private broadcastCallbacks = new Map<string, Set<BroadcastCallback>>();
  private presenceCallbacks = new Map<string, Set<PresenceCallback>>();
  private subscribedKeys = new Set<string>();

  private channelKey(roomId: RoomId): string {
    return `room:${roomId}`;
  }

  /**
   * Get or create a channel. Registers internal broadcast + presence listeners
   * BEFORE subscribing so Supabase delivers events properly.
   */
  private getOrCreateChannel(roomId: RoomId): RealtimeChannel {
    const key = this.channelKey(roomId);
    if (this.channels.has(key)) return this.channels.get(key)!;

    const channel = getSupabaseClient().channel(key, {
      config: { presence: { key: "players" } },
    });

    // Register a SINGLE broadcast listener — dispatches to all registered callbacks
    channel.on("broadcast", { event: "game_event" }, ({ payload }) => {
      const cbs = this.broadcastCallbacks.get(key);
      if (cbs) {
        for (const cb of cbs) {
          try { cb(payload as TwosomeEvent); } catch (e) { console.error("[realtime] broadcast callback error:", e); }
        }
      }
    });

    // Register a SINGLE presence listener — dispatches to all registered callbacks
    channel.on("presence", { event: "sync" }, () => {
      const cbs = this.presenceCallbacks.get(key);
      if (!cbs) return;

      const state = channel.presenceState<PresenceState>();
      const players: PresenceState[] = [];

      for (const k of Object.keys(state)) {
        const presences = state[k];
        if (presences) {
          for (const p of presences) {
            players.push({
              playerId: p.playerId,
              displayName: p.displayName,
              isReady: p.isReady,
              onlineAt: p.onlineAt,
            });
          }
        }
      }

      for (const cb of cbs) {
        try { cb(players); } catch (e) { console.error("[realtime] presence callback error:", e); }
      }
    });

    this.channels.set(key, channel);
    return channel;
  }

  /**
   * Ensure the channel is subscribed. Safe to call multiple times.
   */
  private ensureSubscribed(roomId: RoomId): void {
    const key = this.channelKey(roomId);
    if (this.subscribedKeys.has(key)) return;
    this.subscribedKeys.add(key);

    const channel = this.getOrCreateChannel(roomId);
    channel.subscribe((status) => {
      console.log(`[realtime] ${key} subscribe:`, status);
      if (status === "CHANNEL_ERROR") {
        this.subscribedKeys.delete(key);
      }
    });
  }

  async joinRoom(roomId: RoomId, playerId: PlayerId, displayName: string): Promise<void> {
    const channel = this.getOrCreateChannel(roomId);
    const key = this.channelKey(roomId);

    if (!this.subscribedKeys.has(key)) {
      this.subscribedKeys.add(key);
      await new Promise<void>((resolve, reject) => {
        channel.subscribe((status) => {
          console.log(`[realtime] channel ${key} status:`, status);
          if (status === "SUBSCRIBED") resolve();
          if (status === "CHANNEL_ERROR") {
            this.subscribedKeys.delete(key);
            console.error(`[realtime] channel ${key} subscribe error`);
            reject(new Error("Failed to join room channel"));
          }
        });
      });
    }

    const trackResult = await channel.track({
      playerId,
      displayName,
      isReady: false,
      onlineAt: new Date().toISOString(),
    });
    console.log(`[realtime] track result for ${playerId}:`, trackResult);
  }

  async leaveRoom(roomId: RoomId): Promise<void> {
    const key = this.channelKey(roomId);
    const channel = this.channels.get(key);
    if (!channel) return;

    await channel.untrack();
    await getSupabaseClient().removeChannel(channel);
    this.channels.delete(key);
    this.broadcastCallbacks.delete(key);
    this.presenceCallbacks.delete(key);
    this.subscribedKeys.delete(key);
  }

  async broadcast(roomId: RoomId, event: TwosomeEvent): Promise<void> {
    this.ensureSubscribed(roomId);
    const channel = this.getOrCreateChannel(roomId);
    await channel.send({
      type: "broadcast",
      event: "game_event",
      payload: event,
    });
  }

  onBroadcast(roomId: RoomId, callback: BroadcastCallback): () => void {
    const key = this.channelKey(roomId);

    // Ensure channel exists and is subscribed (critical after page refresh)
    this.ensureSubscribed(roomId);

    if (!this.broadcastCallbacks.has(key)) {
      this.broadcastCallbacks.set(key, new Set());
    }
    this.broadcastCallbacks.get(key)!.add(callback);

    return () => {
      this.broadcastCallbacks.get(key)?.delete(callback);
    };
  }

  onPresenceSync(roomId: RoomId, callback: PresenceCallback): () => void {
    const key = this.channelKey(roomId);

    // Ensure channel exists and is subscribed
    this.ensureSubscribed(roomId);

    if (!this.presenceCallbacks.has(key)) {
      this.presenceCallbacks.set(key, new Set());
    }
    this.presenceCallbacks.get(key)!.add(callback);

    return () => {
      this.presenceCallbacks.get(key)?.delete(callback);
    };
  }

  async trackPresence(roomId: RoomId, state: PresenceState): Promise<void> {
    const channel = this.getOrCreateChannel(roomId);
    await channel.track(state);
  }

  async updatePresence(roomId: RoomId, state: Partial<PresenceState>): Promise<void> {
    const channel = this.getOrCreateChannel(roomId);
    const current = channel.presenceState();

    const keys = Object.keys(current);
    if (keys.length > 0) {
      const existing = current[keys[0]]?.[0] as unknown as PresenceState | undefined;
      if (existing) {
        await channel.track({ ...existing, ...state });
        return;
      }
    }

    await channel.track(state as PresenceState);
  }
}
