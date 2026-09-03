import { memo, useEffect, useRef, useState } from "react";
import { ArrowRight, Bookmark, Heart, Music2, Share2, Volume2, VolumeX } from "lucide-react";
import type { FeedItem } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { sourceOriginLabel } from "@/lib/sourceOrigin";
import { trackForItem } from "@/lib/music";
import { useTranslated } from "@/lib/i18n";
import { useArticleViewer } from "@/lib/articleViewer";
import { useShortLoop } from "@/hooks/useShortLoop";
import { ActionBtn } from "@/components/updates/ActionBtn";
import { ImageCarousel } from "@/components/common/ImageCarousel";
import { MusicEqualizer } from "@/components/common/MusicEqualizer";

function UpdateReelInner({
  post: p,
  isLiked,
  isSaved,
  burstKey,
  active,
  muted,
  onDoubleTap,
  onToggleLike,
  onToggleSave,
  onShare,
  onToggleMute,
}: {
  post: FeedItem;
  isLiked?: boolean;
  isSaved?: boolean;
  burstKey: number;
  /** Whether this reel is the one currently in view — only the active
   * reel's track plays, same as Instagram only ever plays one audio track
   * at a time as you scroll through Reels. */
  active: boolean;
  /** Shared mute state across every reel — tapping the speaker on any one
   * reel mutes/unmutes all of them, matching how Instagram's mute
   * preference carries forward as you keep scrolling. */
  muted: boolean;
  onDoubleTap: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  onToggleMute: () => void;
}) {
  const { track, category } = trackForItem(p);
  const { openArticle } = useArticleViewer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [trackFailed, setTrackFailed] = useState(false);
  const [title, excerpt] = useTranslated([p.title, p.excerpt]);
  useShortLoop(audioRef);
  const readPost = () =>
    // Full item, already loaded in full here — see PostCard's readPost
    // for why this (not a trimmed id/title/source/sourceUrl) is what
    // makes /post/:id open instantly.
    openArticle(p);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (active) {
      // Browsers allow autoplay unconditionally when muted; play() can
      // still reject (e.g. slow network) — that's fine, just no sound.
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [active]);

  return (
    <section
      className="flex h-full w-full snap-start snap-always items-center justify-center bg-paper select-none"
      onClick={onDoubleTap}
    >
      <div className="relative aspect-[9/16] w-full max-w-full h-auto max-h-full overflow-hidden md:max-w-[420px]">
        {!trackFailed && (
          <audio
            ref={audioRef}
            src={track.src}
            loop
            muted={muted}
            playsInline
            preload="none"
            onError={() => setTrackFailed(true)}
          />
        )}
        <ImageCarousel
          images={p.images.length > 0 ? p.images : [p.image]}
          alt={p.title}
          className="h-full w-full"
          imgClassName="h-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />

        {/* Double-tap heart burst */}
        {burstKey > 0 && (
          <div
            key={burstKey}
            className="pointer-events-none absolute inset-0 z-30 grid place-items-center"
          >
            <Heart className="instagram-heart-burst h-32 w-32 fill-white text-white" />
          </div>
        )}

        {/* Right-side action rail */}
        <div
          className="absolute right-3 bottom-5 z-20 flex flex-col items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <ActionBtn onClick={onToggleLike} label="Like">
            <Heart
              className={`h-4 w-4 transition-transform duration-150 ${
                isLiked ? "fill-primary text-primary" : ""
              }`}
            />
          </ActionBtn>
          <ActionBtn onClick={onToggleSave} label="Save">
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-white" : ""}`} />
          </ActionBtn>
          <ActionBtn onClick={onShare} label="Share">
            <Share2 className="h-4 w-4" />
          </ActionBtn>
          {!trackFailed && (
            <ActionBtn onClick={onToggleMute} label={muted ? "Unmute" : "Mute"}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </ActionBtn>
          )}
          <ActionBtn onClick={readPost} label="Read">
            <ArrowRight className="h-4 w-4" />
          </ActionBtn>
        </div>

        <div
          className="absolute inset-x-0 bottom-0 z-10 space-y-3 p-5 pr-20 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]">
            <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
              {p.category}
            </span>
            <span className="text-white/80">
              {p.source} · {formatRelativeTime(p.publishedAt)}
              {sourceOriginLabel(p.location, p.language) && (
                <> · {sourceOriginLabel(p.location, p.language)}</>
              )}
            </span>
          </div>
          <button onClick={readPost} className="block text-left">
            <h2 className="serif text-2xl font-bold leading-tight drop-shadow-md">{title}</h2>
          </button>
          <p className="line-clamp-3 text-sm leading-relaxed text-white/90">{excerpt}</p>
          <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-white/75">
            <span>
              By {p.author} · {p.readTime} min read
            </span>
            {!trackFailed && (
              <span className="inline-flex min-w-0 items-center gap-1 text-white/80">
                {active ? <MusicEqualizer /> : <Music2 className="h-3 w-3 flex-none" />}
                <span className="truncate">
                  {category} · {track.title} — {track.artist}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Only the active reel actually plays/animates, but every mounted reel
// still re-renders on unrelated state changes (scroll-driven `active`
// recalculation, toast state, share-sheet open/close) without this —
// memoizing keeps a reel's re-render tied to its own props actually
// changing, same reasoning as PostCard.
export const UpdateReel = memo(UpdateReelInner);
