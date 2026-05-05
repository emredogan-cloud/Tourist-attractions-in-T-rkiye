import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { Link } from "~/lib/i18n/routing";
import { Button } from "~/components/ui/button";
import { getCurrentSession } from "~/server/providers/auth";
import { listMyItineraries } from "~/server/services/itineraries";
import { ItinerariesNew } from "~/components/itineraries/new-button";

export const dynamic = "force-dynamic";

export default async function ItinerariesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const session = await getCurrentSession();
  if (!session) redirect(`/${locale}/sign-in`);
  const t = await getTranslations("itineraries");
  const items = await listMyItineraries(session.user.id);

  return (
    <div className="container py-10">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <ItinerariesNew />
      </header>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <p className="rounded-md border border-border bg-card p-8 text-center text-muted-foreground md:col-span-2 lg:col-span-3">
            {t("empty")}
          </p>
        ) : (
          items.map((it) => (
            <Link
              key={it.id}
              href={`/itineraries/${it.id}`}
              className="rounded-xl border border-border bg-card p-5 transition hover:border-primary"
            >
              <h2 className="font-display text-lg font-semibold">{it.title}</h2>
              {it.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{it.description}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {it.days.length} × {t("day", { number: 1 })} · {it.days.reduce((s, d) => s + d.stops.length, 0)} stops
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
