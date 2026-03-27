import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useGameStore } from "@/hooks/use-game-store";
import {
  submitTurn,
  skipTurn,
  finishGame,
  realtime,
  getRoomById,
  turnRepo,
} from "@/container";
import {
  submitTurnCommand,
  skipTurnCommand,
  finishGameCommand,
  getRoomByIdQuery,
  getActiveGame,
  registerGame,
} from "@twosome/application";
import { Game } from "@twosome/domain";
import type { TurnDTO, PlayerId, RoomId } from "@twosome/shared";
import { LogoMark } from "@/components/ui/logo-mark";
import { LoadingIndicator } from "@/components/ui/animated-logo";
import {
  playYourTurn,
  playTurnReceived,
  playSubmitSuccess,
  playTimerTick,
  playGameFinished,
} from "@/hooks/use-sounds";

function log(...args: unknown[]) {
  console.log("[play]", ...args);
}

export function Play() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    room,
    setRoom,
    players,
    setPlayers,
    localPlayerId,
    setLocalPlayerId,
    turns,
    addTurn,
    clearTurns,
    timerSeconds,
    setTimerSeconds,
    setFinishState,
  } = useGameStore();

  const [input, setInput] = useState("");
  const [turnStartTime, setTurnStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [skipCount, setSkipCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── DETERMINISTIC active player ──────────────────────────
  // players are ordered by joined_at ASC from DB.
  // players[0] (host) takes turns 1, 3, 5… (when turns.length is even)
  // players[1] takes turns 2, 4, 6… (when turns.length is odd)
  // This is computed purely from shared data — no separate state to desync.
  const activeIndex = (turns.length + skipCount) % 2;
  const activePlayerId =
    players.length >= 2 ? (players[activeIndex]?.id ?? null) : null;
  const isMyTurn =
    activePlayerId != null &&
    localPlayerId != null &&
    activePlayerId === localPlayerId;

  const currentTurn = turns.length + 1;
  const maxTurns = room?.maxTurns ?? null;
  const progress = maxTurns ? (turns.length / maxTurns) * 100 : 0;
  const isGameOver = maxTurns ? turns.length >= maxTurns : false;

  const localPlayer = players.find((p) => p.id === localPlayerId);
  const otherPlayer = players.find((p) => p.id !== localPlayerId);

  // ── Debug log ────────────────────────────────────────────
  useEffect(() => {
    log("state:", {
      isMyTurn,
      activePlayerId,
      localPlayerId,
      turns: turns.length,
      skips: skipCount,
      players: players.map((p) => p.id.slice(-4)),
    });
  }, [isMyTurn, activePlayerId, localPlayerId, turns.length, skipCount, players]);

  // ── Init: always fetch from DB ───────────────────────────
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    const init = async () => {
      log("init", roomId);

      // 0) Clear stale turns from any previous game
      clearTurns();

      // 1) Fetch room + players from DB (always — don't trust Zustand)
      let currentRoom = useGameStore.getState().room;
      let currentPlayers = useGameStore.getState().players;
      try {
        const result = await getRoomById.execute(
          getRoomByIdQuery({ roomId: roomId as RoomId }),
        );
        if (result && !cancelled) {
          currentRoom = result.room;
          currentPlayers = result.players;
          setRoom(result.room);
          setPlayers(result.players);
          log("room:", currentPlayers.map((p) => p.displayName));
        }
      } catch (err) {
        log("ERROR fetch room:", err);
      }

      // 2) Recover localPlayerId from sessionStorage if Zustand lost it
      let myId = useGameStore.getState().localPlayerId;
      if (!myId && currentPlayers.length >= 1) {
        const byRoom = sessionStorage.getItem(`twosome:pid:${roomId}`);
        if (byRoom) {
          const m = currentPlayers.find((p) => p.id === byRoom);
          if (m) {
            myId = m.id;
            setLocalPlayerId(m.id);
          }
        }
        if (!myId && currentRoom?.code) {
          const byCode = sessionStorage.getItem(
            `twosome:player:${currentRoom.code}`,
          );
          if (byCode) {
            const m = currentPlayers.find((p) => p.id === byCode);
            if (m) {
              myId = m.id;
              setLocalPlayerId(m.id);
            }
          }
        }
      }
      if (myId) sessionStorage.setItem(`twosome:pid:${roomId}`, myId);

      // 3) Recover turns from DB (always — we just cleared stale state)
      try {
        const dbTurns = await turnRepo.findByRoomId(roomId as RoomId);
        if (dbTurns.length > 0 && !cancelled) {
          log("recovered", dbTurns.length, "turns");
          for (const t of dbTurns) addTurn(t);
        }
      } catch {
        /* ok */
      }

      // 4) Ensure Game entity exists for SubmitTurnHandler validation
      if (
        currentRoom &&
        currentPlayers.length >= 2 &&
        !getActiveGame(roomId)
      ) {
        const game = new Game({
          roomId: roomId as RoomId,
          mode: currentRoom.gameMode,
          turnTimer: currentRoom.turnTimer,
          maxTurns: currentRoom.maxTurns,
          prompt: currentRoom.prompt,
          player1: {
            id: currentPlayers[0].id,
            displayName: currentPlayers[0].displayName,
          },
          player2: {
            id: currentPlayers[1].id,
            displayName: currentPlayers[1].displayName,
          },
        });
        registerGame(roomId, game);
        // Replay recovered turns so entity is in sync
        for (const t of useGameStore.getState().turns) {
          try {
            game.submitTurn(t.playerId, t.content, t.responseTimeMs);
          } catch {
            /* ok */
          }
        }
        log("Game entity created");
      }

      if (!cancelled) setIsLoading(false);
    };

    init();
    return () => {
      cancelled = true;
      // Always clear loading on cleanup so the screen never gets stuck
      setIsLoading(false);
    };
  }, [roomId]);

  // ── Broadcast listener ───────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const unsub = realtime.onBroadcast(roomId as any, (event) => {
      log("broadcast:", event.type);

      if (event.type === "turn.submitted") {
        const p = event.payload;
        // Only process turns from the OTHER player
        if (p.playerId !== localPlayerId) {
          addTurn({
            id: "" as any,
            roomId: roomId as any,
            playerId: p.playerId,
            content: p.content,
            turnNumber: p.turnNumber,
            responseTimeMs: p.responseTimeMs,
            createdAt: new Date().toISOString(),
          });
          // Sync Game entity
          const game = getActiveGame(roomId);
          if (game) {
            try {
              game.submitTurn(p.playerId, p.content, p.responseTimeMs);
            } catch {}
          }
          setTurnStartTime(Date.now());
          // NOTE: active player auto-swaps because turns.length changed
        }
      }

      if (event.type === "turn.skipped") {
        if (event.payload.playerId !== localPlayerId) {
          setSkipCount((c) => c + 1);
          setTurnStartTime(Date.now());
          const game = getActiveGame(roomId);
          if (game) {
            try {
              game.skipTurn(event.payload.playerId);
            } catch {}
          }
        }
      }

      if (event.type === "game.finished") {
        const p = event.payload;
        setFinishState(p.fullText, p.contributions, p.stats);
        navigate(`/finished/${roomId}`);
      }
    });

    return unsub;
  }, [roomId, localPlayerId]);

  // ── Timer ────────────────────────────────────────────────
  useEffect(() => {
    if (!room?.turnTimer || !isMyTurn || isGameOver) {
      setTimerSeconds(null);
      return;
    }

    setTimerSeconds(room.turnTimer);
    let remaining = room.turnTimer;

    timerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (localPlayerId && roomId) {
          skipTurn
            .execute(
              skipTurnCommand({
                roomId: roomId as any,
                playerId: localPlayerId,
              }),
            )
            .catch((err) => console.error("[play] skip failed:", err));
          // Own skip
          setSkipCount((c) => c + 1);
          setTurnStartTime(Date.now());
          const game = getActiveGame(roomId);
          if (game) {
            try {
              game.skipTurn(localPlayerId);
            } catch {}
          }
        }
        setTimerSeconds(null);
      } else {
        if (remaining <= 3) playTimerTick();
        setTimerSeconds(remaining);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMyTurn, room?.turnTimer, localPlayerId, roomId, isGameOver]);

  // ── Sound: your turn / turn received ─────────────────────
  const prevTurnCount = useRef(turns.length);
  useEffect(() => {
    if (isLoading) return;
    // Only play sounds after the initial load
    if (prevTurnCount.current !== turns.length) {
      prevTurnCount.current = turns.length;
      if (isMyTurn && !isGameOver) playYourTurn();
      else if (!isMyTurn && !isGameOver) playTurnReceived();
    }
  }, [turns.length, isMyTurn, isGameOver, isLoading]);

  // ── Sound: game finished ─────────────────────────────────
  useEffect(() => {
    if (isGameOver) playGameFinished();
  }, [isGameOver]);

  // ── Auto-focus + auto-scroll ─────────────────────────────
  useEffect(() => {
    if (!isLoading && !isGameOver) {
      // Small delay so the DOM is fully painted before we grab focus
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isLoading, isMyTurn, isGameOver]);

  useEffect(() => {
    storyRef.current?.scrollTo({
      top: storyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns.length]);

  // ── Game over ────────────────────────────────────────────
  useEffect(() => {
    if (!isGameOver || !roomId) return;
    const timeout = setTimeout(async () => {
      try {
        await finishGame.execute(
          finishGameCommand({ roomId: roomId as any }),
        );
      } catch {
        /* ok */
      }
      const game = getActiveGame(roomId);
      if (game) {
        setFinishState(
          game.storyText,
          game.computeContributions(),
          game.computeStats(),
        );
      }
      navigate(`/finished/${roomId}`);
    }, 800);
    return () => clearTimeout(timeout);
  }, [isGameOver, roomId]);

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    log("submit", { isMyTurn, input: input.trim(), localPlayerId });
    if (
      !isMyTurn ||
      !input.trim() ||
      isSubmitting ||
      !roomId ||
      !localPlayerId ||
      isGameOver
    )
      return;

    setSubmitError(null);
    setIsSubmitting(true);
    const responseTimeMs = Date.now() - turnStartTime;
    const content = input.trim();

    // Optimistic UI — turns.length increments → active player auto-swaps
    const turn: TurnDTO = {
      id: "" as any,
      roomId: roomId as any,
      playerId: localPlayerId,
      content,
      turnNumber: currentTurn,
      responseTimeMs,
      createdAt: new Date().toISOString(),
    };
    addTurn(turn);
    setInput("");
    setTurnStartTime(Date.now());
    playSubmitSuccess();

    try {
      await submitTurn.execute(
        submitTurnCommand({
          roomId: roomId as any,
          playerId: localPlayerId,
          content,
          responseTimeMs,
        }),
      );
      log("submit OK");
    } catch (err: any) {
      console.error("[play] submit failed:", err);
      setSubmitError(err.message || "submit failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isMyTurn,
    input,
    isSubmitting,
    roomId,
    localPlayerId,
    turnStartTime,
    currentTurn,
    isGameOver,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Render ───────────────────────────────────────────────
  if (isLoading) {
    return <LoadingIndicator text="starting game..." />;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 py-2 px-5">
        <LogoMark size="sm" />
        <div className="flex-1" />
        <span className="font-mono text-[11px] text-ink-50">
          {currentTurn} / {maxTurns ?? "∞"}
        </span>
        {timerSeconds !== null && (
          <div
            className={`w-[42px] h-[42px] rounded-full border-[3px] flex items-center justify-center font-mono font-bold text-lg ${
              timerSeconds <= 3
                ? "border-pop text-pop"
                : "border-ink text-ink"
            }`}
          >
            {timerSeconds}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {maxTurns && (
        <div className="h-1 bg-ink/[0.06] mx-5">
          <div
            className="h-full bg-gradient-to-r from-pop to-pop-dark transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      {/* Story area — takes all available space */}
      <div
        ref={storyRef}
        className="flex-1 overflow-y-auto px-5 py-4"
      >
        {/* Player legend */}
        <div className="flex gap-2 justify-center items-center mb-3">
          <span className="w-2 h-2 rounded-full bg-pop" />
          <span className="font-mono text-[10px] text-ink-50">
            {players[0]?.displayName ?? "player 1"}
          </span>
          <span className="w-2 h-2 rounded-full bg-ink ml-1" />
          <span className="font-mono text-[10px] text-ink-50">
            {players[1]?.displayName ?? "player 2"}
          </span>
        </div>

        <div className="font-display text-base font-medium leading-[2]">
          {room?.prompt && (
            <span className="text-ink-50 italic">{room.prompt} </span>
          )}
          {turns.map((turn, i) => {
            const isP1 = turn.playerId === players[0]?.id;
            return (
              <span
                key={i}
                className={isP1 ? "text-pop font-bold" : "text-ink"}
              >
                {turn.content}{" "}
              </span>
            );
          })}
          {isMyTurn && !isGameOver && (
            <span className="inline-block w-[2.5px] h-[18px] bg-pop ml-0.5 align-text-bottom animate-blink" />
          )}
        </div>
      </div>

      {/* Bottom bar — input + status, pinned to bottom */}
      <div
        className="border-t border-ink/[0.06] bg-bg px-5 pt-3 pb-5"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Turn indicator */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-chip font-mono text-[10px] font-bold uppercase tracking-wider ${
              isMyTurn && !isGameOver
                ? "bg-pop text-white"
                : "bg-ink/[0.06] text-ink-50"
            }`}
          >
            {isGameOver ? "fin." : isMyTurn ? "your turn" : "waiting"}
          </span>
          <span className="font-mono text-[10px] text-ink-50">
            {isGameOver
              ? ""
              : isMyTurn
                ? `${otherPlayer?.displayName ?? "partner"} is watching`
                : `${otherPlayer?.displayName ?? "partner"} is writing...`}
          </span>
        </div>

        {/* Input */}
        <div className={`flex gap-2 ${isMyTurn && !isGameOver ? "animate-pulse-once" : ""}`}>
          <input
            ref={inputRef}
            autoFocus
            className={`field flex-1 transition-shadow duration-300 ${
              isMyTurn && !isGameOver ? "ring-2 ring-pop/40 shadow-[0_0_12px_rgba(232,82,88,0.15)]" : ""
            }`}
            placeholder={
              isMyTurn && !isGameOver
                ? room?.gameMode === "word"
                  ? "tap here & type a word..."
                  : "tap here & type a sentence..."
                : room?.gameMode === "word"
                  ? "type a word..."
                  : "type a sentence..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isMyTurn || isSubmitting || isGameOver}
            maxLength={room?.gameMode === "word" ? 30 : 200}
          />
          <button
            type="button"
            className="btn-sm rounded-[12px] px-[18px] py-3"
            onClick={handleSubmit}
            disabled={
              !isMyTurn || !input.trim() || isSubmitting || isGameOver
            }
          >
            ↑
          </button>
        </div>

        {submitError && (
          <p className="font-mono text-[10px] text-red-500 text-center mt-1">
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
}
