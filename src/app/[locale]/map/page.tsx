import { getTranslations } from "next-intl/server";
import { MapView } from "~/components/map-view";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { listMapMarkers } from "~/server/services/attractions";

export const revalidate = 3600;

export default async function MapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const tnav = await getTranslations("nav");
  const markers = await listMapMarkers({ locale });

  return (
    <div className="flex h-[calc(100vh-128px)] min-h-[480px] flex-col">
      <div className="container py-4">
        <h1 className="font-display text-2xl font-bold">{tnav("map")}</h1>
        <p className="text-sm text-muted-foreground">{markers.length}</p>
      </div>
      <div className="flex-1">
        <MapView markers={markers} locale={locale} />
      </div>
    </div>
  );
}
