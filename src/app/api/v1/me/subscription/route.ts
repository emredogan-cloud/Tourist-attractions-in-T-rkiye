import { NextResponse } from "next/server";
import { noStore, problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { cancelMine, getCurrentSubscription } from "~/server/services/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const sub = await getCurrentSubscription(user.id);
    return noStore({ subscription: sub });
  } catch (err) {
    return problem(err);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    const sub = await cancelMine(user.id);
    return NextResponse.json({ subscription: sub }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err);
  }
}
