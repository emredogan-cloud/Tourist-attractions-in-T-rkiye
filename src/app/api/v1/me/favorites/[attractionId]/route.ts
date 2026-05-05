import { type NextRequest, NextResponse } from "next/server";
import { problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { addFavorite, isFavorite, removeFavorite } from "~/server/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ attractionId: string }> }) {
  try {
    const user = await requireUser();
    const { attractionId } = await ctx.params;
    const fav = await isFavorite(user.id, attractionId);
    return NextResponse.json({ favorite: fav }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err);
  }
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ attractionId: string }> }) {
  try {
    const user = await requireUser();
    const { attractionId } = await ctx.params;
    await addFavorite(user.id, attractionId);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ attractionId: string }> }) {
  try {
    const user = await requireUser();
    const { attractionId } = await ctx.params;
    await removeFavorite(user.id, attractionId);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err);
  }
}
