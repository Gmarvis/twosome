import { useNavigate } from "react-router";
import { LogoMark } from "@/components/ui/logo-mark";

const steps = [
  {
    emoji: "👋",
    title: "create a game",
    desc: "pick your settings — word or sentence mode, timer, and turn count.",
  },
  {
    emoji: "🔗",
    title: "share the link",
    desc: "send the link or QR code to the person you want to play with.",
  },
  {
    emoji: "✍️",
    title: "take turns writing",
    desc: "you each add one word (or sentence) at a time to build a story together.",
  },
  {
    emoji: "📖",
    title: "read your story",
    desc: "when the turns run out, see the weird, wonderful thing you created.",
  },
  {
    emoji: "🔮",
    title: "get the reveal",
    desc: "ai analyzes your story and tells you what it says about your dynamic.",
  },
];

export function HowToPlay() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col px-5 pb-5">
      {/* Header */}
      <div className="flex items-center gap-2 py-3">
        <button
          className="font-display font-extrabold text-lg cursor-pointer"
          onClick={() => navigate("/")}
        >
          ←
        </button>
        <LogoMark size="sm" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <h1 className="font-display font-black text-3xl text-ink">
            how to play
          </h1>
          <p className="font-mono text-xs text-ink-50 mt-1">
            it's simple, we promise
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-white rounded-xl p-3.5"
              style={{ border: "1.5px solid rgba(26,26,26,0.08)" }}
            >
              <span className="text-xl mt-0.5">{step.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-ink">
                  {step.title}
                </p>
                <p className="font-mono text-[11px] text-ink-50 leading-relaxed mt-0.5">
                  {step.desc}
                </p>
              </div>
              <span className="font-mono text-[10px] text-ink-20 mt-1">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-pop mt-4" onClick={() => navigate("/")}>
        got it →
      </button>
    </div>
  );
}
