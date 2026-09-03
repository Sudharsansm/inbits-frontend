import { ImageOff } from "lucide-react";
import { useRef, useState } from "react";

/**
 * Shown in place of a post's image whenever there genuinely isn't one
 * (some crawled articles have no image at all) or the real image URL
 * fails to load (dead link, hotlink protection, a source that started
 * 404ing after the article was scraped). Sized exactly like the real
 * `<img>` would be via the same `className`, so swapping to/from it never
 * shifts the surrounding layout — and it reads as an intentional empty
 * state (a soft brand-tinted panel with the post's initial) rather than
 * a broken-image icon, which is what every post with a missing image
 * looked like before this.
 */
function ImagePlaceholder({ alt, className = "" }: { alt?: string; className?: string }) {
  const letter = alt?.trim().charAt(0).toUpperCase();
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-secondary ${className}`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
    >
      {letter ? (
        <span className="text-3xl font-black text-primary/40">{letter}</span>
      ) : (
        <ImageOff className="h-7 w-7 text-primary/30" />
      )}
    </div>
  );
}

/**
 * Instagram-style swipeable image set: horizontal snap-scroll with dot
 * indicators. Used wherever a post has more than one photo (see
 * FeedItem.images) — falls back to a single plain <img> everywhere else,
 * so this only ever renders when there's genuinely more than one image.
 *
 * Every slide — single or carousel — falls back to `ImagePlaceholder`
 * instead of a broken image whenever its URL is empty to begin with, or
 * fails to load at runtime (tracked via `onError`, per slide index so one
 * bad photo in a multi-image post doesn't take down the rest).
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
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  const trackRef = useRef<HTMLDivElement>(null);

  const markFailed = (index: number) =>
    setFailed((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== active) setActive(index);
  };

  if (images.length <= 1) {
    const src = images[0];
    if (!src || failed.has(0)) {
      return <ImagePlaceholder alt={alt} className={`w-full ${imgClassName}`} />;
    }
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        className={`w-full ${imgClassName}`}
        onError={() => markFailed(0)}
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
        {images.map((src, i) =>
          !src || failed.has(i) ? (
            <ImagePlaceholder
              key={i}
              alt={alt}
              className={`w-full flex-none snap-center ${imgClassName}`}
            />
          ) : (
            <img
              key={i}
              src={src}
              alt={alt}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
              className={`w-full flex-none snap-center ${imgClassName}`}
              onError={() => markFailed(i)}
            />
          ),
        )}
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
