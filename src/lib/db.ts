import "server-only";
import { createHash, randomUUID } from "crypto";
import { Redis } from "@upstash/redis";
import type { Post, User } from "./types";

/** Server-side user record (never sent to the client as-is). */
export type DbUser = User & {
  email: string;
  password: string; // salted sha-256 hex
};

const SALT = "ahoy-static-salt-v1";

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redis =
  redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

/** True when a persistent store (Upstash Redis) is configured. */
export const hasPersistentStore = redis !== null;

/* In-memory fallback for local development. On serverless this resets
   between invocations — connect Upstash Redis for real persistence. */
type Mem = {
  users: Map<string, DbUser>;
  userIndex: string[];
  posts: Map<string, Post>;
  postIndex: string[]; // newest first
  sessions: Map<string, string>;
  seeded: boolean;
};

const g = globalThis as unknown as { __ahoyMem?: Mem };
const mem: Mem = (g.__ahoyMem ??= {
  users: new Map(),
  userIndex: [],
  posts: new Map(),
  postIndex: [],
  sessions: new Map(),
  seeded: false,
});

const USER_INDEX = "ahoy:users:index";
const POST_INDEX = "ahoy:posts:index";
const SESSIONS = "ahoy:sessions";
const SEEDED = "ahoy:seeded";

export const uid = () => randomUUID();

export function hashPassword(password: string): string {
  return createHash("sha256").update(SALT + password).digest("hex");
}

export function publicUser(u: DbUser): User {
  return {
    id: u.id,
    name: u.name,
    handle: u.handle,
    avatar: u.avatar,
    bio: u.bio,
    joinedAt: u.joinedAt,
    onboarded: u.onboarded,
  };
}

/* ------------------------------ users ------------------------------ */

export async function getAllUsers(): Promise<DbUser[]> {
  await ensureSeed();
  if (redis) {
    const ids = (await redis.get<string[]>(USER_INDEX)) ?? [];
    if (ids.length === 0) return [];
    const rows = (await redis.mget(...ids.map((id) => `ahoy:user:${id}`))) as
      (DbUser | null)[];
    return rows.filter((u): u is DbUser => u !== null);
  }
  return mem.userIndex
    .map((id) => mem.users.get(id))
    .filter((u): u is DbUser => !!u);
}

export async function saveUser(user: DbUser): Promise<void> {
  if (redis) {
    const ids = (await redis.get<string[]>(USER_INDEX)) ?? [];
    if (!ids.includes(user.id)) {
      await redis.set(USER_INDEX, [...ids, user.id]);
    }
    await redis.set(`ahoy:user:${user.id}`, user);
    return;
  }
  if (!mem.userIndex.includes(user.id)) mem.userIndex.push(user.id);
  mem.users.set(user.id, user);
}

/* ------------------------------ posts ------------------------------ */

export async function getAllPosts(): Promise<Post[]> {
  await ensureSeed();
  if (redis) {
    const ids = (await redis.get<string[]>(POST_INDEX)) ?? [];
    if (ids.length === 0) return [];
    const rows = (await redis.mget(...ids.map((id) => `ahoy:post:${id}`))) as
      (Post | null)[];
    return rows
      .filter((p): p is Post => p !== null)
      .map((p) => ({ ...p, likes: p.likes ?? [], comments: p.comments ?? [] }));
  }
  return mem.postIndex
    .map((id) => mem.posts.get(id))
    .filter((p): p is Post => !!p);
}

export async function getPost(id: string): Promise<Post | null> {
  if (redis) {
    const p = await redis.get<Post>(`ahoy:post:${id}`);
    return p ? { ...p, likes: p.likes ?? [], comments: p.comments ?? [] } : null;
  }
  return mem.posts.get(id) ?? null;
}

export async function savePost(
  post: Post,
  { prepend = false }: { prepend?: boolean } = {}
): Promise<void> {
  if (redis) {
    if (prepend) {
      const ids = (await redis.get<string[]>(POST_INDEX)) ?? [];
      await redis.set(POST_INDEX, [post.id, ...ids.filter((i) => i !== post.id)]);
    }
    await redis.set(`ahoy:post:${post.id}`, post);
    return;
  }
  if (prepend) {
    mem.postIndex = [post.id, ...mem.postIndex.filter((i) => i !== post.id)];
  }
  mem.posts.set(post.id, post);
}

export async function deletePostDb(id: string): Promise<void> {
  if (redis) {
    const ids = (await redis.get<string[]>(POST_INDEX)) ?? [];
    await redis.set(POST_INDEX, ids.filter((i) => i !== id));
    await redis.del(`ahoy:post:${id}`);
    return;
  }
  mem.postIndex = mem.postIndex.filter((i) => i !== id);
  mem.posts.delete(id);
}

/* ------------------------------ sessions ------------------------------ */

export async function createSession(userId: string): Promise<string> {
  const token = randomUUID();
  if (redis) await redis.hset(SESSIONS, { [token]: userId });
  else mem.sessions.set(token, userId);
  return token;
}

export async function destroySession(token: string): Promise<void> {
  if (redis) await redis.hdel(SESSIONS, token);
  else mem.sessions.delete(token);
}

export async function userFromRequest(req: Request): Promise<DbUser | null> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  let userId: string | null;
  if (redis) userId = await redis.hget<string>(SESSIONS, token);
  else userId = mem.sessions.get(token) ?? null;
  if (!userId) return null;
  const users = await getAllUsers();
  return users.find((u) => u.id === userId) ?? null;
}

/* ------------------------------ handles ------------------------------ */

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
};

export function transliterate(name: string): string {
  return name
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("");
}

/* ------------------------------ seed ------------------------------ */

const CAPTAIN_ID = "captain-ahoy";

async function ensureSeed(): Promise<void> {
  if (redis) {
    const done = await redis.get(SEEDED);
    if (done) return;
    await redis.set(SEEDED, 1);
  } else {
    if (mem.seeded) return;
    mem.seeded = true;
  }

  await saveUser({
    id: CAPTAIN_ID,
    email: "captain@ahoy.app",
    password: "!", // never matches a sha-256 hash — login impossible
    name: "Капитан Ahoy",
    handle: "captain",
    avatar: null,
    bio: "Штурвал этого корабля. Слежу за попутным ветром.",
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    onboarded: true,
  });

  await savePost(
    {
      id: uid(),
      userId: CAPTAIN_ID,
      text: "Добро пожаловать на борт Ahoy! ⚓\n\nЗдесь делятся мыслями, находками и ловят попутный ветер. Напишите свой первый пост — море ждёт!",
      image: null,
      likes: [],
      comments: [],
      createdAt: Date.now() - 1000 * 60 * 60 * 26,
    },
    { prepend: true }
  );
  await savePost(
    {
      id: uid(),
      userId: CAPTAIN_ID,
      text: "Совет дня: лучший способ начать утро — крепкий кофе и чистая лента. Публикуйте, ставьте якоря на понравившееся и держите курс. 🌊",
      image: null,
      likes: [],
      comments: [],
      createdAt: Date.now() - 1000 * 60 * 60 * 5,
    },
    { prepend: true }
  );
}
