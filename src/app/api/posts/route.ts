import { NextResponse } from "next/server";
import { savePost, uid, userFromRequest } from "@/lib/db";
import type { Post } from "@/lib/types";

export async function POST(req: Request) {
  const me = await userFromRequest(req);
  if (!me) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const text = String(body?.text ?? "").trim();
  const image =
    typeof body?.image === "string" && body.image.startsWith("data:image/")
      ? body.image
      : null;

  if (!text && !image) {
    return NextResponse.json({ error: "Пустой пост" }, { status: 400 });
  }
  if (text.length > 280) {
    return NextResponse.json(
      { error: "Максимум 280 символов" },
      { status: 400 }
    );
  }

  const post: Post = {
    id: uid(),
    userId: me.id,
    text,
    image,
    likes: [],
    comments: [],
    createdAt: Date.now(),
  };
  await savePost(post, { prepend: true });
  return NextResponse.json({ post });
}
