import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/hooks/use-auth-store";
import { LogoMark } from "@/components/ui/logo-mark";
import { unlockAudio } from "@/hooks/use-sounds";

export function Home() {
  const navigate = useNavigate();
  const { displayName, setDisplayName } = useAuthStore();
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const handleCreate = () => {
    if (!displayName.trim()) return;
    unlockAudio();
    navigate("/setup");
  };

  const handleJoin = () => {
    if (!displayName.trim()) return;
    unlockAudio();
    if (showJoin && joinCode.trim().length === 6) {
      navigate(`/room/${joinCode.toUpperCase()}`);
    } else {
      setShowJoin(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 pb-5 gap-7 pt-10">
      <div className="text-center">
        <LogoMark size="lg" className="mx-auto mb-5" />
        <h1 className="font-display font-black text-[42px] leading-none tracking-tighter text-ink">
          two<br />some.
        </h1>
        <p className="font-mono text-xs text-ink-50 mt-2">
          games for two humans ↗
        </p>
      </div>

      <div className="w-full flex flex-col gap-2.5">
        <input
          className="field text-center"
          placeholder="who are you?"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={20}
        />

        <button className="btn-main" onClick={handleCreate}>
          start new game <span className="text-pop ml-1.5">→</span>
        </button>

        {showJoin ? (
          <div className="flex gap-2">
            <input
              className="field flex-1 text-center uppercase tracking-widest"
              placeholder="ROOM CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
            />
            <button
              className="btn-sm rounded px-5"
              onClick={handleJoin}
              disabled={joinCode.length !== 6}
            >
              go
            </button>
          </div>
        ) : (
          <button className="btn-ghost" onClick={handleJoin}>
            jump in
          </button>
        )}
      </div>

      <p className="mono-label mt-auto pb-2">
        no signup · no bs · just play
      </p>
    </div>
  );
}
