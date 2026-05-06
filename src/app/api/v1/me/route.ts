import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBodyWith } from "~/lib/api-helpers";
import { noStore, problem } from "~/lib/api-response";
import { isLocale } from "~/lib/i18n/config";
import { getCurrentSession, requireUser } from "~/server/providers/auth";
import { getUserProfile, softDeleteUser, updateUserProfile } from "~/server/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchBody = z.object({
  displayName: z.string().min(1).max(80).optional(),
  avatarUrl: z.string().url().optional(),
  locale: z.string().refine(isLocale).optional(),
  marketingOptIn: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) return noStore({ user: null });
    const profile = await getUserProfile(session.user.id);
    return noStore({ user: profile });
  } catch (err) {
    return problem(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await parseJsonBodyWith(request, PatchBody);
    const updated = await updateUserProfile(user.id, body);
    return NextResponse.json({ user: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return problem(err, request.url);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    const result = await softDeleteUser(user.id);
    return NextResponse.json(
      { ok: true, hardDeleteAt: result.hardDeleteAt },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    return problem(err);
  }
}
