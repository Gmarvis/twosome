import type { TurnDTO, PlayerId, PlayerContributions } from "@twosome/shared";
import { formatDuration } from "@twosome/shared";

interface BookPageProps {
  turns: TurnDTO[];
  player1Id?: PlayerId;
  contributions: PlayerContributions | null;
  durationSeconds?: number;
}

export function BookPage({ turns, player1Id, contributions, durationSeconds }: BookPageProps) {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="relative rounded-sm p-5"
      style={{
        background: "#FFFCF7",
        border: "1.5px solid rgba(26,26,26,0.15)",
        boxShadow: "4px 4px 0 rgba(26,26,26,0.06)",
      }}
    >
      {/* Left margin line */}
      <div
        className="absolute left-4 top-3 bottom-3 w-[1.5px]"
        style={{ background: "rgba(244,63,94,0.12)" }}
      />

      <p
        className="font-mono text-[9px] tracking-widest uppercase mb-3 pl-3.5"
        style={{ color: "rgba(26,26,26,0.15)" }}
      >
        twosome — {today}
      </p>

      <div
        className="pl-3.5"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "14px",
          lineHeight: 2,
          color: "#3D3A37",
        }}
      >
        {turns.map((turn, i) => {
          const isP1 = turn.playerId === player1Id;
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
        className="mt-3.5 pt-2.5 pl-3.5 flex justify-between"
        style={{
          borderTop: "1px solid rgba(26,26,26,0.06)",
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          color: "rgba(26,26,26,0.2)",
        }}
      >
        <span>
          {contributions?.player1.name} &{" "}
          {contributions?.player2.name}
        </span>
        <span>
          {turns.length} words
          {durationSeconds ? ` · ${formatDuration(durationSeconds)}` : ""}
        </span>
      </div>
    </div>
  );
}
