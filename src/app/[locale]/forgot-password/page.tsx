import { getTranslations } from "next-intl/server";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <div className="container max-w-md py-12">
      <h1 className="font-display text-2xl font-bold">{t("passwordReset")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Password reset is delivered through the email provider configured in production
        (Resend / Clerk). In this development build, reset emails are not sent — please
        contact support.
      </p>
    </div>
  );
}
