import type { RoomCode } from "../types";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
const ROOM_CODE_LENGTH = 6;

export function generateRoomCode(): RoomCode {
  let code = "";
  const array = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(array);
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[array[i] % ROOM_CODE_CHARS.length];
  }
  return code as RoomCode;
}

export function isValidRoomCode(code: string): code is RoomCode {
  if (code.length !== ROOM_CODE_LENGTH) return false;
  return [...code].every((c) => ROOM_CODE_CHARS.includes(c.toUpperCase()));
}

export function normalizeRoomCode(code: string): RoomCode {
  return code.toUpperCase().trim() as RoomCode;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function formatResponseTime(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function createId(): string {
  return crypto.randomUUID();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
