import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { SignUpForm } from "~/components/auth/sign-up-form";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { getCurrentSession } from "~/server/providers/auth";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
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
      <h1 className="font-display text-2xl font-bold">{t("signUp")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <a href={`/${locale}/sign-in`} className="text-primary hover:underline">
          {t("signIn")}
        </a>
      </p>
      <div className="mt-6">
        <SignUpForm locale={locale} />
      </div>
    </div>
  );
}
