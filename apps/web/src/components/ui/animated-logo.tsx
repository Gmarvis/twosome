/**
 * Animated version of LogoMark — two circles orbit and pulse.
 * Used as loading indicator and in the splash screen.
 */

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { box: 36, radius: 9, circleSize: 14 },
  md: { box: 56, radius: 14, circleSize: 22 },
  lg: { box: 80, radius: 20, circleSize: 32 },
};

export function AnimatedLogo({ size = "md", className = "" }: AnimatedLogoProps) {
  const s = sizes[size];

  return (
    <div
      className={`relative overflow-hidden bg-ink ${className}`}
      style={{
        width: s.box,
        height: s.box,
        borderRadius: s.radius,
      }}
    >
      {/* Pop circle — breathes left/right */}
      <div
        className="absolute bg-pop rounded-full animate-logo-breathe-left"
        style={{
          width: s.circleSize,
          height: s.circleSize,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
      {/* White circle — breathes right/left */}
      <div
        className="absolute bg-white rounded-full opacity-85 animate-logo-breathe-right"
        style={{
          width: s.circleSize,
          height: s.circleSize,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
}

/** Inline loading indicator — animated logo with optional text */
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
        <p className="font-mono text-xs text-ink-50 animate-pulse">{text}</p>
      )}
    </div>
  );
}
