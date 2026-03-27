import { useRef, useEffect } from "react";
import type { GameMode } from "@twosome/shared";

interface TurnInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isMyTurn: boolean;
  isSubmitting: boolean;
  gameMode: GameMode;
}

export function TurnInput({
  value,
  onChange,
  onSubmit,
  isMyTurn,
  isSubmitting,
  gameMode,
}: TurnInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMyTurn) inputRef.current?.focus();
  }, [isMyTurn]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        className="field flex-1"
        placeholder={gameMode === "word" ? "type a word..." : "type a sentence..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!isMyTurn || isSubmitting}
        maxLength={gameMode === "word" ? 30 : 200}
      />
      <button
        className="btn-sm rounded-[12px] px-[18px] py-3"
        onClick={onSubmit}
        disabled={!isMyTurn || !value.trim() || isSubmitting}
      >
        ↑
      </button>
    </div>
  );
}
