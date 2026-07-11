"use client";

import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({
  size = 15,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      title="Подтверждённый аккаунт"
      className={`inline-flex shrink-0 ${className}`}
    >
      <BadgeCheck
        size={size}
        className="fill-sky-400 text-[#070720]"
        aria-label="Подтверждённый аккаунт"
      />
    </span>
  );
}
