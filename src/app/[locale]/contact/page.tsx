import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const locale = await getLocale();
  const isTr = locale === "tr";
  return (
    <article className="container prose prose-neutral max-w-3xl py-12 dark:prose-invert">
      <h1>{isTr ? "İletişim" : "Contact"}</h1>
      <p>{isTr ? "Bize ulaşın:" : "Reach out:"}</p>
      <ul>
        <li>{isTr ? "Genel" : "General"}: hello@turkiye-tourism.example</li>
        <li>{isTr ? "Basın" : "Press"}: press@turkiye-tourism.example</li>
        <li>{isTr ? "Veri Koruma" : "Data Protection"}: dpo@turkiye-tourism.example</li>
        <li>{isTr ? "Güvenlik" : "Security"}: security@turkiye-tourism.example</li>
      </ul>
    </article>
  );
}
