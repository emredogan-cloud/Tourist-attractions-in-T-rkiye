import { noStore, problem } from "~/lib/api-response";
import { requireUser } from "~/server/providers/auth";
import { listFavorites } from "~/server/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const favorites = await listFavorites(user.id);
    return noStore({ favorites });
  } catch (err) {
    return problem(err);
  }
}
