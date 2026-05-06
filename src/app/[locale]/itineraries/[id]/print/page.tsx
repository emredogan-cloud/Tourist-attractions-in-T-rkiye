import { redirect } from "next/navigation";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { getCurrentSession } from "~/server/providers/auth";
import { getItinerary } from "~/server/services/itineraries";

export const dynamic = "force-dynamic";

export default async function ItineraryPrintPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const session = await getCurrentSession();
  if (!session) redirect(`/${locale}/sign-in`);
  const it = await getItinerary({ id, userId: session.user.id });
  return (
    <div className="container max-w-3xl py-8 print:py-2">
      <style>
        {
          "@media print { header, footer, nav, .no-print { display: none !important; } body { color: #000 !important; background: #fff !important; } }"
        }
      </style>
      <header className="border-b pb-3">
        <h1 className="font-display text-3xl font-bold">{it.title}</h1>
        {it.description && <p className="mt-1 text-muted-foreground">{it.description}</p>}
        <p className="mt-2 text-xs text-muted-foreground">
          Türkiye Travel · {new Date().toLocaleDateString(locale)}
        </p>
      </header>
      <div className="space-y-5 pt-5">
        {it.days.map((day) => (
          <section key={day.id} className="break-inside-avoid">
            <h2 className="font-display text-lg font-semibold">Day {day.dayNumber}</h2>
            <ol className="mt-2 space-y-1">
              {day.stops.map((s, i) => {
                const tr =
                  s.attraction.translations.find((t) => t.locale === locale) ??
                  s.attraction.translations[0];
                if (!tr) return null;
                return (
                  <li key={s.id} className="flex gap-3">
                    <span className="font-medium">{i + 1}.</span>
                    <div>
                      <p className="font-medium">{tr.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.attraction.latitude.toFixed(4)}, {s.attraction.longitude.toFixed(4)}
                        {s.plannedDurationMin ? ` · ${s.plannedDurationMin} min` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
      <div className="mt-8 border-t pt-3 text-center text-xs text-muted-foreground no-print">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md border px-3 py-1.5 hover:bg-secondary"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
