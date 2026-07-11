import type { Post } from "@/lib/types";

export const TAG_RE = /#[\p{L}\p{N}_]+/gu;

export function extractTags(text: string): string[] {
  return (text.match(TAG_RE) ?? []).map((t) => t.toLowerCase());
}

export type Trend = { tag: string; count: number };

/** Counts hashtags across posts; the display form is the most recent spelling. */
export function computeTrends(posts: Post[]): Trend[] {
  const counts = new Map<string, { display: string; count: number }>();
  for (const post of posts) {
    for (const raw of post.text.match(TAG_RE) ?? []) {
      const key = raw.toLowerCase();
      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { display: raw, count: 1 });
    }
  }
  return [...counts.values()]
    .map(({ display, count }) => ({ tag: display, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ru"));
}

export function pluralRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (d === 1) return forms[0];
  if (d >= 2 && d <= 4) return forms[1];
  return forms[2];
}
