import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  DATABASE_URL: z.string().min(1),
  DATABASE_PROVIDER: z.enum(["sqlite", "postgresql"]).default("sqlite"),

  REDIS_URL: z.string().default("redis://localhost:6379"),

  MEILISEARCH_HOST: z.string().default("http://localhost:7700"),
  MEILISEARCH_MASTER_KEY: z.string().default("masterKeyChangeMe"),
  MEILISEARCH_SEARCH_KEY: z.string().default(""),

  AUTH_PROVIDER: z.enum(["mock", "clerk"]).default("mock"),
  AUTH_COOKIE_SECRET: z.string().min(32).default("dev-only-secret-please-change-in-prod-32+"),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  STORAGE_PROVIDER: z.enum(["local", "r2"]).default("local"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  NEXT_PUBLIC_MAP_PROVIDER: z.enum(["openfreemap", "mapbox"]).default("openfreemap"),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),

  AI_PROVIDER: z.enum(["mock", "anthropic"]).default("mock"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL_DEFAULT: z.string().default("claude-sonnet-4-6"),
  ANTHROPIC_MODEL_PREMIUM: z.string().default("claude-opus-4-7"),
  OPENAI_API_KEY: z.string().optional(),

  NEARBY_PROVIDER_HOTELS: z.enum(["mock", "booking"]).default("mock"),
  NEARBY_PROVIDER_RESTAURANTS: z.enum(["mock", "foursquare"]).default("mock"),
  BOOKING_AFFILIATE_ID: z.string().optional(),
  BOOKING_API_KEY: z.string().optional(),
  FOURSQUARE_API_KEY: z.string().optional(),

  EMAIL_PROVIDER: z.enum(["mock", "resend"]).default("mock"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Türkiye Tourism <noreply@example.com>"),

  OPENWEATHER_API_KEY: z.string().optional(),

  PAYMENT_PROVIDER: z.enum(["mock", "stripe", "iyzico"]).default("mock"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  IYZICO_API_KEY: z.string().optional(),
  IYZICO_SECRET_KEY: z.string().optional(),

  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().default("https://eu.i.posthog.com"),

  FEATURE_AI_CONCIERGE: z.coerce.boolean().default(true),
  FEATURE_ITINERARIES: z.coerce.boolean().default(true),
  FEATURE_REVIEWS: z.coerce.boolean().default(true),
  FEATURE_PREMIUM: z.coerce.boolean().default(true),
});

let cached: z.infer<typeof schema> | undefined;

export function getConfig(): z.infer<typeof schema> {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Fail fast on misconfigured env in non-test contexts
    if (process.env.NODE_ENV === "test") {
      cached = schema.parse({ DATABASE_URL: "file:./test.db" });
      return cached;
    }
    const issues = parsed.error.issues
      .map((i) => ` - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export type AppConfig = z.infer<typeof schema>;
