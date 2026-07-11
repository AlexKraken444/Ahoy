import { NextResponse } from "next/server";
import { getPost, savePost, uid, userFromRequest } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await userFromRequest(req);
  if (!me) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;
  const post = await getPost(id);
  if (!post) {
    return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const text = String(body?.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Пустой комментарий" }, { status: 400 });
  }

  const updated = {
    ...post,
    comments: [
      ...post.comments,
      { id: uid(), userId: me.id, text: text.slice(0, 200), createdAt: Date.now() },
    ],
  };
  await savePost(updated);
  return NextResponse.json({ post: updated });
}
