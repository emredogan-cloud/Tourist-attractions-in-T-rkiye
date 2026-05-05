import { type NextRequest, NextResponse } from "next/server";
import { problem } from "~/lib/api-response";
import { applySetCookie, getAuthProvider } from "~/server/providers/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const provider = getAuthProvider();
    const token = request.cookies.get(provider.cookieName())?.value ?? null;
    const { clearCookie } = await provider.signOut(token);
    const headers = new Headers({ "Cache-Control": "no-store" });
    applySetCookie(headers, clearCookie);
    return NextResponse.json({ ok: true }, { headers });
  } catch (err) {
    return problem(err, request.url);
  }
}
