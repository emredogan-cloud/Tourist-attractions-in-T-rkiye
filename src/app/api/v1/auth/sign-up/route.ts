import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBodyWith } from "~/lib/api-helpers";
import { problem } from "~/lib/api-response";
import { isLocale } from "~/lib/i18n/config";
import { clientIp, enforce } from "~/lib/rate-limit";
import { applySetCookie, getAuthProvider } from "~/server/providers/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(80).optional(),
  locale: z.string().refine(isLocale).default("tr"),
  consentAccepted: z.literal(true),
  consentVersion: z.string().min(1),
  marketingOptIn: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await enforce({ key: `signup:${clientIp(request)}`, limit: 8, windowSec: 3600 });
    const body = await parseJsonBodyWith(request, Body);
    const provider = getAuthProvider();
    const { session, setCookie } = await provider.signUp({
      email: body.email,
      password: body.password,
      ...(body.displayName ? { displayName: body.displayName } : {}),
      locale: body.locale,
      consentVersion: body.consentVersion,
      consentIp: clientIp(request),
      consentUserAgent: request.headers.get("user-agent") ?? undefined,
      ...(body.marketingOptIn !== undefined ? { marketingOptIn: body.marketingOptIn } : {}),
    });
    const headers = new Headers({ "Cache-Control": "no-store" });
    applySetCookie(headers, setCookie);
    return NextResponse.json(
      { user: session.user, expiresAt: session.expiresAt },
      { headers, status: 201 },
    );
  } catch (err) {
    return problem(err, request.url);
  }
}
