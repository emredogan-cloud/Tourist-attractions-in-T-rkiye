import type { MetadataRoute } from "next";
import { mvpLocales } from "~/lib/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const paths = [
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
  return paths.flatMap((path) =>
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
}
