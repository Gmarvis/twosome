import { motion } from "framer-motion";
import type { StoryAnalysis } from "@/lib/gemini";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

// ---------------------------------------------------------------------------
// RevealCard
// ---------------------------------------------------------------------------

interface RevealCardProps {
  analysis: StoryAnalysis;
  playerNames: [string, string];
}

export function RevealCard({ analysis, playerNames }: RevealCardProps) {
  // Final safety net: replace any remaining generic "Player 1/2" in all text
  const clean = (text: string) => {
    return text
      .replace(/\bPlayer\s*(?:1|one)(?:'s|\u2019s)?\b/gi, (m) =>
        m.toLowerCase().endsWith("'s") || m.endsWith("\u2019s") ? `${playerNames[0]}'s` : playerNames[0],
      )
      .replace(/\bPlayer\s*(?:2|two)(?:'s|\u2019s)?\b/gi, (m) =>
        m.toLowerCase().endsWith("'s") || m.endsWith("\u2019s") ? `${playerNames[1]}'s` : playerNames[1],
      );
  };

  const { headline, player1, player2, dynamic, surprises } = analysis;

  return (
    <motion.div
      className="flex flex-col gap-3"
      initial="hidden"
      animate="visible"
    >
      {/* Headline */}
      <motion.div custom={0} variants={fadeUp} className="text-center py-2">
        <span className="text-xs font-mono uppercase tracking-widest text-ink-50">
          🔮 the reveal
        </span>
        <h2
          className="font-display text-xl font-black leading-snug mt-1"
          style={{ color: "#F43F5E" }}
        >
          "{clean(headline)}"
        </h2>
      </motion.div>

      {/* Player 1 card */}
      <motion.div custom={1} variants={fadeUp}>
        <PlayerCard profile={player1} displayName={playerNames[0]} borderColor="#F43F5E" cleanText={clean} />
      </motion.div>

      {/* Player 2 card */}
      <motion.div custom={2} variants={fadeUp}>
        <PlayerCard profile={player2} displayName={playerNames[1]} borderColor="#1A1A1A" cleanText={clean} />
      </motion.div>

      {/* Sync score */}
      <motion.div
        custom={3}
        variants={fadeUp}
        className="bg-white border-[1.5px] border-ink-20 rounded-xl p-4"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-50 mb-2">
          sync score
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-2.5 bg-ink-20 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "#F43F5E" }}
              initial={{ width: 0 }}
              animate={{ width: `${dynamic.syncScore * 10}%` }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <span className="font-display font-black text-lg" style={{ color: "#F43F5E" }}>
            {dynamic.syncScore}/10
          </span>
        </div>

        <p
          className="font-mono text-xs font-bold mb-2"
          style={{ color: "#F43F5E" }}
        >
          "{clean(dynamic.syncLabel)}"
        </p>

        <p
          className="text-sm leading-relaxed"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            color: "#3D3A37",
          }}
        >
          {clean(dynamic.summary)}
        </p>

        <p
          className="text-sm leading-relaxed mt-2 text-ink-50"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          {clean(dynamic.connectionInsight)}
        </p>
      </motion.div>

      {/* Surprises */}
      {surprises.length > 0 && (
        <motion.div
          custom={4}
          variants={fadeUp}
          className="bg-white border-[1.5px] border-ink-20 rounded-xl p-4"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-50 mb-2.5">
            💡 surprises
          </p>
          <ul className="flex flex-col gap-2.5">
            {surprises.map((s, i) => (
              <li
                key={i}
                className="text-sm leading-relaxed text-ink-50"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                }}
              >
                {clean(s)}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// PlayerCard (internal)
// ---------------------------------------------------------------------------

function PlayerCard({
  profile,
  displayName,
  borderColor,
  cleanText,
}: {
  profile: StoryAnalysis["player1"];
  displayName: string;
  borderColor: string;
  cleanText: (text: string) => string;
}) {
  return (
    <div
      className="bg-white border-[1.5px] border-ink-20 rounded-xl p-4"
    >
      {/* Name + role */}
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-50 mb-0.5">
        {displayName}
      </p>
      <p
        className="font-display font-bold text-sm mb-2"
        style={{ color: borderColor }}
      >
        {cleanText(profile.role)}
      </p>

      {/* Personality read */}
      <p
        className="text-sm leading-relaxed mb-3"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#3D3A37",
        }}
      >
        {cleanText(profile.read)}
      </p>

      {/* Patterns */}
      <ul className="flex flex-col gap-1 mb-3">
        {profile.patterns.map((p, i) => (
          <li
            key={i}
            className="font-mono text-[11px] text-ink-50 flex items-start gap-1.5"
          >
            <span className="text-ink-20 mt-px">•</span>
            {cleanText(p)}
          </li>
        ))}
      </ul>

      {/* Signature move */}
      <div
        className="font-mono text-[11px] px-2.5 py-1.5 rounded-lg"
        style={{
          background: borderColor === "#F43F5E" ? "#FFF1F2" : "#F5F5F4",
          color: borderColor,
        }}
      >
        ✦ {cleanText(profile.signatureMove)}
      </div>
    </div>
  );
}
