import { redirect } from "next/navigation";
import { type Locale, isLocale } from "~/lib/i18n/config";
import { getCurrentSession } from "~/server/providers/auth";
import { listApiKeys } from "~/server/services/api-keys";
import { ApiKeysPanel } from "~/components/api-keys-panel";

export const dynamic = "force-dynamic";

export default async function DeveloperPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "tr";
  const session = await getCurrentSession();
  if (!session) redirect(`/${locale}/sign-in`);
  const keys = await listApiKeys(session.user.id);
  return (
    <div className="container max-w-3xl py-12">
      <header>
        <h1 className="font-display text-3xl font-bold">
          {locale === "tr" ? "Geliştirici" : "Developer"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {locale === "tr"
            ? "Türkiye Tourism API'sine kendi uygulamanızdan erişim için anahtar oluşturun."
            : "Create API keys to access the Türkiye Tourism API from your own app."}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {locale === "tr"
            ? "Belgeler:"
            : "Docs:"}{" "}
          <a href="/api/v1/openapi.json" className="text-primary hover:underline">
            /api/v1/openapi.json
          </a>
        </p>
      </header>
      <div className="mt-8">
        <ApiKeysPanel
          initial={keys.map((k) => ({
            id: k.id,
            name: k.name,
            prefix: k.prefix,
            scope: k.scope,
            rateLimit: k.rateLimit,
            revokedAt: k.revokedAt?.toISOString() ?? null,
            lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
          }))}
          locale={locale}
        />
      </div>
    </div>
  );
}
