import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const messages = [
  "reading between the lines...",
  "analyzing your choices...",
  "finding the hidden patterns...",
  "almost there...",
];

export function RevealLoading() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      {/* Pulsing orb */}
      <motion.div
        className="w-12 h-12 rounded-full"
        style={{ background: "rgba(244, 63, 94, 0.15)" }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-full h-full flex items-center justify-center text-lg">
          🔮
        </div>
      </motion.div>

      {/* Rotating message */}
      <div className="h-5 relative w-full">
        <AnimatePresence mode="wait">
          <motion.p
            key={messages[index]}
            className="font-mono text-xs text-ink-50 text-center absolute inset-x-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {messages[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
