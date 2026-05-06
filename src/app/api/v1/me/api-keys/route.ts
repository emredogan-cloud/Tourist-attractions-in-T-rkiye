import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBodyWith } from "~/lib/api-helpers";
import { noStore, problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { createApiKey, listApiKeys } from "~/server/services/api-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().min(1).max(80),
  scope: z.enum(["read", "read_write"]).default("read"),
  rateLimit: z.number().int().min(10).max(10000).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const items = await listApiKeys(user.id);
    return noStore({ apiKeys: items });
  } catch (err) {
    return problem(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await parseJsonBodyWith(request, Body);
    const created = await createApiKey({
      userId: user.id,
      name: body.name,
      scope: body.scope,
      ...(body.rateLimit ? { rateLimit: body.rateLimit } : {}),
    });
    return NextResponse.json(
      { apiKey: created, warning: "This is the only time the full key will be shown." },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return problem(err, request.url);
  }
}
