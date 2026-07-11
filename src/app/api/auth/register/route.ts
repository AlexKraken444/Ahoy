import { NextResponse } from "next/server";
import {
  createSession,
  getAllUsers,
  hashPassword,
  publicUser,
  saveUser,
  transliterate,
  uid,
  type DbUser,
} from "@/lib/db";
import { sanitizeHandle } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const password = String(body?.password ?? "");

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Введите имя (минимум 2 символа)" },
      { status: 400 }
    );
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "Похоже, это не email — проверьте адрес" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Пароль должен быть не короче 6 символов" },
      { status: 400 }
    );
  }

  const users = await getAllUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json(
      { error: "Этот email уже зарегистрирован" },
      { status: 409 }
    );
  }

  let handle = sanitizeHandle(transliterate(name)) || "sailor";
  if (users.some((u) => u.handle === handle)) {
    handle = `${handle}${Math.floor(100 + Math.random() * 900)}`;
  }

  const user: DbUser = {
    id: uid(),
    email,
    password: hashPassword(password),
    name,
    handle,
    avatar: null,
    bio: "",
    joinedAt: Date.now(),
    onboarded: false,
  };
  await saveUser(user);
  const token = await createSession(user.id);

  return NextResponse.json({ token, user: publicUser(user) });
}
