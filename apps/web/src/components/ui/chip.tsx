import { cn } from "@/lib/utils";

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      className={cn("chip", active && "chip-active")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
