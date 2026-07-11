import { NextResponse } from "next/server";
import { deletePostDb, getPost, savePost, userFromRequest } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const me = await userFromRequest(req);
  if (!me) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;
  const post = await getPost(id);
  if (!post) {
    return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
  }
  if (post.userId !== me.id) {
    return NextResponse.json({ error: "Это не ваш пост" }, { status: 403 });
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

  const updated = { ...post, text, image, editedAt: Date.now() };
  await savePost(updated);
  return NextResponse.json({ post: updated });
}

export async function DELETE(req: Request, { params }: Params) {
  const me = await userFromRequest(req);
  if (!me) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;
  const post = await getPost(id);
  if (!post) {
    return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
  }
  if (post.userId !== me.id) {
    return NextResponse.json({ error: "Это не ваш пост" }, { status: 403 });
  }

  await deletePostDb(id);
  return NextResponse.json({ ok: true });
}
