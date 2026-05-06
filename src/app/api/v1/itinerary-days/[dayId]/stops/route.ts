import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBodyWith } from "~/lib/api-helpers";
import { problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { addStop, reorderStops } from "~/server/services/itineraries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AddBody = z.object({
  attractionId: z.string(),
  plannedDurationMin: z.number().int().min(15).max(720).optional(),
  plannedArrivalTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ dayId: string }> }) {
  try {
    const user = await requireUser();
    const { dayId } = await ctx.params;
    const body = await parseJsonBodyWith(request, AddBody);
    const stop = await addStop({
      dayId,
      userId: user.id,
      attractionId: body.attractionId,
      ...(body.plannedDurationMin ? { plannedDurationMin: body.plannedDurationMin } : {}),
      ...(body.plannedArrivalTime ? { plannedArrivalTime: body.plannedArrivalTime } : {}),
    });
    return NextResponse.json({ stop }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err, request.url);
  }
}

const ReorderBody = z.object({ stopIds: z.array(z.string()) });

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ dayId: string }> }) {
  try {
    const user = await requireUser();
    const { dayId } = await ctx.params;
    const body = await parseJsonBodyWith(request, ReorderBody);
    await reorderStops({ dayId, userId: user.id, stopIds: body.stopIds });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return problem(err, request.url);
  }
}
