import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AttractionGrid } from "~/components/attraction-grid";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { Link } from "~/lib/i18n/routing";
import { prisma } from "~/server/db/client";
import { listAttractions } from "~/server/services/attractions";

export const revalidate = 3600;

export async function generateStaticParams() {
  const cats = await prisma.category.findMany();
  return ["tr", "en"].flatMap((locale) =>
    cats.flatMap((c) => [
      { locale, slug: c.slugTr },
      { locale, slug: c.slugEn },
    ]),
  );
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: localeParam, slug } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const cat = await prisma.category.findFirst({
    where: { OR: [{ slugTr: slug }, { slugEn: slug }] },
  });
  if (!cat) notFound();

  const t = await getTranslations("categories");
  const tnav = await getTranslations("nav");

  const { items } = await listAttractions({
    locale,
    category: cat.code,
    limit: 60,
    sort: "popular",
  });

  return (
    <div className="container py-10">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted-foreground">
        <Link href="/categories" className="hover:text-primary">
          {tnav("categories")}
        </Link>
      </nav>
      <h1 className="font-display text-3xl font-bold">{t(cat.code as never)}</h1>
      <p className="mt-1 text-muted-foreground">
        {items.length} {tnav("attractions").toLowerCase()}
      </p>
      <div className="mt-8">
        <AttractionGrid attractions={items} />
      </div>
    </div>
  );
}
