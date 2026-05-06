import { getTranslations } from "next-intl/server";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { Link } from "~/lib/i18n/routing";
import { listEvents } from "~/server/services/events";

export const revalidate = 300;

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const t = await getTranslations("events");
  const tnav = await getTranslations("nav");
  const events = await listEvents({ locale, limit: 100 });

  const todayISO = new Date().toISOString().slice(0, 10);
  const buckets = {
    today: [] as typeof events,
    week: [] as typeof events,
    month: [] as typeof events,
    upcoming: [] as typeof events,
  };
  const now = Date.now();
  const weekEnd = now + 7 * 24 * 3600 * 1000;
  const monthEnd = now + 30 * 24 * 3600 * 1000;

  for (const e of events) {
    const d = new Date(e.startsAt).getTime();
    if (e.startsAt.slice(0, 10) === todayISO) buckets.today.push(e);
    else if (d <= weekEnd) buckets.week.push(e);
    else if (d <= monthEnd) buckets.month.push(e);
    else buckets.upcoming.push(e);
  }

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">
        {events.length} · {tnav("events").toLowerCase()}
      </p>
      <div className="mt-8 space-y-10">
        <Bucket title={t("today")} items={buckets.today} locale={locale} />
        <Bucket title={t("thisWeek")} items={buckets.week} locale={locale} />
        <Bucket title={t("thisMonth")} items={buckets.month} locale={locale} />
        <Bucket title={t("upcoming")} items={buckets.upcoming} locale={locale} />
      </div>
    </div>
  );
}

function Bucket({
  title,
  items,
  locale,
}: {
  title: string;
  items: Awaited<ReturnType<typeof listEvents>>;
  locale: Locale;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((e) => (
          <article key={e.id} className="rounded-xl border border-border bg-card p-4">
            <header className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {e.type.replaceAll("_", " ")}
              </span>
              <time className="text-xs text-muted-foreground" dateTime={e.startsAt}>
                {new Date(e.startsAt).toLocaleDateString(locale)}
              </time>
            </header>
            <h3 className="mt-1 font-display text-lg font-semibold">{e.title}</h3>
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{e.body}</p>
            {e.attraction && (
              <Link
                href={`/attractions/${e.attraction.slug}`}
                className="mt-3 inline-flex text-sm text-primary hover:underline"
              >
                → {e.attraction.name}
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
