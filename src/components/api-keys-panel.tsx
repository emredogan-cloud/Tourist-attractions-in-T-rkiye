"use client";

import { useState } from "react";
import type { Locale } from "~/lib/i18n/config";
import { Button } from "./ui/button";

type KeyRow = {
  id: string;
  name: string;
  prefix: string;
  scope: string;
  rateLimit: number;
  revokedAt: string | null;
  lastUsedAt: string | null;
};

export function ApiKeysPanel({ initial, locale }: { initial: KeyRow[]; locale: Locale }) {
  const [keys, setKeys] = useState<KeyRow[]>(initial);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"read" | "read_write">("read");
  const [pending, setPending] = useState(false);
  const [newKey, setNewKey] = useState<{ key: string; prefix: string } | null>(null);

  async function refresh() {
    const r = await fetch("/api/v1/me/api-keys");
    if (!r.ok) return;
    const j = (await r.json()) as { apiKeys: KeyRow[] };
    setKeys(j.apiKeys);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    try {
      const r = await fetch("/api/v1/me/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scope }),
      });
      if (!r.ok) return;
      const j = (await r.json()) as { apiKey: { key: string; prefix: string } };
      setNewKey({ key: j.apiKey.key, prefix: j.apiKey.prefix });
      setName("");
      await refresh();
    } finally {
      setPending(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm(locale === "tr" ? "Anahtarı iptal et?" : "Revoke this key?")) return;
    await fetch(`/api/v1/me/api-keys/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={create}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-4"
      >
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="apikey-name"
            className="block text-xs uppercase tracking-wide text-muted-foreground"
          >
            {locale === "tr" ? "Anahtar adı" : "Key name"}
          </label>
          <input
            id="apikey-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={locale === "tr" ? "Örn. mobile-app" : "e.g. mobile-app"}
            maxLength={80}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
          />
        </div>
        <div>
          <label
            htmlFor="apikey-scope"
            className="block text-xs uppercase tracking-wide text-muted-foreground"
          >
            {locale === "tr" ? "İzin" : "Scope"}
          </label>
          <select
            id="apikey-scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as "read" | "read_write")}
            className="mt-1 rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="read">read</option>
            <option value="read_write">read_write</option>
          </select>
        </div>
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? "…" : locale === "tr" ? "Oluştur" : "Create"}
        </Button>
      </form>

      {newKey && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
          <p className="text-xs font-semibold uppercase tracking-wide">
            {locale === "tr"
              ? "Yeni anahtar (yalnızca şimdi gösterilir)"
              : "New key (only shown now)"}
          </p>
          <code className="mt-2 block break-all rounded-md bg-background px-3 py-2 text-sm">
            {newKey.key}
          </code>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">{locale === "tr" ? "Ad" : "Name"}</th>
              <th className="px-3 py-2">{locale === "tr" ? "Önek" : "Prefix"}</th>
              <th className="px-3 py-2">{locale === "tr" ? "İzin" : "Scope"}</th>
              <th className="px-3 py-2">{locale === "tr" ? "Limit" : "Limit"}</th>
              <th className="px-3 py-2">{locale === "tr" ? "Durum" : "Status"}</th>
              <th className="px-3 py-2"> </th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  {locale === "tr" ? "Henüz anahtar yok" : "No keys yet"}
                </td>
              </tr>
            ) : (
              keys.map((k) => (
                <tr key={k.id} className="border-t border-border">
                  <td className="px-3 py-2">{k.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{k.prefix}…</td>
                  <td className="px-3 py-2">{k.scope}</td>
                  <td className="px-3 py-2 tabular-nums">{k.rateLimit}/h</td>
                  <td className="px-3 py-2">
                    {k.revokedAt ? (
                      <span className="text-destructive">
                        {locale === "tr" ? "İptal" : "Revoked"}
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-300">
                        {locale === "tr" ? "Aktif" : "Active"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {!k.revokedAt && (
                      <button
                        type="button"
                        onClick={() => revoke(k.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        {locale === "tr" ? "İptal et" : "Revoke"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
