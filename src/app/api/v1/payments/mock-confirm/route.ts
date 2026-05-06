import { type NextRequest, NextResponse } from "next/server";
import { problem } from "~/lib/api-response";
import { activateMockSubscription } from "~/server/services/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const success = url.searchParams.get("success") ?? "/";
    if (!token) return NextResponse.redirect(success, 302);
    await activateMockSubscription({ token });
    return NextResponse.redirect(success, 302);
  } catch (err) {
    return problem(err, request.url);
  }
}
