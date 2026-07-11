import { NextResponse } from "next/server";
import { getPost, savePost, userFromRequest } from "@/lib/db";

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

  const liked = post.likes.includes(me.id);
  const updated = {
    ...post,
    likes: liked
      ? post.likes.filter((l) => l !== me.id)
      : [...post.likes, me.id],
  };
  await savePost(updated);
  return NextResponse.json({ post: updated });
}
