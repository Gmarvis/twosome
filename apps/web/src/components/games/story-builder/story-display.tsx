import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { TurnDTO, PlayerId } from "@twosome/shared";

interface StoryDisplayProps {
  turns: TurnDTO[];
  prompt?: string | null;
  player1Id?: PlayerId;
  activePlayerId?: PlayerId | null;
  isMyTurn?: boolean;
  className?: string;
}

export const StoryDisplay = forwardRef<HTMLDivElement, StoryDisplayProps>(
  ({ turns, prompt, player1Id, activePlayerId, isMyTurn, className }, ref) => {
    return (
      <div ref={ref} className={cn("story-box min-h-[140px] max-h-[280px] overflow-y-auto", className)}>
        {prompt && <span className="text-ink-50 italic">{prompt} </span>}

        {turns.map((turn, i) => {
          const isP1 = turn.playerId === player1Id;
          return (
            <span
              key={i}
              className={cn(isP1 ? "text-pop font-bold" : "text-ink")}
            >
              {turn.content}{" "}
            </span>
          );
        })}

        {isMyTurn && (
          <span className="inline-block w-[2.5px] h-[18px] bg-pop ml-0.5 align-text-bottom animate-blink" />
        )}
      </div>
    );
  },
);

StoryDisplay.displayName = "StoryDisplay";
