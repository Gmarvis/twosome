import {
  SupabaseRoomRepository,
  SupabasePlayerRepository,
  SupabaseStoryRepository,
  SupabaseTurnRepository,
  SupabaseRealtimeAdapter,
  SupabaseAuthAdapter,
} from "@twosome/infrastructure";

import {
  InMemoryEventBus,
  CreateRoomHandler,
  JoinRoomHandler,
  ToggleReadyHandler,
  StartGameHandler,
  SubmitTurnHandler,
  SkipTurnHandler,
  FinishGameHandler,
  GetRoomByCodeHandler,
  GetRoomByIdHandler,
  GetStoryArchiveHandler,
  GetGameResultHandler,
} from "@twosome/application";

// ============================================================
// Singletons
// ============================================================

const eventBus = new InMemoryEventBus();
const realtime = new SupabaseRealtimeAdapter();
const auth = new SupabaseAuthAdapter();

const roomRepo = new SupabaseRoomRepository();
const playerRepo = new SupabasePlayerRepository();
const storyRepo = new SupabaseStoryRepository();
const turnRepo = new SupabaseTurnRepository();

// ============================================================
// Command handlers
// ============================================================

export const createRoom = new CreateRoomHandler(roomRepo, playerRepo, realtime, eventBus);
export const joinRoom = new JoinRoomHandler(roomRepo, playerRepo, realtime, eventBus);
export const toggleReady = new ToggleReadyHandler(playerRepo, realtime, eventBus);
export const startGame = new StartGameHandler(roomRepo, playerRepo, realtime, eventBus);
export const submitTurn = new SubmitTurnHandler(realtime, eventBus, turnRepo);
export const skipTurn = new SkipTurnHandler(realtime, eventBus);
export const finishGame = new FinishGameHandler(roomRepo, realtime, eventBus);

// ============================================================
// Query handlers
// ============================================================

export const getRoomByCode = new GetRoomByCodeHandler(roomRepo, playerRepo);
export const getRoomById = new GetRoomByIdHandler(roomRepo, playerRepo);
export const getStoryArchive = new GetStoryArchiveHandler(storyRepo);
export const getGameResult = new GetGameResultHandler();

// ============================================================
// Infrastructure exports
// ============================================================

export { eventBus, realtime, auth, roomRepo, playerRepo, storyRepo, turnRepo };
