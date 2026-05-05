import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBodyWith } from "~/lib/api-helpers";
import { noStore, problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { getPreferences, setPreferences } from "~/server/services/recommendations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  themeInterests: z.array(z.string()).max(8).default([]),
  preferredRegions: z.array(z.string()).max(7).default([]),
  budgetTier: z.enum(["BUDGET", "MID", "LUXURY"]).nullable().default(null),
  travelStyle: z.enum(["FAST", "RELAXED", "BALANCED"]).nullable().default(null),
  groupType: z.enum(["SOLO", "COUPLE", "FAMILY", "FRIENDS"]).nullable().default(null),
});

export async function GET() {
  try {
    const user = await requireUser();
    const prefs = await getPreferences(user.id);
    return noStore({ preferences: prefs });
  } catch (err) {
    return problem(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await parseJsonBodyWith(request, Body);
    await setPreferences({ userId: user.id, prefs: body });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err, request.url);
  }
}
