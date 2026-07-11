import { NextResponse } from "next/server";
import { getAllUsers, publicUser, saveUser, userFromRequest } from "@/lib/db";
import { sanitizeHandle } from "@/lib/types";

export async function PATCH(req: Request) {
  const me = await userFromRequest(req);
  if (!me) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Пустой запрос" }, { status: 400 });
  }

  const updated = { ...me };

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2) {
      return NextResponse.json(
        { error: "Имя должно быть не короче 2 символов" },
        { status: 400 }
      );
    }
    updated.name = name.slice(0, 40);
  }

  if (typeof body.handle === "string") {
    const handle = sanitizeHandle(body.handle);
    if (handle.length < 3) {
      return NextResponse.json(
        { error: "Ник должен быть не короче 3 символов (латиница, цифры, _)" },
        { status: 400 }
      );
    }
    const users = await getAllUsers();
    if (users.some((u) => u.id !== me.id && u.handle === handle)) {
      return NextResponse.json(
        { error: "Этот ник уже занят другим членом экипажа" },
        { status: 409 }
      );
    }
    updated.handle = handle;
  }

  if (typeof body.bio === "string") {
    updated.bio = body.bio.trim().slice(0, 160);
  }

  if (body.avatar === null || typeof body.avatar === "string") {
    updated.avatar = body.avatar;
  }

  if (body.onboarded === true) {
    updated.onboarded = true;
  }

  await saveUser(updated);
  return NextResponse.json({ user: publicUser(updated) });
}
