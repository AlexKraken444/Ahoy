/** Shared types between client and server. */

export type User = {
  id: string;
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

/** Handles that get the blue check. Add yours here. */
export const VERIFIED_HANDLES = ["kuraken", "captain"];

export function isVerified(user: Pick<User, "handle"> | null): boolean {
  return !!user && VERIFIED_HANDLES.includes(user.handle);
}

export function sanitizeHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}
