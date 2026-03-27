import { cn } from "@/lib/utils";

interface RoomCodeDisplayProps {
  code: string;
  className?: string;
}

export function RoomCodeDisplay({ code, className }: RoomCodeDisplayProps) {
  const chars = code.padEnd(6, "·").split("").slice(0, 6);

  return (
    <div className={cn("inline-flex gap-2", className)}>
      {chars.map((char, i) => (
        <div
          key={i}
          className="w-12 h-[60px] bg-white border-[2.5px] border-ink rounded-[10px]
                     flex items-center justify-center
                     font-mono font-bold text-[28px] text-ink"
        >
          {char}
        </div>
      ))}
    </div>
  );
}
