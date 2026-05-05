import { type NextRequest, NextResponse } from "next/server";
import { problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { deleteStop } from "~/server/services/itineraries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ stopId: string }> }) {
  try {
    const user = await requireUser();
    const { stopId } = await ctx.params;
    await deleteStop({ stopId, userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return problem(err);
  }
}
