import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGameStore } from "@/hooks/use-game-store";
import { createRoom } from "@/container";
import { createRoomCommand, type CreateRoomPayload } from "@twosome/application";
import type { GameMode, TimerPreset, TurnPreset } from "@twosome/shared";
import { LogoMark } from "@/components/ui/logo-mark";
import { Chip } from "@/components/ui/chip";

export function Setup() {
  const navigate = useNavigate();
  const { user, displayName } = useAuthStore();
  const { setRoom, setLocalPlayerId, setPhase } = useGameStore();

  const [gameMode, setGameMode] = useState<GameMode>("word");
  const [turnTimer, setTurnTimer] = useState<TimerPreset | null>(10);
  const [maxTurns, setMaxTurns] = useState<TurnPreset | null>(20);
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const payload: CreateRoomPayload = {
        hostDisplayName: displayName || "Player",
        hostUserId: user?.id ?? null,
        gameMode,
        turnTimer,
        maxTurns,
        prompt: prompt.trim() || null,
      };

      const result = await createRoom.execute(createRoomCommand(payload));
      setLocalPlayerId(result.playerId);
      setPhase("lobby");
      navigate(`/room/${result.code}`);
    } catch (err) {
      console.error("Failed to create room:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-5 pb-5">
      <div className="flex items-center gap-2 py-3">
        <button
          className="font-display font-extrabold text-lg cursor-pointer"
          onClick={() => navigate("/")}
        >
          ←
        </button>
        <LogoMark size="sm" />
      </div>

      <div className="flex flex-col gap-5 flex-1">
        <div>
          <h2 className="font-display font-extrabold text-[22px] tracking-tight">
            story builder
          </h2>
          <p className="font-mono text-xs text-ink-50 mt-0.5">
            build nonsense together
          </p>
        </div>

        <div>
          <label className="mono-label mb-1.5 block">mode</label>
          <div className="flex gap-1.5">
            <Chip active={gameMode === "word"} onClick={() => setGameMode("word")}>
              word
            </Chip>
            <Chip active={gameMode === "sentence"} onClick={() => setGameMode("sentence")}>
              sentence
            </Chip>
          </div>
        </div>

        <div>
          <label className="mono-label mb-1.5 block">timer</label>
          <div className="flex gap-1.5">
            {([5, 10, 15] as const).map((t) => (
              <Chip key={t} active={turnTimer === t} onClick={() => setTurnTimer(t)}>
                {t}s
              </Chip>
            ))}
            <Chip active={turnTimer === null} onClick={() => setTurnTimer(null)}>
              off
            </Chip>
          </div>
        </div>

        <div>
          <label className="mono-label mb-1.5 block">turns</label>
          <div className="flex gap-1.5">
            {([10, 20, 50] as const).map((t) => (
              <Chip key={t} active={maxTurns === t} onClick={() => setMaxTurns(t)}>
                {t}
              </Chip>
            ))}
            <Chip active={maxTurns === null} onClick={() => setMaxTurns(null)}>
              ∞
            </Chip>
          </div>
        </div>

        <div>
          <label className="mono-label mb-1.5 block">starter (optional)</label>
          <input
            className="field"
            placeholder="once upon a..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="flex-1" />

        <button
          className="btn-main"
          onClick={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? "creating..." : "let's go"}{" "}
          {!isCreating && <span className="text-pop ml-1.5">→</span>}
        </button>
      </div>
    </div>
  );
}
