/**
 * Animated LogoMark — powered by Framer Motion.
 * Two circles breathe, pulse, and overlap smoothly.
 */
import { motion } from "framer-motion";

interface AnimatedLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  xs: { box: 22, radius: 6, circle: 8 },
  sm: { box: 36, radius: 9, circle: 14 },
  md: { box: 56, radius: 14, circle: 22 },
  lg: { box: 80, radius: 20, circle: 32 },
};

export function AnimatedLogo({ size = "md", className = "" }: AnimatedLogoProps) {
  const s = sizes[size];
  const centerY = s.box / 2 - s.circle / 2;

  return (
    <div
      className={`relative overflow-hidden bg-ink ${className}`}
      style={{ width: s.box, height: s.box, borderRadius: s.radius }}
    >
      {/* Pop circle */}
      <motion.div
        className="absolute bg-pop rounded-full"
        style={{ width: s.circle, height: s.circle, top: centerY }}
        animate={{
          left: [s.box * 0.12, s.box * 0.3, s.box * 0.12],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.8,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      {/* White circle */}
      <motion.div
        className="absolute bg-white rounded-full"
        style={{ width: s.circle, height: s.circle, top: centerY, opacity: 0.85 }}
        animate={{
          left: [s.box * 0.52, s.box * 0.34, s.box * 0.52],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.8,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    </div>
  );
}

/** Inline loading indicator — animated logo + optional text */
export function LoadingIndicator({
  text,
  size = "sm",
}: {
  text?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 gap-4">
      <AnimatedLogo size={size} />
      {text && (
        <motion.p
          className="font-mono text-xs text-ink-50"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
