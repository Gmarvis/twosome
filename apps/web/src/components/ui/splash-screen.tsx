import { useState, useEffect } from "react";
import { AnimatedLogo } from "@/components/ui/animated-logo";

/**
 * Full-screen splash screen shown on first app load.
 * Fades out after a delay, then unmounts.
 */
export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<"show" | "fade-out">("show");

  useEffect(() => {
    // Show for 1.5s, then fade over 0.5s
    const showTimer = setTimeout(() => setPhase("fade-out"), 1500);
    const hideTimer = setTimeout(() => onFinish(), 2000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-ink flex flex-col items-center justify-center gap-6 transition-opacity duration-500 ${
        phase === "fade-out" ? "opacity-0" : "opacity-100"
      }`}
    >
      <AnimatedLogo size="lg" className="!bg-transparent" />

      <div className="text-center animate-fade-up">
        <h1 className="font-display font-black text-[48px] leading-none tracking-tighter text-white">
          two<br />some.
        </h1>
        <p className="font-mono text-xs text-white/40 mt-2">
          games for two humans ↗
        </p>
      </div>
    </div>
  );
}
