import { useState } from "react";
import { auth } from "@/container";
import { useAuthStore } from "@/hooks/use-auth-store";

interface SignupNudgeProps {
  message?: string;
}

export function SignupNudge({
  message = "sign up to keep this — one tap, we promise",
}: SignupNudgeProps) {
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);

  if (!user?.isAnonymous || dismissed) return null;

  return (
    <div className="flex flex-col items-center gap-3 py-4 px-5 bg-white border-[2px] border-ink-20 rounded-card">
      <p className="font-mono text-[11px] text-ink-50 text-center">{message}</p>

      <div className="flex gap-2 w-full">
        <button
          className="flex-1 py-2.5 bg-ink text-white rounded-[10px] font-display font-bold text-[13px] cursor-pointer flex items-center justify-center gap-2"
          onClick={() => auth.linkWithGoogle()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>

        <button
          className="flex-1 py-2.5 bg-ink text-white rounded-[10px] font-display font-bold text-[13px] cursor-pointer flex items-center justify-center gap-2"
          onClick={() => auth.linkWithApple()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.18-3.74 4.25z" />
          </svg>
          Apple
        </button>
      </div>

      <button
        className="font-mono text-[10px] text-ink-20 cursor-pointer bg-transparent border-0"
        onClick={() => setDismissed(true)}
      >
        maybe later
      </button>
    </div>
  );
}
