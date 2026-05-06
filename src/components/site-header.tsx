import { getTranslations } from "next-intl/server";
import { Link } from "~/lib/i18n/routing";
import { getCurrentSession } from "~/server/providers/auth";
import { AccessibilityToolbar } from "./accessibility-toolbar";
import { GlobalSearch } from "./global-search";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const session = await getCurrentSession();
  const items = [
    { href: "/attractions", label: t("attractions") },
    { href: "/regions", label: t("regions") },
    { href: "/categories", label: t("categories") },
    { href: "/map", label: t("map") },
    { href: "/events", label: t("events") },
    { href: "/itineraries", label: t("itineraries") },
    { href: "/concierge", label: t("concierge") },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span
              aria-hidden
              className="grid h-8 w-8 place-content-center rounded-md bg-primary text-primary-foreground"
            >
              ★
            </span>
            <span>Türkiye</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 text-sm">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block w-64">
            <GlobalSearch compact />
          </div>
          <AccessibilityToolbar />
          <LocaleSwitcher />
          <ThemeToggle />
          {session ? (
            <UserMenu user={session.user} />
          ) : (
            <Link
              href="/sign-in"
              className="hidden md:inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-secondary"
            >
              {t("signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
