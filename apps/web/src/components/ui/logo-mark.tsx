interface LogoMarkProps {
  size?: "sm" | "lg";
  className?: string;
}

const sizes = {
  sm: { box: 28, radius: 7, circleSize: 12, offset1: 4, offset2: 11 },
  lg: { box: 56, radius: 14, circleSize: 24, offset1: 8, offset2: 22 },
};

export function LogoMark({ size = "sm", className = "" }: LogoMarkProps) {
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
      <div
        className="absolute bg-pop rounded-full"
        style={{
          width: s.circleSize,
          height: s.circleSize,
          left: s.offset1,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
      <div
        className="absolute bg-white rounded-full opacity-85"
        style={{
          width: s.circleSize,
          height: s.circleSize,
          left: s.offset2,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
}
