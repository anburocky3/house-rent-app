"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type BeforeHandoverSliderProps = {
  propertyId?: string;
  imageUrls?: string[];
};

export default function BeforeHandoverSlider({
  propertyId,
  imageUrls,
}: BeforeHandoverSliderProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideNumberRef = useRef<HTMLSpanElement | null>(null);

  const safePropertyId = propertyId?.trim() || "UNKNOWN_PROPERTY";
  const fallbackImages = Array.from({ length: 8 }, (_, index) => {
    const imageNumber = index + 1;
    return {
      src: `/${safePropertyId}/${imageNumber}.jpeg`,
      alt: `House condition before key handover - photo ${imageNumber}`,
    };
  });
  const customImages = (imageUrls || [])
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      src: url,
      alt: `House condition before key handover - photo ${index + 1}`,
    }));
  const beforeHandoverImages =
    customImages.length > 0 ? customImages : fallbackImages;

  const moveToSlide = (index: number) => {
    const container = sliderRef.current;
    if (!container) {
      return;
    }

    const safeIndex = Math.max(
      0,
      Math.min(index, beforeHandoverImages.length - 1),
    );
    setActiveSlide(safeIndex);
    container.scrollTo({
      left: container.clientWidth * safeIndex,
      behavior: "smooth",
    });
  };

  const onSliderScroll = () => {
    const container = sliderRef.current;
    if (!container || container.clientWidth === 0) {
      return;
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const nextIndex = Math.round(
        container.scrollLeft / container.clientWidth,
      );
      setActiveSlide((currentSlide) =>
        currentSlide === nextIndex ? currentSlide : nextIndex,
      );
    }, 90);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    slideNumberRef.current?.animate(
      [
        { opacity: 0, transform: "translateY(3px)" },
        { opacity: 1, transform: "translateY(0px)" },
      ],
      {
        duration: 180,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
  }, [activeSlide]);

  const onSliderScrollEnd = () => {
    const container = sliderRef.current;
    if (!container || container.clientWidth === 0) {
      return;
    }

    const nextIndex = Math.round(container.scrollLeft / container.clientWidth);
    setActiveSlide((currentSlide) =>
      currentSlide === nextIndex ? currentSlide : nextIndex,
    );
  };

  return (
    <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
          Before handover photos
        </p>
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <span
            ref={slideNumberRef}
            className="inline-flex min-w-[2ch] justify-end tabular-nums"
          >
            {activeSlide + 1}
          </span>
          /{beforeHandoverImages.length}
        </span>
      </div>

      <div
        ref={sliderRef}
        onScroll={onSliderScroll}
        onScrollEnd={onSliderScrollEnd}
        className="mt-3 flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {beforeHandoverImages.map((image, index) => (
          <figure
            key={image.src}
            className="relative h-56 w-full shrink-0 snap-center overflow-hidden rounded-2xl border border-zinc-300 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 420px"
              className="object-cover"
            />
          </figure>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => moveToSlide(activeSlide - 1)}
          disabled={activeSlide === 0}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          aria-label="Previous photo"
        >
          ←
        </button>

        <div className="flex items-center gap-1.5">
          {beforeHandoverImages.map((image, index) => (
            <button
              key={`${image.src}-dot`}
              type="button"
              onClick={() => moveToSlide(index)}
              className={`h-2.5 rounded-full transition ${
                index === activeSlide
                  ? "w-6 bg-zinc-900 dark:bg-zinc-100"
                  : "w-2.5 bg-zinc-400 dark:bg-zinc-600"
              }`}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => moveToSlide(activeSlide + 1)}
          disabled={activeSlide === beforeHandoverImages.length - 1}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          aria-label="Next photo"
        >
          →
        </button>
      </div>
    </section>
  );
}
