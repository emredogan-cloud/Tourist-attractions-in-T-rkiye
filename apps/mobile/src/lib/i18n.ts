import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "../../../../src/messages/en.json";
import tr from "../../../../src/messages/tr.json";

const detectLocale = (): "tr" | "en" => {
  const locales = Localization.getLocales();
  const code = locales[0]?.languageCode ?? "tr";
  return code === "en" ? "en" : "tr";
};

i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: detectLocale(),
  fallbackLng: "tr",
  interpolation: { escapeValue: false },
});

export default i18n;
