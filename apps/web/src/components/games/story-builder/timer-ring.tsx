import { cn } from "@/lib/utils";

interface TimerRingProps {
  seconds: number | null;
  className?: string;
}

export function TimerRing({ seconds, className }: TimerRingProps) {
  if (seconds === null) return null;

  const isUrgent = seconds <= 3;

  return (
    <div
      className={cn(
        "w-[42px] h-[42px] rounded-full border-[3px] flex items-center justify-center font-mono font-bold text-lg transition-colors",
        isUrgent ? "border-pop text-pop" : "border-ink text-ink",
        className,
      )}
    >
      {seconds}
    </div>
  );
}
