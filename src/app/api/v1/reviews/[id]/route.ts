import { type NextRequest, NextResponse } from "next/server";
import { problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { softDeleteReview } from "~/server/services/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    await softDeleteReview({ reviewId: id, userId: user.id });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err);
  }
}
