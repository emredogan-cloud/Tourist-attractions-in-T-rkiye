import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "~/lib/i18n/routing";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const locale = await getLocale();
  return (
    <footer className="border-t border-border/60 bg-secondary/30">
      <div className="container grid gap-10 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-display text-lg font-semibold">
            <span
              aria-hidden
              className="grid h-8 w-8 place-content-center rounded-md bg-primary text-primary-foreground"
            >
              ★
            </span>
            Türkiye
          </div>
          <p className="text-sm text-muted-foreground">{t("madeWith")}</p>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold uppercase tracking-wide text-xs text-muted-foreground">
            {t("about")}
          </h3>
          <ul className="space-y-1.5">
            <li>
              <Link href="/about" className="hover:text-primary">
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-primary">
                {t("blog")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-primary">
                {t("contact")}
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold uppercase tracking-wide text-xs text-muted-foreground">
            {t("legal")}
          </h3>
          <ul className="space-y-1.5">
            <li>
              <Link href="/legal/privacy" className="hover:text-primary">
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/legal/terms" className="hover:text-primary">
                {t("terms")}
              </Link>
            </li>
            <li>
              <Link href="/legal/kvkk" className="hover:text-primary">
                {t("kvkk")}
              </Link>
            </li>
            <li>
              <Link href="/legal/cookies" className="hover:text-primary">
                {t("cookies")}
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold uppercase tracking-wide text-xs text-muted-foreground">
            {t("newsletterTitle")}
          </h3>
          <p className="text-muted-foreground">{t("newsletterSubtitle")}</p>
          <form className="mt-2 flex gap-2" action="/api/v1/newsletter" method="post">
            <input
              type="email"
              name="email"
              required
              placeholder={t("newsletterPlaceholder")}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2"
              aria-label={t("newsletterPlaceholder")}
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("subscribe")}
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        {t("copyright", { year: new Date().getFullYear() })} ·{" "}
        <span suppressHydrationWarning>{locale.toUpperCase()}</span>
      </div>
    </footer>
  );
}
