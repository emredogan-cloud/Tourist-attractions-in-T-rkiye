import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBodyWith } from "~/lib/api-helpers";
import { problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { startCheckout } from "~/server/services/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  plan: z.enum(["turkiye_plus_monthly", "turkiye_plus_yearly"]),
  locale: z.string().default("tr"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await parseJsonBodyWith(request, Body);
    const baseUrl = process.env.APP_URL ?? new URL(request.url).origin;
    const session = await startCheckout({
      userId: user.id,
      email: user.email,
      plan: body.plan,
      locale: body.locale,
      baseUrl,
    });
    return NextResponse.json(
      { checkout: session },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    return problem(err, request.url);
  }
}
