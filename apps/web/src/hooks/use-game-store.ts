import { create } from "zustand";
import type {
  RoomDTO,
  RoomPlayerDTO,
  TurnDTO,
  PlayerId,
  RoomId,
  GameStats,
  PlayerContributions,
} from "@twosome/shared";

type GamePhase = "home" | "setup" | "lobby" | "playing" | "finished";

interface GameState {
  // Navigation
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;

  // Room
  room: RoomDTO | null;
  setRoom: (room: RoomDTO | null) => void;

  // Players
  players: RoomPlayerDTO[];
  setPlayers: (players: RoomPlayerDTO[]) => void;
  updatePlayer: (playerId: PlayerId, updates: Partial<RoomPlayerDTO>) => void;

  // Local player
  localPlayerId: PlayerId | null;
  setLocalPlayerId: (id: PlayerId) => void;

  // Game state
  turns: TurnDTO[];
  addTurn: (turn: TurnDTO) => void;
  clearTurns: () => void;
  activePlayerId: PlayerId | null;
  setActivePlayerId: (id: PlayerId | null) => void;
  timerSeconds: number | null;
  setTimerSeconds: (seconds: number | null) => void;

  // Finish state
  storyText: string;
  contributions: PlayerContributions | null;
  stats: GameStats | null;
  setFinishState: (story: string, contributions: PlayerContributions, stats: GameStats) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  phase: "home" as GamePhase,
  room: null,
  players: [],
  localPlayerId: null,
  turns: [],
  activePlayerId: null,
  timerSeconds: null,
  storyText: "",
  contributions: null,
  stats: null,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setRoom: (room) => set({ room }),
  setPlayers: (players) => set({ players }),
  updatePlayer: (playerId, updates) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p,
      ),
    })),
  setLocalPlayerId: (localPlayerId) => set({ localPlayerId }),
  addTurn: (turn) =>
    set((state) => ({
      turns: [...state.turns, turn],
      storyText: state.storyText
        ? `${state.storyText} ${turn.content}`
        : turn.content,
    })),
  clearTurns: () => set({ turns: [], storyText: "" }),
  setActivePlayerId: (activePlayerId) => set({ activePlayerId }),
  setTimerSeconds: (timerSeconds) => set({ timerSeconds }),
  setFinishState: (storyText, contributions, stats) =>
    set({ storyText, contributions, stats, phase: "finished" }),
  reset: () => set(initialState),
}));
