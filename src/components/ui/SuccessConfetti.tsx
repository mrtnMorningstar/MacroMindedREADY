"use client";

import { motion } from "framer-motion";

export default function SuccessConfetti() {
  const dots = Array.from({ length: 25 });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: [1, 1, 0],
            y: [0, 150 + Math.random() * 200],
            x: [0, (-1 + Math.random() * 2) * 120],
            rotate: [0, 180 * (Math.random() > 0.5 ? 1 : -1)],
          }}
          transition={{
            duration: 1.3 + Math.random() * 0.8,
            ease: "easeOut",
          }}
          className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-[#D7263D]"
        />
      ))}
    </div>
  );
}

