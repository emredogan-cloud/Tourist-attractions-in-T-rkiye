import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBodyWith } from "~/lib/api-helpers";
import { noStore, problem } from "~/lib/api-response";
import { getCurrentSession, requireUser } from "~/server/providers/auth";
import { deleteItinerary, getItinerary, updateItinerary } from "~/server/services/itineraries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchBody = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime().nullable().optional(),
  isPublic: z.boolean().optional(),
  themes: z.array(z.string()).max(20).optional(),
});

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const session = await getCurrentSession();
    const url = new URL(request.url);
    const shareToken = url.searchParams.get("share") ?? undefined;
    const it = await getItinerary({
      id,
      userId: session?.user.id ?? null,
      ...(shareToken ? { shareToken } : {}),
    });
    return noStore({ itinerary: it });
  } catch (err) {
    return problem(err, request.url);
  }
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await parseJsonBodyWith(request, PatchBody);
    const updated = await updateItinerary({
      id,
      userId: user.id,
      patch: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.startDate !== undefined
          ? { startDate: body.startDate === null ? null : new Date(body.startDate) }
          : {}),
        ...(body.isPublic !== undefined ? { isPublic: body.isPublic } : {}),
        ...(body.themes !== undefined ? { themes: body.themes } : {}),
      },
    });
    return NextResponse.json({ itinerary: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err, request.url);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    await deleteItinerary({ id, userId: user.id });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err);
  }
}
