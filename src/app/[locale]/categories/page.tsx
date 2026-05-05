import { getTranslations } from "next-intl/server";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { Link } from "~/lib/i18n/routing";
import { listCategories } from "~/server/services/attractions";

export const revalidate = 86400;

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const tnav = await getTranslations("nav");
  const categories = await listCategories(locale);

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">{tnav("categories")}</h1>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((c) => (
          <Link
            key={c.code}
            href={`/categories/${c.slug}`}
            className="rounded-xl border border-border bg-card p-5 transition hover:border-primary hover:bg-secondary/30"
          >
            <p className="font-display text-lg font-semibold">{c.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">/{c.slug}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
