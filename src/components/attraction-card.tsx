import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "~/lib/i18n/routing";
import { cn } from "~/lib/utils";
import type { AttractionListItem } from "~/types/attraction";
import { Badge } from "./ui/badge";

export function AttractionCard({
  attraction,
  className,
  priority,
}: {
  attraction: AttractionListItem;
  className?: string;
  priority?: boolean;
}) {
  const t = useTranslations();
  return (
    <Link
      href={`/attractions/${attraction.slug}`}
      className={cn(
        "group block overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {attraction.heroImage ? (
          <Image
            src={attraction.heroImage.url}
            alt={attraction.heroImage.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={!!priority}
          />
        ) : (
          <div
            className="grid h-full w-full place-content-center text-4xl text-muted-foreground/40"
            aria-hidden
          >
            ✦
          </div>
        )}
        {attraction.unescoStatus && (
          <Badge variant="gold" className="absolute left-3 top-3 shadow">
            {t("detail.unesco")}
          </Badge>
        )}
        {attraction.isFreeEntry && (
          <Badge variant="success" className="absolute right-3 top-3 shadow">
            {t("common.free")}
          </Badge>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{attraction.category.name}</span>
          <span aria-hidden>·</span>
          <span>
            {attraction.province.name}
            {attraction.district ? ` / ${attraction.district}` : ""}
          </span>
        </div>
        <h3 className="line-clamp-2 font-display text-lg font-semibold leading-tight group-hover:text-primary">
          {attraction.name}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{attraction.summary}</p>
        <div className="flex items-center justify-between pt-1 text-sm">
          <span className="inline-flex items-center gap-1">
            <span aria-hidden className="text-amber-500">
              ★
            </span>
            <span className="font-medium">{attraction.averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              · {t("reviews.totalReviews", { count: attraction.reviewCount })}
            </span>
          </span>
          {attraction.distanceMeters !== undefined && (
            <span className="text-muted-foreground">
              {(attraction.distanceMeters / 1000).toFixed(1)} km
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
