import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/hooks/use-game-store";
import { useAuthStore } from "@/hooks/use-auth-store";
import { getRoomById, turnRepo, createRoom, realtime } from "@/container";
import { getRoomByIdQuery, getActiveGame, createRoomCommand } from "@twosome/application";
import type { RoomId, RoomCode, TurnDTO, GameStats, PlayerContributions } from "@twosome/shared";
import { Events } from "@twosome/shared";
import { LogoMark } from "@/components/ui/logo-mark";
import { SignupNudge } from "@/components/auth/signup-nudge";
import { playGameFinished } from "@/hooks/use-sounds";
import { LoadingIndicator } from "@/components/ui/animated-logo";
import { formatResponseTime, formatDuration } from "@twosome/shared";
import { analyzeStory, type StoryAnalysis } from "@/lib/gemini";
import { RevealCard } from "@/components/games/story-builder/reveal-card";
import { RevealLoading } from "@/components/games/story-builder/reveal-loading";

type Tab = "story" | "reveal";

/** Compute stats purely from turns + players — no Game entity needed */
function computeStatsFromTurns(
  turnList: TurnDTO[],
  playerList: { id: string; displayName: string }[],
  startTime?: string,
): { stats: GameStats; contributions: PlayerContributions } {
  const getName = (id: string) =>
    playerList.find((p) => p.id === id)?.displayName ?? "";

  const p1 = playerList[0];
  const p2 = playerList[1];
  const p1Turns = turnList.filter((t) => t.playerId === p1?.id);
  const p2Turns = turnList.filter((t) => t.playerId === p2?.id);

  const fastest = turnList.length > 0
    ? turnList.reduce((min, t) => (t.responseTimeMs < min.responseTimeMs ? t : min))
    : null;

  const longestWord = turnList.reduce<{ word: string; playerId: string } | null>(
    (best, t) => {
      const words = t.content.split(/\s+/);
      const longest = words.reduce((a, b) => (a.length >= b.length ? a : b), "");
      if (!best || longest.length > best.word.length) {
        return { word: longest, playerId: t.playerId };
      }
      return best;
    },
    null,
  );

  const first = turnList[0]?.createdAt;
  const last = turnList[turnList.length - 1]?.createdAt;
  const durationSeconds =
    first && last
      ? Math.round((new Date(last).getTime() - new Date(first).getTime()) / 1000)
      : 0;

  const avgTime = (arr: TurnDTO[]) =>
    arr.length > 0
      ? Math.round(arr.reduce((sum, t) => sum + t.responseTimeMs, 0) / arr.length)
      : 0;

  return {
    stats: {
      fastest: fastest
        ? { playerName: getName(fastest.playerId), timeMs: fastest.responseTimeMs }
        : { playerName: "-", timeMs: 0 },
      longestWord: longestWord
        ? { playerName: getName(longestWord.playerId), word: longestWord.word }
        : { playerName: "-", word: "-" },
      skips: { playerName: "-", count: 0 },
      durationSeconds,
    },
    contributions: {
      player1: {
        name: p1?.displayName ?? "",
        userId: null,
        wordCount: p1Turns.reduce((sum, t) => sum + t.content.split(/\s+/).length, 0),
        avgResponseTimeMs: avgTime(p1Turns),
      },
      player2: {
        name: p2?.displayName ?? "",
        userId: null,
        wordCount: p2Turns.reduce((sum, t) => sum + t.content.split(/\s+/).length, 0),
        avgResponseTimeMs: avgTime(p2Turns),
      },
    },
  };
}

export function Finished() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const {
    storyText,
    contributions,
    stats,
    turns,
    players,
    room,
    setRoom,
    setPlayers,
    addTurn,
    setFinishState,
    reset,
  } = useGameStore();
  const { user, displayName } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingRematch, setIsCreatingRematch] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("story");

  // AI Reveal state
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  // Sound on mount
  useEffect(() => { playGameFinished(); }, []);

  // Recover data from DB if Zustand was reset (page refresh)
  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;
    const needsFullRecovery = turns.length === 0 || !room;
    const needsStats = !contributions || !stats;

    if (!needsFullRecovery && !needsStats) return;

    if (needsFullRecovery) setIsLoading(true);

    const recover = async () => {
      try {
        let currentPlayers = players;
        let currentTurns = turns;

        // Fetch room + players if missing
        if (needsFullRecovery || currentPlayers.length < 2) {
          const result = await getRoomById.execute(
            getRoomByIdQuery({ roomId: roomId as RoomId }),
          );
          if (result && !cancelled) {
            setRoom(result.room);
            setPlayers(result.players);
            currentPlayers = result.players;
          }
        }

        // Fetch turns from DB if missing
        if (needsFullRecovery) {
          const dbTurns = await turnRepo.findByRoomId(roomId as RoomId);
          if (dbTurns.length > 0 && !cancelled) {
            for (const t of dbTurns) addTurn(t);
            currentTurns = dbTurns;
          }
        }

        // Compute stats if missing
        if (needsStats && currentTurns.length > 0 && currentPlayers.length >= 2 && !cancelled) {
          const computed = computeStatsFromTurns(currentTurns, currentPlayers);
          const text = currentTurns.map((t) => t.content).join(" ");
          setFinishState(
            storyText || text,
            computed.contributions,
            computed.stats,
          );
        }
      } catch (err) {
        console.error("[finished] recover failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    recover();
    return () => { cancelled = true; };
  }, [roomId]);

  // Fallback: compute stats from available data if Zustand stats are missing
  const resolvedStats = useMemo(() => {
    if (stats && contributions) return { stats, contributions };
    if (turns.length > 0 && players.length >= 2) {
      return computeStatsFromTurns(turns, players);
    }
    return { stats: null, contributions: null };
  }, [stats, contributions, turns, players]);

  const displayStats = resolvedStats.stats;
  const displayContributions = resolvedStats.contributions;

  const handlePlayAgain = async () => {
    if (!room || isCreatingRematch) return;
    setIsCreatingRematch(true);

    try {
      // Create a new room with the same settings
      const result = await createRoom.execute(
        createRoomCommand({
          hostDisplayName: displayName,
          hostUserId: user?.id ?? null,
          gameMode: room.gameMode,
          turnTimer: room.turnTimer,
          maxTurns: room.maxTurns,
          prompt: room.prompt,
        }),
      );

      // Broadcast play-again to the other player on the OLD room channel
      await realtime.broadcast(roomId as RoomId, Events.playAgain({
        roomId: roomId as RoomId,
        newRoomCode: result.code,
      }));

      // Reset local state and navigate to new room
      reset();
      useGameStore.getState().setLocalPlayerId(result.playerId);
      navigate(`/room/${result.code}?rematch=1`);
    } catch (err) {
      console.error("[finished] play again failed:", err);
      setIsCreatingRematch(false);
    }
  };

  const handleNewGame = () => {
    reset();
    navigate("/");
  };

  const handleReveal = async () => {
    if (revealing || analysis) return;
    setRevealing(true);
    setRevealError(null);

    // Resolve real names — NEVER fall back to generic "Player 1" / "Player 2"
    const p1RealName = players[0]?.displayName || displayContributions?.player1.name || "";
    const p2RealName = players[1]?.displayName || displayContributions?.player2.name || "";

    try {
      const result = await analyzeStory({
        storyText: storyText || turns.map((t) => t.content).join(" "),
        turns: turns.map((t) => ({
          playerId: t.playerId,
          content: t.content,
          turnNumber: t.turnNumber,
          responseTimeMs: t.responseTimeMs,
        })),
        players: [
          {
            id: players[0]?.id ?? "",
            name: p1RealName,
            wordCount: displayContributions?.player1.wordCount ?? 0,
            avgResponseTimeMs: displayContributions?.player1.avgResponseTimeMs ?? 0,
          },
          {
            id: players[1]?.id ?? "",
            name: p2RealName,
            wordCount: displayContributions?.player2.wordCount ?? 0,
            avgResponseTimeMs: displayContributions?.player2.avgResponseTimeMs ?? 0,
          },
        ],
        gameMode: (room?.gameMode as "word" | "sentence") ?? "word",
        turnTimer: room?.turnTimer ?? null,
      });
      setAnalysis(result);
    } catch (err: any) {
      console.error("[finished] reveal failed:", err);
      setRevealError(err?.message ?? "Something went wrong. Tap to try again.");
    } finally {
      setRevealing(false);
    }
  };

  const handleShareStory = async () => {
    const text = `${storyText}\n\n— written on twosome.`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  // Listen for play-again broadcast from the other player
  useEffect(() => {
    if (!roomId) return;

    const unsub = realtime.onBroadcast(roomId as RoomId, (event) => {
      if (event.type === "play.again") {
        const newCode = (event.payload as any).newRoomCode;
        if (newCode) {
          reset();
          navigate(`/room/${newCode}?rematch=1`);
        }
      }
    });

    return unsub;
  }, [roomId]);

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (isLoading) {
    return <LoadingIndicator text="loading story..." />;
  }

  return (
    <div className="flex flex-col h-dvh max-h-dvh">
      {/* ── Header (fixed) ── */}
      <header className="shrink-0 px-5 pt-3 pb-1 text-center">
        <LogoMark size="sm" className="mx-auto" />
        <h1 className="font-display font-black text-3xl leading-none text-pop mt-1.5">
          fin.
        </h1>
        <p className="font-mono text-[10px] text-ink-50 mt-0.5">
          you two wrote something
        </p>
      </header>

      {/* ── Tabs (fixed) ── */}
      <nav className="shrink-0 px-5 py-2">
        <div className="flex rounded-xl p-1 gap-1" style={{ background: "rgba(26,26,26,0.04)" }}>
          <TabButton
            label="📖 story"
            active={activeTab === "story"}
            onClick={() => setActiveTab("story")}
          />
          <TabButton
            label="🔮 reveal"
            active={activeTab === "reveal"}
            onClick={() => setActiveTab("reveal")}
          />
        </div>
      </nav>

      {/* ── Scrollable content ── */}
      <main className="flex-1 min-h-0 overflow-y-auto px-5 pb-3">
        <AnimatePresence mode="wait">
          {activeTab === "story" ? (
            <motion.div
              key="story"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-2.5"
            >
              {/* Book page */}
              <div
                className="relative rounded-lg p-4 shadow-[2px_2px_0_rgba(26,26,26,0.04)]"
                style={{
                  background: "#FFFCF7",
                  border: "1.5px solid rgba(26,26,26,0.1)",
                }}
              >
                <div
                  className="absolute left-3 top-3 bottom-3 w-[1.5px]"
                  style={{ background: "rgba(244,63,94,0.12)" }}
                />

                <p
                  className="font-mono text-[8px] tracking-widest uppercase mb-2 pl-3"
                  style={{ color: "rgba(26,26,26,0.15)" }}
                >
                  twosome — {today}
                </p>

                <div
                  className="pl-3 leading-[1.9]"
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "13px",
                    color: "#3D3A37",
                  }}
                >
                  {turns.map((turn, i) => {
                    const isP1 = turn.playerId === players[0]?.id;
                    return (
                      <span
                        key={i}
                        className={isP1 ? "italic" : ""}
                        style={{ color: isP1 ? "#F43F5E" : "#1A1A1A" }}
                      >
                        {turn.content}{" "}
                      </span>
                    );
                  })}
                </div>

                <div
                  className="mt-3 pt-2 pl-3 flex justify-between"
                  style={{
                    borderTop: "1px solid rgba(26,26,26,0.06)",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "8px",
                    color: "rgba(26,26,26,0.2)",
                  }}
                >
                  <span>
                    {displayContributions?.player1.name || players[0]?.displayName} &{" "}
                    {displayContributions?.player2.name || players[1]?.displayName}
                  </span>
                  <span>
                    {turns.length} turns{displayStats ? ` · ${formatDuration(displayStats.durationSeconds)}` : ""}
                  </span>
                </div>
              </div>

              {/* Fun stats */}
              {displayStats && (
                <div className="flex flex-col gap-1.5">
                  <StatRow
                    icon="⚡"
                    iconBg="#FFF1F2"
                    label="fastest fingers"
                    value={`${displayStats.fastest.playerName} · ${formatResponseTime(displayStats.fastest.timeMs)}`}
                    valueColor="#F43F5E"
                  />
                  <StatRow
                    icon="💬"
                    iconBg="#F0F9FF"
                    label="longest word"
                    value={`${displayStats.longestWord.playerName} · "${displayStats.longestWord.word}"`}
                    valueColor="#1A1A1A"
                  />
                  {displayStats.skips.count > 0 && (
                    <StatRow
                      icon="😴"
                      iconBg="#FEFCE8"
                      label="caught slacking"
                      value={`${displayStats.skips.playerName} · ${displayStats.skips.count}x`}
                      valueColor="rgba(26,26,26,0.5)"
                    />
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Not yet revealed */}
              {!analysis && !revealing && !revealError && (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <div className="text-4xl">🔮</div>
                  <p className="font-mono text-[11px] text-ink-50 text-center max-w-[220px] leading-relaxed">
                    the ai will read your story and reveal what it says about you two
                  </p>
                  <button
                    className="btn-pop text-[13px] px-6 py-3"
                    onClick={handleReveal}
                    disabled={turns.length === 0}
                  >
                    reveal what this says about you
                  </button>
                </div>
              )}

              {/* Loading */}
              {revealing && <RevealLoading />}

              {/* Error */}
              {revealError && !revealing && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <p className="font-mono text-xs text-pop text-center">
                    {revealError}
                  </p>
                  <button
                    className="btn-ghost text-[13px] px-5 py-2.5"
                    onClick={() => {
                      setRevealError(null);
                      setAnalysis(null);
                      handleReveal();
                    }}
                  >
                    try again
                  </button>
                </div>
              )}

              {/* Analysis result */}
              {analysis && <RevealCard analysis={analysis} playerNames={[
                players[0]?.displayName || displayContributions?.player1.name || "",
                players[1]?.displayName || displayContributions?.player2.name || "",
              ]} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer (fixed) ── */}
      <footer className="shrink-0 px-5 pb-4 pt-2 border-t" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
        <div className="flex gap-2">
          <button className="btn-pop flex-1 text-[13px] py-3" onClick={handleShareStory}>
            share ↗
          </button>
          <button
            className="btn-ghost flex-1 text-[13px] py-3"
            onClick={handlePlayAgain}
            disabled={isCreatingRematch}
          >
            {isCreatingRematch ? "..." : "play again"}
          </button>
          <button
            className="btn-ghost flex-1 text-[13px] py-3"
            onClick={handleNewGame}
          >
            new game
          </button>
        </div>

        {user?.isAnonymous && (
          <div className="mt-2">
            <SignupNudge message="sign up to keep this — one tap, we promise" />
          </div>
        )}
      </footer>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex-1 text-center py-2 rounded-lg text-[12px] font-display font-bold transition-all ${
        active
          ? "bg-white text-ink shadow-sm"
          : "text-ink-50 hover:text-ink"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function StatRow({
  icon,
  iconBg,
  label,
  value,
  valueColor,
}: {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div className="flex items-center gap-2.5 py-2 px-3 bg-white border-[1.5px] border-ink-20 rounded-[10px]">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <span className="font-display text-xs font-semibold text-warm-gray">
        {label}
      </span>
      <span
        className="ml-auto font-mono text-[11px] font-bold"
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
}
