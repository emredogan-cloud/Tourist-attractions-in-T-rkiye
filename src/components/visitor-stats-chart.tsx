"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { year: number; month: number; visitorCount: number };

export function VisitorStatsChart({
  points,
  source,
}: {
  points: Point[];
  source: string;
}) {
  const t = useTranslations("detail");
  const locale = useLocale();
  const years = useMemo(() => {
    return [...new Set(points.map((p) => p.year))].sort((a, b) => b - a);
  }, [points]);
  const [year, setYear] = useState<number | null>(years[0] ?? null);

  if (points.length === 0 || year === null) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        {t("noStatsAvailable")}
      </div>
    );
  }

  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });
  const data = points
    .filter((p) => p.year === year)
    .map((p) => ({
      label: monthFormatter.format(new Date(p.year, p.month - 1, 1)),
      visitors: p.visitorCount,
    }));
  const formatter = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Year:</span>
        <div className="flex gap-1">
          {years.map((y) => (
            <button
              type="button"
              key={y}
              onClick={() => setYear(y)}
              className={`rounded-md border px-2 py-1 text-xs ${
                year === y
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary"
              }`}
              aria-pressed={year === y}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="label" fontSize={12} />
            <YAxis tickFormatter={(v) => formatter.format(v as number)} fontSize={12} width={50} />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              formatter={(v) => formatter.format(v as number)}
            />
            <Legend />
            <Bar
              dataKey="visitors"
              name={t("visitorStats")}
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">{source ? `${t("visitorStatsSource")}` : ""}</p>
    </div>
  );
}
