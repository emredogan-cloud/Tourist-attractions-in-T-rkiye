import { type NextRequest, NextResponse } from "next/server";
import { problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { addDay } from "~/server/services/itineraries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const day = await addDay({ itineraryId: id, userId: user.id });
    return NextResponse.json({ day }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err);
  }
}
