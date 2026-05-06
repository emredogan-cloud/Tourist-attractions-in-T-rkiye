import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { SignInForm } from "~/components/auth/sign-in-form";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { getCurrentSession } from "~/server/providers/auth";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const session = await getCurrentSession();
  if (session) redirect(`/${locale}/profile`);
  const t = await getTranslations("auth");
  return (
    <div className="container max-w-md py-12">
      <h1 className="font-display text-2xl font-bold">{t("signIn")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <a href={`/${locale}/sign-up`} className="text-primary hover:underline">
          {t("signUp")}
        </a>
      </p>
      <div className="mt-6">
        <SignInForm locale={locale} />
      </div>
    </div>
  );
}
