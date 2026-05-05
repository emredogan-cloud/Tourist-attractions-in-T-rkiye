import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = { title: "Cookie Policy" };

export default async function CookiesPage() {
  const locale = await getLocale();
  const isTr = locale === "tr";
  return (
    <article className="container prose prose-neutral max-w-3xl py-12 dark:prose-invert">
      <h1>{isTr ? "Çerez Politikası" : "Cookie Policy"}</h1>
      <p>
        {isTr
          ? "Sitemiz çalışması için zorunlu çerezleri kullanır ve onayınız varsa analitik ve pazarlama çerezleri de kullanır."
          : "Our site uses strictly necessary cookies. With your consent we may also use analytics and marketing cookies."}
      </p>
      <h2>{isTr ? "Zorunlu çerezler" : "Strictly necessary"}</h2>
      <p>
        {isTr
          ? "Oturum yönetimi ve güvenlik için kullanılır. Bunlar onayınız olmadan çalışır çünkü hizmeti sunmak için zorunludur."
          : "Used for session management and security. These run without consent because they are required to deliver the service."}
      </p>
      <h2>{isTr ? "Analitik" : "Analytics"}</h2>
      <p>
        {isTr
          ? "PostHog'u sayfa görüntülemeleri ve özellik kullanımı gibi anonim analizler için kullanırız. Sadece açık onayınızla yüklenir."
          : "We use PostHog for anonymized analytics such as page views and feature usage. Loaded only with your explicit consent."}
      </p>
      <h2>{isTr ? "Pazarlama" : "Marketing"}</h2>
      <p>
        {isTr
          ? "Şu anda pazarlama çerezleri kullanmıyoruz. Kullanmaya başlarsak, bu sayfada listeleyeceğiz ve onayınızı isteyeceğiz."
          : "We do not currently use marketing cookies. If we begin to, we will list them here and request your consent."}
      </p>
      <h2>{isTr ? "Tercihlerinizi yönetin" : "Manage your preferences"}</h2>
      <p>
        {isTr
          ? "Tercihlerinizi alttaki onay bandı veya tarayıcı ayarlarınızdan değiştirebilirsiniz."
          : "Change your preferences at any time via the consent banner at the bottom of the page or via your browser settings."}
      </p>
    </article>
  );
}
