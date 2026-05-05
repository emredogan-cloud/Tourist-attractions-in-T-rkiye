import { cn } from "~/lib/utils";
import type { AttractionListItem } from "~/types/attraction";
import { AttractionCard } from "./attraction-card";

export function AttractionGrid({
  attractions,
  className,
  cardClassName,
}: {
  attractions: AttractionListItem[];
  className?: string;
  cardClassName?: string;
}) {
  if (attractions.length === 0) return null;
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {attractions.map((a, i) => (
        <AttractionCard key={a.id} attraction={a} className={cardClassName} priority={i < 4} />
      ))}
    </div>
  );
}
