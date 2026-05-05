import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBodyWith } from "~/lib/api-helpers";
import { noStore, problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { createItinerary, listMyItineraries } from "~/server/services/itineraries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime().optional(),
  themes: z.array(z.string()).max(20).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const items = await listMyItineraries(user.id);
    return noStore({ itineraries: items });
  } catch (err) {
    return problem(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await parseJsonBodyWith(request, Body);
    const created = await createItinerary({
      userId: user.id,
      title: body.title,
      ...(body.description ? { description: body.description } : {}),
      ...(body.startDate ? { startDate: new Date(body.startDate) } : {}),
      ...(body.themes ? { themes: body.themes } : {}),
    });
    return NextResponse.json({ itinerary: created }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err, request.url);
  }
}
