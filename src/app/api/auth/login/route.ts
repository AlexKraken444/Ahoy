import { NextResponse } from "next/server";
import {
  createSession,
  getAllUsers,
  hashPassword,
  publicUser,
} from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  const password = String(body?.password ?? "");

  const users = await getAllUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (!user) {
    return NextResponse.json(
      { error: "Аккаунт с таким email не найден" },
      { status: 404 }
    );
  }
  if (user.password !== hashPassword(password)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const token = await createSession(user.id);
  return NextResponse.json({ token, user: publicUser(user) });
}
