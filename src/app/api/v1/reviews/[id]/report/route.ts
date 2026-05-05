import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBodyWith } from "~/lib/api-helpers";
import { problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { reactToReview } from "~/server/services/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ reason: z.string().min(1).max(500) });

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await parseJsonBodyWith(request, Body);
    await reactToReview({ reviewId: id, userId: user.id, type: "REPORT", reason: body.reason });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err, request.url);
  }
}
