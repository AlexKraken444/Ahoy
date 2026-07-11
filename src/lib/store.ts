"use client";

export type User = {
  id: string;
  email: string;
  password: string; // sha-256 hex
  name: string;
  handle: string;
  avatar: string | null; // data URL
  bio: string;
  joinedAt: number;
  onboarded: boolean;
};

export type Comment = {
  id: string;
  userId: string;
  text: string;
  createdAt: number;
};

export type Post = {
  id: string;
  userId: string;
  text: string;
  image: string | null; // data URL
  likes: string[]; // user ids
  comments: Comment[];
  createdAt: number;
  editedAt?: number;
};

const USERS_KEY = "ahoy:users";
const SESSION_KEY = "ahoy:session";
const POSTS_KEY = "ahoy:posts";
const SEED_KEY = "ahoy:seeded";

const CAPTAIN_ID = "captain-ahoy";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ------------------------------ users ------------------------------ */

export function getUsers(): User[] {
  seed();
  return read<User[]>(USERS_KEY, []);
}

export function getUser(id: string): User | null {
  return getUsers().find((u) => u.id === id) ?? null;
}

export function updateUser(user: User) {
  write(
    USERS_KEY,
    getUsers().map((u) => (u.id === user.id ? user : u))
  );
}

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
};

export function sanitizeHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

export function makeHandle(name: string): string {
  const base = sanitizeHandle(
    name
      .toLowerCase()
      .split("")
      .map((ch) => TRANSLIT[ch] ?? ch)
      .join("")
  );
  const handle = base || "sailor";
  const taken = read<User[]>(USERS_KEY, []).some((u) => u.handle === handle);
  return taken ? `${handle}${Math.floor(100 + Math.random() * 900)}` : handle;
}

export function getUserByHandle(handle: string): User | null {
  const clean = handle.toLowerCase();
  return getUsers().find((u) => u.handle === clean) ?? null;
}

/** Handles that get the blue check. Add yours here. */
const VERIFIED_HANDLES = ["kuraken", "captain"];

export function isVerified(user: User | null): boolean {
  return !!user && VERIFIED_HANDLES.includes(user.handle);
}

type AuthResult = { ok: true; user: User } | { ok: false; error: string };

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "Этот email уже зарегистрирован" };
  }
  const user: User = {
    id: uid(),
    email: email.trim(),
    password: await sha256(password),
    name: name.trim(),
    handle: makeHandle(name),
    avatar: null,
    bio: "",
    joinedAt: Date.now(),
    onboarded: false,
  };
  users.push(user);
  write(USERS_KEY, users);
  write(SESSION_KEY, user.id);
  return { ok: true, user };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const user = getUsers().find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (!user) return { ok: false, error: "Аккаунт с таким email не найден" };
  if (user.password !== (await sha256(password))) {
    return { ok: false, error: "Неверный пароль" };
  }
  write(SESSION_KEY, user.id);
  return { ok: true, user };
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function currentUser(): User | null {
  const id = read<string | null>(SESSION_KEY, null);
  return id ? getUser(id) : null;
}

/* ------------------------------ posts ------------------------------ */

/** Reads posts and backfills fields added after early versions. */
function readPosts(): Post[] {
  return read<Post[]>(POSTS_KEY, []).map((p) => ({
    ...p,
    likes: p.likes ?? [],
    comments: p.comments ?? [],
  }));
}

export function getPosts(): Post[] {
  seed();
  return readPosts().sort((a, b) => b.createdAt - a.createdAt);
}

export function addPost(userId: string, text: string, image: string | null): Post {
  const post: Post = {
    id: uid(),
    userId,
    text: text.trim(),
    image,
    likes: [],
    comments: [],
    createdAt: Date.now(),
  };
  write(POSTS_KEY, [post, ...readPosts()]);
  return post;
}

export function updatePost(id: string, text: string, image: string | null) {
  write(
    POSTS_KEY,
    readPosts().map((p) =>
      p.id === id
        ? { ...p, text: text.trim(), image, editedAt: Date.now() }
        : p
    )
  );
}

export function deletePost(id: string) {
  write(
    POSTS_KEY,
    readPosts().filter((p) => p.id !== id)
  );
}

export function toggleLike(postId: string, userId: string) {
  write(
    POSTS_KEY,
    readPosts().map((p) => {
      if (p.id !== postId) return p;
      const liked = p.likes.includes(userId);
      return {
        ...p,
        likes: liked ? p.likes.filter((l) => l !== userId) : [...p.likes, userId],
      };
    })
  );
}

export function addComment(postId: string, userId: string, text: string) {
  write(
    POSTS_KEY,
    readPosts().map((p) =>
      p.id === postId
        ? {
            ...p,
            comments: [
              ...p.comments,
              { id: uid(), userId, text: text.trim(), createdAt: Date.now() },
            ],
          }
        : p
    )
  );
}

export function deleteComment(postId: string, commentId: string) {
  write(
    POSTS_KEY,
    readPosts().map((p) =>
      p.id === postId
        ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
        : p
    )
  );
}

/* ------------------------------ seed ------------------------------ */

function seed() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;
  localStorage.setItem(SEED_KEY, "1");

  const users = read<User[]>(USERS_KEY, []);
  if (!users.some((u) => u.id === CAPTAIN_ID)) {
    users.push({
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
    write(USERS_KEY, users);
  }

  const posts = read<Post[]>(POSTS_KEY, []);
  if (posts.length === 0) {
    write(POSTS_KEY, [
      {
        id: uid(),
        userId: CAPTAIN_ID,
        text: "Совет дня: лучший способ начать утро — крепкий кофе и чистая лента. Публикуйте, ставьте якоря на понравившееся и держите курс. 🌊",
        image: null,
        likes: [],
        comments: [],
        createdAt: Date.now() - 1000 * 60 * 60 * 5,
      },
      {
        id: uid(),
        userId: CAPTAIN_ID,
        text: "Добро пожаловать на борт Ahoy! ⚓\n\nЗдесь делятся мыслями, находками и ловят попутный ветер. Напишите свой первый пост — море ждёт!",
        image: null,
        likes: [],
        comments: [],
        createdAt: Date.now() - 1000 * 60 * 60 * 26,
      },
    ] satisfies Post[]);
  }
}
