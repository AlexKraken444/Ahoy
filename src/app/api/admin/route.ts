import { NextResponse } from "next/server";
import { getAllUsers, purgeUser } from "@/lib/db";
import { sanitizeHandle } from "@/lib/types";

const CAPTAIN_ID = "captain-ahoy";

/**
 * Админ-действия владельца сайта. Работает только если в переменных
 * окружения задан ADMIN_SECRET и он совпадает с переданным в запросе.
 */
export async function POST(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  const body = await req.json().catch(() => null);

  if (
    !secret ||
    typeof body?.secret !== "string" ||
    body.secret.length === 0 ||
    body.secret !== secret
  ) {
    // не раскрываем существование эндпоинта без валидного секрета
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.action === "delete-user") {
    const handle = sanitizeHandle(String(body.handle ?? ""));
    if (!handle) {
      return NextResponse.json({ error: "Укажите handle" }, { status: 400 });
    }
    const users = await getAllUsers();
    const target = users.find((u) => u.handle === handle);
    if (!target) {
      return NextResponse.json(
        { error: `Пользователь @${handle} не найден` },
        { status: 404 }
      );
    }
    if (target.id === CAPTAIN_ID) {
      return NextResponse.json(
        { error: "Капитана нельзя выбросить за борт" },
        { status: 403 }
      );
    }
    const stats = await purgeUser(target.id);
    return NextResponse.json({ ok: true, deleted: `@${handle}`, ...stats });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
