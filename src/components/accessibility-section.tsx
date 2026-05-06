import { useTranslations } from "next-intl";
import type { AccessibilityFlags } from "~/types/attraction";

const ICON: Record<keyof AccessibilityFlags, string> = {
  wheelchair: "♿",
  audioGuide: "🎧",
  braille: "🅱️",
  signLanguage: "🤟",
  lowStimulation: "🤫",
  serviceAnimal: "🐕",
};

const LABEL_TR: Record<keyof AccessibilityFlags, string> = {
  wheelchair: "Tekerlekli sandalye erişimi",
  audioGuide: "Sesli rehber",
  braille: "Braille bilgi",
  signLanguage: "İşaret dili rehberi",
  lowStimulation: "Düşük uyaranlı saatler",
  serviceAnimal: "Hizmet hayvanı kabul edilir",
};
const LABEL_EN: Record<keyof AccessibilityFlags, string> = {
  wheelchair: "Wheelchair accessible",
  audioGuide: "Audio guide",
  braille: "Braille signage",
  signLanguage: "Sign-language guide",
  lowStimulation: "Low-sensory hours",
  serviceAnimal: "Service animals welcome",
};

export function AccessibilitySection({
  flags,
  locale,
}: {
  flags: AccessibilityFlags | null;
  locale: "tr" | "en" | "ar" | "ru" | "de";
}) {
  const tc = useTranslations("common");
  if (!flags) return null;
  const labels = locale === "en" ? LABEL_EN : LABEL_TR;
  const items = (Object.keys(flags) as (keyof AccessibilityFlags)[])
    .filter((k) => flags[k])
    .map((k) => ({ key: k, icon: ICON[k], label: labels[k] }));
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 font-display text-base font-semibold">
        {locale === "en" ? "Accessibility" : "Erişilebilirlik"}
      </h3>
      <ul className="grid grid-cols-1 gap-1.5 text-sm">
        {items.map((it) => (
          <li key={it.key} className="flex items-center gap-2">
            <span aria-hidden className="text-base">
              {it.icon}
            </span>
            <span>{it.label}</span>
          </li>
        ))}
      </ul>
      <p className="sr-only">{tc("comingSoon")}</p>
    </div>
  );
}
