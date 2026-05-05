import { notFound } from "next/navigation";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { getByShareToken } from "~/server/services/itineraries";
import { Link } from "~/lib/i18n/routing";

export const dynamic = "force-dynamic";

export default async function SharedItineraryPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale: localeParam, token } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  let it;
  try {
    it = await getByShareToken(token);
  } catch {
    notFound();
  }

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">{it.title}</h1>
      {it.description && <p className="mt-1 text-muted-foreground">{it.description}</p>}
      <div className="mt-8 space-y-6">
        {it.days.map((day) => (
          <section key={day.id} className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Day {day.dayNumber}</h2>
            <ol className="mt-3 space-y-2">
              {day.stops.map((s, i) => {
                const tr =
                  s.attraction.translations.find((t) => t.locale === locale) ??
                  s.attraction.translations[0];
                if (!tr) return null;
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
                  >
                    <span className="grid h-7 w-7 place-content-center rounded-full bg-primary text-primary-foreground text-xs">
                      {i + 1}
                    </span>
                    <Link
                      href={`/attractions/${tr.slug}`}
                      className="flex-1 font-medium hover:text-primary"
                    >
                      {tr.name}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
