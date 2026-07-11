import { NextResponse } from "next/server";
import { publicUser, userFromRequest } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const me = await userFromRequest(req);
  if (!me) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  return NextResponse.json({ user: publicUser(me) });
}
