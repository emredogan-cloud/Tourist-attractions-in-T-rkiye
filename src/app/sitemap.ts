import type { MetadataRoute } from "next";
import { mvpLocales } from "~/lib/i18n/config";
import { prisma } from "~/server/db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const staticPaths = [
    "",
    "/attractions",
    "/regions",
    "/categories",
    "/map",
    "/events",
    "/itineraries",
    "/concierge",
    "/about",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
    "/legal/kvkk",
  ];
  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    mvpLocales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(mvpLocales.map((l) => [l, `${base}/${l}${path}`])),
      },
    })),
  );

  let attractionEntries: MetadataRoute.Sitemap = [];
  try {
    const translations = await prisma.attractionTranslation.findMany({
      where: { attraction: { status: "PUBLISHED" } },
      select: { locale: true, slug: true, attractionId: true, updatedAt: true },
    });
    const byAttraction = new Map<string, Map<string, string>>();
    for (const tr of translations) {
      let inner = byAttraction.get(tr.attractionId);
      if (!inner) {
        inner = new Map();
        byAttraction.set(tr.attractionId, inner);
      }
      inner.set(tr.locale, tr.slug);
    }
    attractionEntries = translations.map((tr) => {
      const slugs = byAttraction.get(tr.attractionId);
      return {
        url: `${base}/${tr.locale}/attractions/${tr.slug}`,
        lastModified: tr.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            mvpLocales.map((l) => [l, `${base}/${l}/attractions/${slugs?.get(l) ?? tr.slug}`]),
          ),
        },
      };
    });
  } catch {
    // ignore — DB unavailable during build won't block sitemap
  }

  return [...staticEntries, ...attractionEntries];
}
