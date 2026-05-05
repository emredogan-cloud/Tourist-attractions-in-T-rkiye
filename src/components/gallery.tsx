"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import type { AttractionMedia } from "~/types/attraction";

export function Gallery({ media }: { media: AttractionMedia[] }) {
  const tc = useTranslations("common");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (media.length === 0) {
    return (
      <div className="aspect-[16/9] grid place-content-center rounded-xl bg-muted text-muted-foreground">
        ✦
      </div>
    );
  }

  const hero = media[0];
  if (!hero) return null;
  const rest = media.slice(1, 5);

  return (
    <>
      <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-xl md:grid-cols-4">
        <button
          type="button"
          onClick={() => setActiveIndex(0)}
          className="relative aspect-[16/9] overflow-hidden md:col-span-2 md:aspect-auto md:row-span-2"
        >
          <Image
            src={hero.url}
            alt={hero.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover transition hover:scale-105"
          />
        </button>
        {rest.map((m, i) => (
          <button
            type="button"
            key={m.id}
            onClick={() => setActiveIndex(i + 1)}
            className="relative aspect-[3/2] overflow-hidden md:aspect-auto"
          >
            <Image
              src={m.url}
              alt={m.alt}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition hover:scale-105"
            />
          </button>
        ))}
        {media.length > 5 && (
          <button
            type="button"
            onClick={() => setActiveIndex(4)}
            className="relative grid place-content-center bg-secondary text-sm font-medium hover:bg-secondary/80"
            aria-label={tc("showMore")}
          >
            +{media.length - 5}
          </button>
        )}
      </div>

      {activeIndex !== null && media[activeIndex] && (
        <Lightbox images={media} startIndex={activeIndex} onClose={() => setActiveIndex(null)} />
      )}
    </>
  );
}

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: AttractionMedia[];
  startIndex: number;
  onClose: () => void;
}) {
  const tc = useTranslations("common");
  const [index, setIndex] = useState(startIndex);
  const current = images[index];
  if (!current) return null;
  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIndex((i) => (i + 1) % images.length);

  return (
    <dialog
      open
      aria-label="Photo viewer"
      className="fixed inset-0 z-50 flex h-full max-h-none w-full max-w-none items-center justify-center bg-black/90 p-0"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
        aria-label="Previous"
      >
        ‹
      </button>
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <Image
          src={current.url}
          alt={current.alt}
          width={1600}
          height={1067}
          className="max-h-[90vh] w-auto rounded-md object-contain"
        />
        {(current.attribution || current.photographer) && (
          <p className="mt-2 text-center text-xs text-white/70">
            {current.attribution ?? `© ${current.photographer ?? ""} — ${current.license}`}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
        aria-label="Next"
      >
        ›
      </button>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label={tc("close")}
      >
        ✕
      </button>
    </dialog>
  );
}
