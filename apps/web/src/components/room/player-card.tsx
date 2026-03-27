import { cn } from "@/lib/utils";

interface PlayerCardProps {
  name: string;
  initial: string;
  isHost: boolean;
  isReady: boolean;
  isLocal?: boolean;
  variant: "p1" | "p2";
  onToggleReady?: () => void;
}

export function PlayerCard({
  name,
  initial,
  isHost,
  isReady,
  isLocal,
  variant,
  onToggleReady,
}: PlayerCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 bg-white border-[2.5px] rounded-card transition-colors",
        isReady ? "border-pop bg-pop-soft" : "border-ink",
        isLocal && "cursor-pointer active:scale-[0.99]",
      )}
      onClick={isLocal ? onToggleReady : undefined}
      role={isLocal ? "button" : undefined}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center font-display font-extrabold text-sm text-white shrink-0",
          variant === "p1" ? "bg-pop" : "bg-ink",
        )}
      >
        {initial.toUpperCase()}
      </div>

      <div className="min-w-0">
        <p className="font-display font-bold text-sm truncate">{name}</p>
        <p className="font-mono text-[10px] text-ink-50">
          {isHost ? "host" : "just joined"}
        </p>
      </div>

      <span
        className={cn(
          "ml-auto font-mono text-[10px] font-bold uppercase tracking-wider shrink-0",
          isReady ? "text-pop" : "text-ink-20",
        )}
      >
        {isReady ? "ready" : ". . ."}
      </span>
    </div>
  );
}
