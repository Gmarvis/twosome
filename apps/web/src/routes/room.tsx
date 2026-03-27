import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGameStore } from "@/hooks/use-game-store";
import {
  joinRoom,
  toggleReady,
  startGame,
  getRoomByCode,
  realtime,
} from "@/container";
import {
  joinRoomCommand,
  toggleReadyCommand,
  startGameCommand,
  getRoomByCodeQuery,
} from "@twosome/application";
import type { RoomCode, PlayerId } from "@twosome/shared";
import { LogoMark } from "@/components/ui/logo-mark";
import { PlayerCard } from "@/components/room/player-card";
import { RoomCodeDisplay } from "@/components/room/room-code-display";
import { playPlayerJoined, playGameStart } from "@/hooks/use-sounds";
import { LoadingIndicator } from "@/components/ui/animated-logo";

function getStoredPlayerId(code: string): PlayerId | null {
  const val = sessionStorage.getItem(`twosome:player:${code}`);
  return val ? (val as PlayerId) : null;
}

function storePlayerId(code: string, playerId: PlayerId) {
  sessionStorage.setItem(`twosome:player:${code}`, playerId);
}

export function Room() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, displayName, isLoading: authLoading } = useAuthStore();
  const {
    room,
    setRoom,
    players,
    setPlayers,
    localPlayerId,
    setLocalPlayerId,
    setPhase,
    updatePlayer,
  } = useGameStore();

  const [isJoining, setIsJoining] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Persist localPlayerId to sessionStorage so it survives page refreshes
  useEffect(() => {
    if (localPlayerId && code) {
      storePlayerId(code, localPlayerId);
    }
    // Also persist by roomId for play.tsx recovery
    if (localPlayerId && room?.id) {
      sessionStorage.setItem(`twosome:pid:${room.id}`, localPlayerId);
    }
  }, [localPlayerId, code, room?.id]);

  // Init: fetch room data and join if we're a new player
  useEffect(() => {
    if (!code) return;
    if (authLoading) {
      // Auth still loading — show loading but don't fetch yet
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        console.log("[room] init", { code, userId: user?.id });

        const result = await getRoomByCode.execute(
          getRoomByCodeQuery({ code: code as RoomCode }),
        );

        if (cancelled) return;

        if (!result) {
          setError("room not found");
          setIsLoadingRoom(false);
          return;
        }

        console.log("[room] fetched", {
          playerCount: result.players.length,
          players: result.players.map((p) => ({ id: p.id, name: p.displayName, userId: p.userId })),
        });

        setRoom(result.room);
        setPlayers(result.players);

        // 1) Check Zustand localPlayerId (host navigating from /setup)
        const zustandPlayerId = useGameStore.getState().localPlayerId;
        if (zustandPlayerId) {
          const match = result.players.find((p) => p.id === zustandPlayerId);
          if (match) {
            console.log("[room] found self via zustand localPlayerId:", zustandPlayerId);
            setIsLoadingRoom(false);
            return;
          }
        }

        // 2) Check sessionStorage (same-tab refresh)
        const storedId = getStoredPlayerId(code);
        if (storedId) {
          const match = result.players.find((p) => p.id === storedId);
          if (match) {
            console.log("[room] found self via sessionStorage:", storedId);
            setLocalPlayerId(match.id);
            setIsLoadingRoom(false);
            return;
          }
        }

        // 3) Check by auth userId (session restored after refresh)
        if (user?.id) {
          const match = result.players.find((p) => p.userId === user.id);
          if (match) {
            console.log("[room] found self via userId:", match.id);
            setLocalPlayerId(match.id);
            setIsLoadingRoom(false);
            return;
          }
        }

        // 4) Not in the room yet — check room status first
        if (result.room.status === "playing") {
          setError("this game is already in progress");
          setIsLoadingRoom(false);
          return;
        }
        if (result.room.status === "finished") {
          setError("this game is already done — start a new one");
          setIsLoadingRoom(false);
          return;
        }
        if (result.players.length >= 2) {
          setError("this room's taken — they've got company already");
          setIsLoadingRoom(false);
          return;
        }

        // Double-check we haven't already joined (race condition / StrictMode)
        const freshResult = await getRoomByCode.execute(
          getRoomByCodeQuery({ code: code as RoomCode }),
        );
        if (cancelled) return;
        if (freshResult) {
          // Re-check against the fresh player list
          const alreadyIn = freshResult.players.find(
            (p) => p.userId === user?.id && user?.id,
          );
          if (alreadyIn) {
            console.log("[room] already in room (race):", alreadyIn.id);
            setLocalPlayerId(alreadyIn.id);
            setRoom(freshResult.room);
            setPlayers(freshResult.players);
            setIsLoadingRoom(false);
            return;
          }
          if (freshResult.players.length >= 2) {
            setError("this room's taken — they've got company already");
            setIsLoadingRoom(false);
            return;
          }
        }

        console.log("[room] joining room...");
        setIsJoining(true);

        try {
          const joinResult = await joinRoom.execute(
            joinRoomCommand({
              code: code as RoomCode,
              displayName: displayName || "Player 2",
              userId: user?.id ?? null,
            }),
          );

          if (cancelled) return;

          console.log("[room] joined:", joinResult.playerId);
          setLocalPlayerId(joinResult.playerId);

          // Re-fetch to get the full updated player list
          const updated = await getRoomByCode.execute(
            getRoomByCodeQuery({ code: code as RoomCode }),
          );
          if (!cancelled && updated) {
            setRoom(updated.room);
            setPlayers(updated.players);
          }
        } catch (joinErr: any) {
          if (!cancelled) {
            console.error("[room] join failed:", joinErr);
            setError(joinErr.message || "failed to join room");
          }
        } finally {
          if (!cancelled) setIsJoining(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("[room] init error:", err);
          setError(err.message || "something went wrong");
        }
      } finally {
        // ALWAYS clear loading — even if cancelled. This prevents the screen
        // from getting stuck in a loading state when StrictMode or dep changes
        // cancel a previous run.
        setIsLoadingRoom(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [code, authLoading, user?.id]);

  // Poll DB for player list updates (reliable source of truth)
  useEffect(() => {
    if (!code || !room?.id) return;

    const poll = async () => {
      try {
        const result = await getRoomByCode.execute(
          getRoomByCodeQuery({ code: code as RoomCode }),
        );
        if (result) {
          setRoom(result.room);
          setPlayers(result.players);
        }
      } catch (err) {
        console.error("[room] poll failed:", err);
      }
    };

    const pollInterval = setInterval(poll, 2000);
    return () => clearInterval(pollInterval);
  }, [code, room?.id]);

  // Realtime: presence for quick ready-state updates + broadcast for game start
  useEffect(() => {
    if (!room?.id) return;
    const currentRoomId = room.id;

    const unsubPresence = realtime.onPresenceSync(currentRoomId, (presencePlayers) => {
      console.log("[room] presence sync", presencePlayers.map((p) => ({ id: p.playerId, ready: p.isReady })));
      // Only merge ready-state — don't overwrite the DB-sourced player list
      for (const pp of presencePlayers) {
        updatePlayer(pp.playerId, { isReady: pp.isReady });
      }
    });

    const unsubBroadcast = realtime.onBroadcast(currentRoomId, (event) => {
      if (event.type === "game.started") {
        playGameStart();
        setPhase("playing");
        navigate(`/play/${currentRoomId}`);
      }
    });

    return () => {
      unsubPresence();
      unsubBroadcast();
    };
  }, [room?.id]);

  const handleToggleReady = useCallback(async () => {
    if (!room?.id || !localPlayerId) return;
    try {
      await toggleReady.execute(
        toggleReadyCommand({ roomId: room.id, playerId: localPlayerId }),
      );
    } catch (err) {
      console.error("[room] toggle ready failed:", err);
    }
  }, [room?.id, localPlayerId]);

  const handleStart = useCallback(async () => {
    if (!room?.id) return;
    try {
      await startGame.execute(startGameCommand({ roomId: room.id }));
      playGameStart();
      setPhase("playing");
      navigate(`/play/${room.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  }, [room?.id]);

  const localPlayer = players.find((p) => p.id === localPlayerId);
  const otherPlayer = players.find((p) => p.id !== localPlayerId);
  const hostPlayer = players.find((p) => p.isHost);
  const bothPresent = players.length >= 2;
  const isHost = localPlayer?.isHost ?? false;

  // Sound: player joined
  const prevPlayerCount = useRef(players.length);
  useEffect(() => {
    if (players.length >= 2 && prevPlayerCount.current < 2) {
      playPlayerJoined();
    }
    prevPlayerCount.current = players.length;
  }, [players.length]);
  const allReady = bothPresent && players.every((p) => p.isReady);
  const canStart = allReady && isHost;

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (isLoadingRoom || authLoading) {
    return <LoadingIndicator text="loading room..." />;
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-4">
        <p className="font-mono text-sm text-ink-50">{error}</p>
        <button className="btn-ghost max-w-[200px]" onClick={() => navigate("/")}>
          go home
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-5 pb-5">
      {/* Header */}
      <div className="flex items-center gap-2 py-3">
        <button
          className="font-display font-extrabold text-lg cursor-pointer"
          onClick={() => navigate("/")}
        >
          ←
        </button>
        <LogoMark size="sm" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        {/* Room code — only while waiting for player 2 */}
        {!bothPresent ? (
          <>
            <div className="text-center">
              <p className="mono-label mb-2.5">room code</p>
              <RoomCodeDisplay code={code || ""} />
              <button
                className="font-mono text-[11px] text-pop font-bold mt-2.5 cursor-pointer bg-transparent border-0"
                onClick={copyCode}
              >
                {copied ? "copied!" : "tap to copy"}
              </button>
            </div>
            <div className="w-full h-[2px] bg-ink opacity-[0.06]" />
          </>
        ) : (
          <div className="text-center animate-bounce-in">
            <h2 className="font-display font-black text-[52px] leading-none tracking-tight text-pop">
              ready
            </h2>
            <h2 className="font-display font-black text-[52px] leading-none tracking-tight text-ink">
              to go
            </h2>
          </div>
        )}

        {/* Players */}
        <div className={`w-full flex flex-col gap-2 ${bothPresent ? "animate-fade-up" : ""}`}>
          {localPlayer && (
            <PlayerCard
              name={localPlayer.displayName}
              initial={localPlayer.displayName[0]}
              isHost={localPlayer.isHost}
              isReady={localPlayer.isReady}
              isLocal
              variant="p1"
              onToggleReady={handleToggleReady}
            />
          )}
          {otherPlayer ? (
            <>
              <div className="flex items-center gap-3 my-0.5">
                <div className="flex-1 h-[1.5px] bg-ink opacity-[0.06]" />
                <span className="font-display font-black text-[10px] text-ink-20 tracking-widest">VS</span>
                <div className="flex-1 h-[1.5px] bg-ink opacity-[0.06]" />
              </div>
              <PlayerCard
                name={otherPlayer.displayName}
                initial={otherPlayer.displayName[0]}
                isHost={otherPlayer.isHost}
                isReady={otherPlayer.isReady}
                variant="p2"
              />
            </>
          ) : (
            <div className="p-4 border-[2.5px] border-dashed border-ink-20 rounded-card flex items-center justify-center">
              <span className="font-mono text-xs text-ink-20">
                {isJoining ? "joining..." : "waiting for player 2..."}
              </span>
            </div>
          )}
        </div>

        {/* Game settings */}
        {room && (
          <div className={`flex gap-1.5 flex-wrap justify-center ${bothPresent ? "animate-fade-up" : ""}`} style={bothPresent ? { animationDelay: "0.1s" } : undefined}>
            <span className="chip chip-active text-[10px] py-1.5 px-2.5">
              {room.gameMode} mode
            </span>
            {room.turnTimer && (
              <span className="chip chip-active text-[10px] py-1.5 px-2.5">
                {room.turnTimer}s
              </span>
            )}
            {room.maxTurns && (
              <span className="chip chip-active text-[10px] py-1.5 px-2.5">
                {room.maxTurns} turns
              </span>
            )}
          </div>
        )}

        {/* Start / status */}
        <div className={`w-full mt-4 ${bothPresent ? "animate-fade-up" : ""}`} style={bothPresent ? { animationDelay: "0.2s" } : undefined}>
          {isHost ? (
            <button
              className="btn-pop w-full"
              disabled={!canStart}
              onClick={handleStart}
              style={{ opacity: canStart ? 1 : 0.35 }}
            >
              {!bothPresent
                ? "waiting on your person..."
                : !allReady
                  ? "both need to be ready"
                  : "let's go →"}
            </button>
          ) : (
            <div className="w-full py-4 rounded-card text-center font-display font-bold text-sm text-ink-50 bg-ink/[0.04]">
              {!bothPresent
                ? "waiting on your person..."
                : allReady
                  ? `waiting for ${hostPlayer?.displayName ?? "host"} to start...`
                  : "waiting to ready up..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
