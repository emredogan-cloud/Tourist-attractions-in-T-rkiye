import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const locale = await getLocale();
  const isTr = locale === "tr";
  return (
    <article className="container prose prose-neutral max-w-3xl py-12 dark:prose-invert">
      <h1>{isTr ? "Hakkımızda" : "About"}</h1>
      <p>
        {isTr
          ? "Türkiye Gezi, Türkiye'nin tüm önemli turistik yerlerini iki dilde tek bir platformda birleştirme misyonuyla kurulmuştur. Tarihi yapılardan doğa harikalarına, kültür merkezlerinden gizli plajlara kadar her yeri keşfetmek için tasarlandı."
          : "Türkiye Travel exists to bring every notable Turkish attraction together in two languages on one platform — from historical sites to natural wonders, cultural venues to hidden beaches."}
      </p>
      <p>
        {isTr
          ? "Açık veriye, doğru atıfa ve bağımsız değerlendirmeye değer veriyoruz. Tüm fotoğraflar uygun lisanslarla kullanılır ve ziyaretçi istatistikleri T.C. Kültür ve Turizm Bakanlığı kaynaklarından alınır."
          : "We value open data, correct attribution, and independent reviews. All photos are used under proper licenses and visitor statistics come from the Republic of Türkiye Ministry of Culture and Tourism."}
      </p>
    </article>
  );
}
