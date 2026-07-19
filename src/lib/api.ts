"use client";

import type { Post, User } from "./types";

const TOKEN_KEY = "ahoy:token";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function call<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error ?? "Что-то пошло не так, попробуйте ещё раз",
      res.status
    );
  }
  return data as T;
}

/* ------------------------------ auth ------------------------------ */

export async function register(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const { token, user } = await call<{ token: string; user: User }>(
    "/auth/register",
    { method: "POST", body: { name, email, password } }
  );
  setToken(token);
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  const { token, user } = await call<{ token: string; user: User }>(
    "/auth/login",
    { method: "POST", body: { email, password } }
  );
  setToken(token);
  return user;
}

export async function logout(): Promise<void> {
  try {
    await call("/auth/logout", { method: "POST" });
  } catch {
    /* token may already be dead — clearing locally is enough */
  }
  clearToken();
}

export function hasToken(): boolean {
  return getToken() !== null;
}

/**
 * Returns the current user, or null when the session is truly invalid (401).
 * Network/server hiccups are rethrown — the caller must NOT treat them
 * as "logged out".
 */
export async function me(): Promise<User | null> {
  if (!getToken()) return null;
  try {
    const { user } = await call<{ user: User }>("/me");
    return user;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      clearToken();
      return null;
    }
    throw e;
  }
}

/* ------------------------------ data ------------------------------ */

export type FeedResponse = {
  me: User;
  users: User[];
  posts: Post[];
  persistent: boolean;
};

export function feed(): Promise<FeedResponse> {
  return call<FeedResponse>("/feed");
}

export async function updateProfile(fields: {
  name?: string;
  handle?: string;
  bio?: string;
  avatar?: string | null;
  onboarded?: boolean;
}): Promise<User> {
  const { user } = await call<{ user: User }>("/profile", {
    method: "PATCH",
    body: fields,
  });
  return user;
}

export function addPost(text: string, image: string | null): Promise<{ post: Post }> {
  return call("/posts", { method: "POST", body: { text, image } });
}

export function updatePost(
  id: string,
  text: string,
  image: string | null
): Promise<{ post: Post }> {
  return call(`/posts/${id}`, { method: "PATCH", body: { text, image } });
}

export function deletePost(id: string): Promise<{ ok: boolean }> {
  return call(`/posts/${id}`, { method: "DELETE" });
}

export function toggleLike(postId: string): Promise<{ post: Post }> {
  return call(`/posts/${postId}/like`, { method: "POST" });
}

export function addComment(postId: string, text: string): Promise<{ post: Post }> {
  return call(`/posts/${postId}/comments`, { method: "POST", body: { text } });
}

export function deleteComment(
  postId: string,
  commentId: string
): Promise<{ post: Post }> {
  return call(`/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
}
