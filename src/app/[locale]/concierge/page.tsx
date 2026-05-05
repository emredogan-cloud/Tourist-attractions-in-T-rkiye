import { getTranslations } from "next-intl/server";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { ConciergeChat } from "~/components/concierge/chat";

export const dynamic = "force-dynamic";

export default async function ConciergePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const t = await getTranslations("concierge");
  return (
    <div className="container max-w-3xl py-10">
      <header>
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </header>
      <ConciergeChat locale={locale} />
    </div>
  );
}
