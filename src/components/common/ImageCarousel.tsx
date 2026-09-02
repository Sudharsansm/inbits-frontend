import { useRef, useState } from "react";

/**
 * Instagram-style swipeable image set: horizontal snap-scroll with dot
 * indicators. Used wherever a post has more than one photo (see
 * FeedItem.images) — falls back to a single plain <img> everywhere else,
 * so this only ever renders when there's genuinely more than one image.
 */
export function ImageCarousel({
  images,
  alt = "",
  className = "",
  imgClassName = "",
}: {
  images: string[];
  alt?: string;
  className?: string;
  imgClassName?: string;
}) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== active) setActive(index);
  };

  if (images.length <= 1) {
    return (
      <img
        src={images[0]}
        alt={alt}
        loading="lazy"
        draggable={false}
        className={`w-full ${imgClassName}`}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="scrollbar-none flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={alt}
            loading={i === 0 ? "eager" : "lazy"}
            draggable={false}
            className={`w-full flex-none snap-center ${imgClassName}`}
          />
        ))}
      </div>

      {/* Position pill, Instagram-style */}
      <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
        {active + 1}/{images.length}
      </span>

      {/* Dot indicators */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-3 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
