import { redirect } from "next/navigation";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { getCurrentSession } from "~/server/providers/auth";
import { getCurrentSubscription } from "~/server/services/subscriptions";
import { PremiumActions } from "~/components/premium-actions";
import { PLAN_PRICING } from "~/server/providers/payments";

export const dynamic = "force-dynamic";

export default async function PremiumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const session = await getCurrentSession();
  if (!session) redirect(`/${locale}/sign-in`);
  const sub = await getCurrentSubscription(session.user.id);
  return (
    <div className="container max-w-3xl py-12">
      <header>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase">
          Türkiye+
        </span>
        <h1 className="mt-3 font-display text-4xl font-bold">
          {locale === "tr"
            ? "Türkiye'yi sınırsız keşfedin"
            : "Discover Türkiye, unlimited"}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {locale === "tr"
            ? "Türkiye+ ile çevrimdışı bölgeler, sınırsız AI sohbet ve reklamsız deneyim."
            : "Türkiye+ unlocks offline regions, unlimited AI chat, and an ad-free experience."}
        </p>
      </header>
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {(["turkiye_plus_monthly", "turkiye_plus_yearly"] as const).map((plan) => (
          <article
            key={plan}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h2 className="font-display text-lg font-semibold">{PLAN_PRICING[plan].description}</h2>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              ₺{PLAN_PRICING[plan].monthlyTryEquivalent}
              <span className="text-base font-normal text-muted-foreground">
                /{locale === "tr" ? "ay" : "mo"}
              </span>
            </p>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              <li>✓ {locale === "tr" ? "Sınırsız AI Asistan" : "Unlimited AI Concierge"}</li>
              <li>✓ {locale === "tr" ? "Çevrimdışı bölge indirme" : "Offline region downloads"}</li>
              <li>✓ {locale === "tr" ? "Reklamsız" : "Ad-free"}</li>
              {plan === "turkiye_plus_yearly" && (
                <li>✓ {locale === "tr" ? "İki ay bedava" : "2 months free"}</li>
              )}
            </ul>
            <PremiumActions
              plan={plan}
              locale={locale}
              isActive={sub?.status === "ACTIVE" && sub.plan === plan}
              hasActive={sub?.status === "ACTIVE"}
            />
          </article>
        ))}
      </section>
      <p className="mt-8 text-xs text-muted-foreground">
        {locale === "tr"
          ? "Türkiye'de Iyzico (3D Secure), uluslararası kullanıcılar için Stripe. Mevcut yapıda mock ödeme sağlayıcısı kullanılır."
          : "Iyzico (3D Secure) for Türkiye, Stripe for international. The current build uses a mock payment provider."}
      </p>
    </div>
  );
}
