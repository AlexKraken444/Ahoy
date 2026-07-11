"use client";

import { Anchor } from "lucide-react";
import { motion } from "framer-motion";

export default function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const iconBox = size === "lg" ? "h-14 w-14 rounded-2xl" : "h-9 w-9 rounded-xl";
  const icon = size === "lg" ? 30 : 20;
  const text = size === "lg" ? "text-4xl" : "text-xl";

  return (
    <div className="flex items-center gap-3 select-none">
      <motion.div
        whileHover={{ rotate: -12, scale: 1.06 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className={`flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-900/50 ${iconBox}`}
      >
        <Anchor size={icon} strokeWidth={2.4} />
      </motion.div>
      <span className={`font-display font-black tracking-tight text-white ${text}`}>
        Ahoy
      </span>
    </div>
  );
}
