import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBodyWith } from "~/lib/api-helpers";
import { problem } from "~/lib/api-response";
import { applySetCookie, getAuthProvider } from "~/server/providers/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBodyWith(request, Body);
    const provider = getAuthProvider();
    const { session, setCookie } = await provider.signIn(body);
    const headers = new Headers({ "Cache-Control": "no-store" });
    applySetCookie(headers, setCookie);
    return NextResponse.json({ user: session.user, expiresAt: session.expiresAt }, { headers });
  } catch (err) {
    return problem(err, request.url);
  }
}
