import { NextResponse } from "next/server";
import { getPost, savePost, userFromRequest } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const me = await userFromRequest(req);
  if (!me) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id, commentId } = await params;
  const post = await getPost(id);
  if (!post) {
    return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
  }

  const comment = post.comments.find((c) => c.id === commentId);
  if (!comment) {
    return NextResponse.json({ error: "Комментарий не найден" }, { status: 404 });
  }
  if (comment.userId !== me.id) {
    return NextResponse.json({ error: "Это не ваш комментарий" }, { status: 403 });
  }

  const updated = {
    ...post,
    comments: post.comments.filter((c) => c.id !== commentId),
  };
  await savePost(updated);
  return NextResponse.json({ post: updated });
}
