"use client";

const PALETTES = [
  "from-indigo-500 to-violet-600",
  "from-sky-500 to-indigo-600",
  "from-violet-500 to-fuchsia-600",
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-indigo-600",
];

function paletteFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return PALETTES[h % PALETTES.length];
}

export default function Avatar({
  name,
  avatar,
  size = 44,
  className = "",
}: {
  name: string;
  avatar: string | null;
  size?: number;
  className?: string;
}) {
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ring-1 ring-white/15 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-1 ring-white/15 ${paletteFor(
        name
      )} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {(name.trim()[0] ?? "?").toUpperCase()}
    </div>
  );
}
