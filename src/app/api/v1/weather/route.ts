import type { NextRequest } from "next/server";
import { z } from "zod";
import { parseQueryWith } from "~/lib/api-helpers";
import { cached, problem } from "~/lib/api-response";
import { getWeatherProvider } from "~/server/providers/weather";

export const runtime = "nodejs";

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  locale: z.enum(["tr", "en"]).default("tr"),
});

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryWith(request, Query);
    const provider = getWeatherProvider();
    const w = await provider.current({ lat: params.lat, lng: params.lng, locale: params.locale });
    return cached({ weather: w, provider: provider.name }, { sMaxAge: 600 });
  } catch (err) {
    return problem(err, request.url);
  }
}
