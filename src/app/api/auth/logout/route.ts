import { NextResponse } from "next/server";
import { destroySession } from "@/lib/db";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) await destroySession(token);
  return NextResponse.json({ ok: true });
}
