import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { getCurrentSession } from "~/server/providers/auth";
import { getItinerary } from "~/server/services/itineraries";
import { ItineraryEditor } from "~/components/itineraries/editor";

export const dynamic = "force-dynamic";

export default async function ItineraryEditorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const session = await getCurrentSession();
  if (!session) redirect(`/${locale}/sign-in`);
  const it = await getItinerary({ id, userId: session.user.id });
  const t = await getTranslations("itineraries");
  return <ItineraryEditor itinerary={it} locale={locale} t={{
    day: t("day", { number: 0 }).replace(/\d+/, "{n}"),
    addStop: t("addStop"),
    removeStop: t("removeStop"),
    optimize: t("optimize"),
    share: t("share"),
    clone: t("clone"),
    exportPdf: t("exportPdf"),
  }} />;
}
