import { redirect } from "next/navigation";
import { PreferencesForm } from "~/components/preferences-form";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { getCurrentSession } from "~/server/providers/auth";
import { getPreferences } from "~/server/services/recommendations";

export const dynamic = "force-dynamic";

export default async function PreferencesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const session = await getCurrentSession();
  if (!session) redirect(`/${locale}/sign-in`);
  const prefs = await getPreferences(session.user.id);
  return (
    <div className="container max-w-2xl py-12">
      <h1 className="font-display text-3xl font-bold">
        {locale === "tr" ? "Tercihlerim" : "My Preferences"}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {locale === "tr"
          ? "Size daha iyi öneriler sunabilmek için bize biraz kendinizden bahsedin."
          : "Tell us a bit about you and we'll tailor the recommendations."}
      </p>
      <div className="mt-8">
        <PreferencesForm initial={prefs} locale={locale} />
      </div>
    </div>
  );
}
