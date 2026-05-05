import { type NextRequest, NextResponse } from "next/server";
import { problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { optimizeDay } from "~/server/services/itineraries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ dayId: string }> }) {
  try {
    const user = await requireUser();
    const { dayId } = await ctx.params;
    const r = await optimizeDay({ dayId, userId: user.id });
    return NextResponse.json(r);
  } catch (err) {
    return problem(err);
  }
}
