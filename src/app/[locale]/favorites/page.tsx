import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { getCurrentSession } from "~/server/providers/auth";
import { listFavorites } from "~/server/services/users";
import { listAttractions } from "~/server/services/attractions";
import { AttractionGrid } from "~/components/attraction-grid";
import { Link } from "~/lib/i18n/routing";
import type { AttractionListItem } from "~/types/attraction";

export const dynamic = "force-dynamic";

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const session = await getCurrentSession();
  if (!session) redirect(`/${locale}/sign-in`);
  const t = await getTranslations("favorites");

  const favs = await listFavorites(session.user.id);
  // Re-use listAttractions to get full DTOs by slug, by querying by ids:
  const items: AttractionListItem[] = [];
  if (favs.length > 0) {
    const ids = new Set(favs.map((f) => f.attractionId));
    const all = await listAttractions({ locale, limit: 100 });
    for (const it of all.items) if (ids.has(it.id)) items.push(it);
  }

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link
            href="/attractions"
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("browseAttractions")}
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <AttractionGrid attractions={items} />
        </div>
      )}
    </div>
  );
}
