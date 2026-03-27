import { useNavigate } from "react-router";
import { useAuthStore } from "@/hooks/use-auth-store";
import { LogoMark } from "@/components/ui/logo-mark";

export function Home() {
  const navigate = useNavigate();
  const { displayName, setDisplayName } = useAuthStore();

  const handleCreate = () => {
    if (!displayName.trim()) return;
    navigate("/setup");
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

        <button className="btn-pop" onClick={handleCreate} disabled={!displayName.trim()}>
          start new game →
        </button>
      </div>

      <button
        className="font-mono text-xs text-ink-50 underline underline-offset-2 cursor-pointer mt-1"
        onClick={() => navigate("/how-to-play")}
      >
        how does this work?
      </button>

      <p className="mono-label mt-auto pb-2">
        no signup · no bs · just play
      </p>
    </div>
  );
}
