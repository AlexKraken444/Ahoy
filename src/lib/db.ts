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
  posts: Map<string, Post>;
  sessions: Map<string, string>;
  seeded: boolean;
};

const g = globalThis as unknown as { __ahoyMem?: Mem };
const mem: Mem = (g.__ahoyMem ??= {
  users: new Map(),
  posts: new Map(),
  sessions: new Map(),
  seeded: false,
});

/* Atomic set/zset indexes. The old JSON-array indexes (v1) are migrated
   lazily so existing deployments keep their data. */
const USER_SET = "ahoy:users:set";
const USER_INDEX_V1 = "ahoy:users:index";
const POSTS_Z = "ahoy:posts:z";
const POST_INDEX_V1 = "ahoy:posts:index";
const SESSIONS = "ahoy:sessions";
const SEEDED = "ahoy:seeded";

const userKey = (id: string) => `ahoy:user:${id}`;
const postKey = (id: string) => `ahoy:post:${id}`;

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

function normalizePost(p: Post): Post {
  return { ...p, likes: p.likes ?? [], comments: p.comments ?? [] };
}

/* ------------------------------ users ------------------------------ */

async function userIdsRedis(r: Redis): Promise<string[]> {
  const ids = await r.smembers(USER_SET);
  if (ids.length > 0) return ids as string[];
  // migrate v1 JSON-array index
  const old = (await r.get<string[]>(USER_INDEX_V1)) ?? [];
  if (old.length > 0) {
    await r.sadd(USER_SET, old[0], ...old.slice(1));
    return old;
  }
  return [];
}

export async function getAllUsers(): Promise<DbUser[]> {
  await ensureSeed();
  if (redis) {
    const ids = await userIdsRedis(redis);
    if (ids.length === 0) return [];
    const rows = (await redis.mget(...ids.map(userKey))) as (DbUser | null)[];
    return rows.filter((u): u is DbUser => u !== null);
  }
  return [...mem.users.values()];
}

/** Direct key lookup — auth never depends on index integrity. */
export async function getUserById(id: string): Promise<DbUser | null> {
  await ensureSeed();
  if (redis) return await redis.get<DbUser>(userKey(id));
  return mem.users.get(id) ?? null;
}

export async function saveUser(user: DbUser): Promise<void> {
  if (redis) {
    await Promise.all([
      redis.sadd(USER_SET, user.id),
      redis.set(userKey(user.id), user),
    ]);
    return;
  }
  mem.users.set(user.id, user);
}

/* ------------------------------ posts ------------------------------ */

async function postIdsRedis(r: Redis): Promise<string[]> {
  // newest first
  const ids = await r.zrange(POSTS_Z, 0, -1, { rev: true });
  if (ids.length > 0) return ids as string[];
  // migrate v1 JSON-array index (needs createdAt scores from the posts)
  const old = (await r.get<string[]>(POST_INDEX_V1)) ?? [];
  if (old.length === 0) return [];
  const rows = (await r.mget(...old.map(postKey))) as (Post | null)[];
  const found = rows.filter((p): p is Post => p !== null);
  if (found.length > 0) {
    const members = found.map((p) => ({ score: p.createdAt, member: p.id }));
    await r.zadd(POSTS_Z, members[0], ...members.slice(1));
  }
  return found
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((p) => p.id);
}

export async function getAllPosts(): Promise<Post[]> {
  await ensureSeed();
  if (redis) {
    const ids = await postIdsRedis(redis);
    if (ids.length === 0) return [];
    const rows = (await redis.mget(...ids.map(postKey))) as (Post | null)[];
    return rows.filter((p): p is Post => p !== null).map(normalizePost);
  }
  return [...mem.posts.values()];
}

export async function getPost(id: string): Promise<Post | null> {
  if (redis) {
    const p = await redis.get<Post>(postKey(id));
    return p ? normalizePost(p) : null;
  }
  return mem.posts.get(id) ?? null;
}

export async function savePost(post: Post): Promise<void> {
  if (redis) {
    await Promise.all([
      redis.zadd(POSTS_Z, { score: post.createdAt, member: post.id }),
      redis.set(postKey(post.id), post),
    ]);
    return;
  }
  mem.posts.set(post.id, post);
}

export async function deletePostDb(id: string): Promise<void> {
  if (redis) {
    await Promise.all([redis.zrem(POSTS_Z, id), redis.del(postKey(id))]);
    return;
  }
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
  return getUserById(userId);
}

/** Полное удаление пользователя: аккаунт, его посты, лайки,
    комментарии на чужих постах и все сессии. */
export async function purgeUser(userId: string): Promise<{
  posts: number;
  likes: number;
  comments: number;
  sessions: number;
}> {
  const posts = await getAllPosts();
  let removedPosts = 0;
  let strippedLikes = 0;
  let strippedComments = 0;

  for (const p of posts) {
    if (p.userId === userId) {
      await deletePostDb(p.id);
      removedPosts++;
      continue;
    }
    const likes = p.likes.filter((l) => l !== userId);
    const comments = p.comments.filter((c) => c.userId !== userId);
    if (likes.length !== p.likes.length || comments.length !== p.comments.length) {
      strippedLikes += p.likes.length - likes.length;
      strippedComments += p.comments.length - comments.length;
      await savePost({ ...p, likes, comments });
    }
  }

  let sessions = 0;
  if (redis) {
    const all =
      (await redis.hgetall<Record<string, string>>(SESSIONS)) ?? {};
    const tokens = Object.entries(all)
      .filter(([, uid]) => uid === userId)
      .map(([token]) => token);
    if (tokens.length > 0) {
      await redis.hdel(SESSIONS, ...tokens);
      sessions = tokens.length;
    }
  } else {
    for (const [token, uid] of [...mem.sessions]) {
      if (uid === userId) {
        mem.sessions.delete(token);
        sessions++;
      }
    }
  }

  if (redis) {
    await Promise.all([redis.srem(USER_SET, userId), redis.del(userKey(userId))]);
  } else {
    mem.users.delete(userId);
  }

  return { posts: removedPosts, likes: strippedLikes, comments: strippedComments, sessions };
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
    // SET NX — только один инстанс выполнит сидинг
    const first = await redis.set(SEEDED, 1, { nx: true });
    if (first === null) return;
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

  await savePost({
    id: uid(),
    userId: CAPTAIN_ID,
    text: "Добро пожаловать на борт Ahoy! ⚓\n\nЗдесь делятся мыслями, находками и ловят попутный ветер. Напишите свой первый пост — море ждёт!",
    image: null,
    likes: [],
    comments: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
  });
  await savePost({
    id: uid(),
    userId: CAPTAIN_ID,
    text: "Совет дня: лучший способ начать утро — крепкий кофе и чистая лента. Публикуйте, ставьте якоря на понравившееся и держите курс. 🌊",
    image: null,
    likes: [],
    comments: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
  });
}
