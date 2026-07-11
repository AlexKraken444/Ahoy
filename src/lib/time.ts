export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "только что";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} дн`;
  return new Date(ts).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

export function daysAboard(joinedAt: number): number {
  return Math.max(1, Math.ceil((Date.now() - joinedAt) / (1000 * 60 * 60 * 24)));
}
