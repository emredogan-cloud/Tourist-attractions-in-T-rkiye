import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { DangerZone } from "~/components/auth/danger-zone";
import { ProfileForm } from "~/components/auth/profile-form";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { getCurrentSession } from "~/server/providers/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const session = await getCurrentSession();
  if (!session) redirect(`/${locale}/sign-in`);
  const t = await getTranslations("auth");
  const tnav = await getTranslations("nav");
  return (
    <div className="container max-w-2xl space-y-10 py-12">
      <header>
        <h1 className="font-display text-3xl font-bold">{tnav("profile")}</h1>
        <p className="text-sm text-muted-foreground">{session.user.email}</p>
      </header>

      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">{tnav("settings")}</h2>
        <ProfileForm
          initial={{
            displayName: session.user.displayName ?? "",
            locale: session.user.locale,
          }}
        />
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">{t("exportData")}</h2>
        <p className="text-sm text-muted-foreground">
          {locale === "tr"
            ? "Tüm hesap verilerinizi JSON olarak indirin (KVKK / GDPR)."
            : "Download all your account data as JSON (KVKK / GDPR)."}
        </p>
        <a
          href="/api/v1/me/export"
          className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-secondary"
        >
          {t("exportData")} ↓
        </a>
      </section>

      <section className="space-y-4 rounded-xl border border-destructive/40 bg-destructive/5 p-6">
        <h2 className="font-display text-lg font-semibold text-destructive">
          {t("deleteAccount")}
        </h2>
        <DangerZone locale={locale} />
      </section>
    </div>
  );
}
