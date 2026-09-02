
import { memo, useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Heart,
  MoreHorizontal,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";

import type { FeedItem } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { useSavedPosts } from "@/lib/savedPosts";
import { useArticleViewer } from "@/lib/articleViewer";
import { ImageCarousel } from "@/components/common/ImageCarousel";
import { ChannelAvatar } from "@/components/common/ChannelAvatar";
import { trackForItem } from "@/lib/music";
import {
  stopOtherPreviews,
  clearActivePreview,
} from "@/lib/audioPreview";
import { useShortLoop } from "@/hooks/useShortLoop";
import { MusicEqualizer } from "@/components/common/MusicEqualizer";
import {
  useHomeMuted,
  toggleHomeMuted,
} from "@/lib/muteStore";
import { useInterestProfile } from "@/lib/interests";
import { sourceOriginLabel } from "@/lib/sourceOrigin";
import { useTranslated } from "@/lib/i18n";

function PostCardInner({ post }: { post: FeedItem }) {
  const { openArticle } = useArticleViewer();

  const publishedLabel = formatRelativeTime(post.publishedAt);

  const { has, toggleSave } = useSavedPosts();
  const saved = has(post.id);

  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [burst, setBurst] = useState(false);

  const { recordLike } = useInterestProfile();

  const tapRef = useRef<{
    time: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({
    time: 0,
    timer: null,
  });

  /*
   * ------------------------------------------------------------
   * MUSIC
   * ------------------------------------------------------------
   */

  const { track, category } = trackForItem(post);

  const mediaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [playing, setPlaying] = useState(false);
  const [trackFailed, setTrackFailed] = useState(false);

  /*
   * Global Home mute state.
   *
   * This is shared by all Home posts, so when the user unmutes
   * one post, the other Home posts use the same mute state.
   */
  const homeMuted = useHomeMuted();

  /*
   * Keep the short music-loop behavior used by Updates.
   */
  useShortLoop(audioRef);

  /*
   * ------------------------------------------------------------
   * MUSIC AUTO PLAY
   * ------------------------------------------------------------
   *
   * Same behavior as UpdateReel:
   *
   * - When this post becomes visible -> play
   * - When it leaves the viewport -> pause + reset
   * - Stop another post before playing
   * - Autoplay rejection is NOT treated as a broken track
   */

  useEffect(() => {
    const audio = audioRef.current;
    const element = mediaRef.current;

    if (!audio || !element || trackFailed) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          /*
           * Stop any other Home post's music.
           */
          stopOtherPreviews(audio);

          /*
           * Use the current global mute state before playback.
           */
          audio.muted = homeMuted;

          /*
           * Start from the beginning when the post becomes active.
           */
          audio.currentTime = 0;

          /*
           * Same principle as UpdateReel:
           * play failure does not mean the audio file is broken.
           */
          audio
            .play()
            .then(() => {
              setPlaying(true);
            })
            .catch(() => {
              setPlaying(false);
            });
        } else {
          /*
           * Post is no longer visible.
           */
          audio.pause();
          audio.currentTime = 0;
          setPlaying(false);
        }
      },
      {
        threshold: 0.6,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();

      audio.pause();
      audio.currentTime = 0;
    };
  }, [trackFailed, homeMuted]);

  /*
   * ------------------------------------------------------------
   * SYNCHRONIZE MUTE STATE
   * ------------------------------------------------------------
   *
   * When the user taps mute/unmute on one Home post, update the
   * actual audio element immediately.
   */

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.muted = homeMuted;
  }, [homeMuted]);

  /*
   * ------------------------------------------------------------
   * CLEANUP
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      if (audio) {
        audio.pause();
        clearActivePreview(audio);
      }
    };
  }, []);

  /*
   * ------------------------------------------------------------
   * ARTICLE
   * ------------------------------------------------------------
   */

  const readPost = () => {
    openArticle({
      id: post.id,
      title: post.title,
      source: post.source,
      sourceUrl: post.sourceUrl,
    });
  };

  /*
   * ------------------------------------------------------------
   * TRANSLATION
   * ------------------------------------------------------------
   */

  const [title, excerpt] = useTranslated([
    post.title,
    post.excerpt,
  ]);

  /*
   * ------------------------------------------------------------
   * MEDIA CLICK / DOUBLE TAP
   * ------------------------------------------------------------
   */

  const onMediaClick = () => {
    const now = Date.now();

    /*
     * Double tap = Like
     */
    if (now - tapRef.current.time < 300) {
      if (tapRef.current.timer) {
        clearTimeout(tapRef.current.timer);
      }

      tapRef.current.timer = null;
      tapRef.current.time = 0;

      setLiked(true);

      recordLike(
        post.category,
        post.source,
      );

      setBurst(true);

      setTimeout(() => {
        setBurst(false);
      }, 700);

      return;
    }

    /*
     * Single tap = open article.
     */
    tapRef.current.time = now;

    tapRef.current.timer = setTimeout(() => {
      tapRef.current.timer = null;
      readPost();
    }, 300);
  };

  /*
   * ------------------------------------------------------------
   * SHARE
   * ------------------------------------------------------------
   */

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/post/${post.id}`
      : "";

  const share = async () => {
    if (
      typeof navigator !== "undefined" &&
      (navigator as any).share
    ) {
      try {
        await (navigator as any).share({
          title: post.title,
          text: post.excerpt,
          url: shareUrl,
        });
      } catch {
        /*
         * User cancelled share.
         */
      }

      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      /*
       * Clipboard unavailable.
       */
    }
  };

  return (
    <article className="feed-card w-full border-b border-border bg-paper">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <ChannelAvatar
          source={post.source}
          sampleUrl={post.sourceUrl}
        />

        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight">
            {post.source}
          </div>

          <div className="text-[10px] text-muted-foreground">
            {post.category} · {publishedLabel}

            {sourceOriginLabel(
              post.location,
              post.language,
            ) && (
              <>
                {" · "}
                {sourceOriginLabel(
                  post.location,
                  post.language,
                )}
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label="More"
          className="rounded-full p-1.5 hover:bg-secondary"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </header>

      {/* ========================================================
          MEDIA
      ======================================================== */}

      <div
        role="link"
        tabIndex={0}
        onClick={onMediaClick}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            readPost();
          }
        }}
        className="block cursor-pointer select-none"
      >
        <div
          ref={mediaRef}
          className="relative w-full"
        >

          {/* ====================================================
              AUDIO

              This follows the same audio configuration as
              UpdateReel.tsx.
          ==================================================== */}

          {!trackFailed && (
            <audio
              ref={audioRef}
              src={track.src}
              loop
              muted={homeMuted}
              playsInline
              preload="none"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onError={() => setTrackFailed(true)}
            />
          )}

          {/* ====================================================
              IMAGE
          ==================================================== */}

          <ImageCarousel
            images={
              post.images.length > 0
                ? post.images
                : [post.image]
            }
            imgClassName="aspect-square object-cover"
          />

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

          {/* ====================================================
              DOUBLE-TAP HEART
          ==================================================== */}

          {burst && (
            <div
              key="heart-burst"
              className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
            >
              <Heart className="instagram-heart-burst h-24 w-24 fill-white text-white" />
            </div>
          )}

          {/* ====================================================
              RIGHT-SIDE MUSIC CONTROL

              This is the important part.

              Updates uses a right-side action rail.
              Home now uses the same pattern for mute/unmute.

              z-30 keeps it above the image and caption.
              h-10/w-10 makes it easy to see and tap on mobile.
          ==================================================== */}

          {!trackFailed && (
            <div
              className="
                absolute
                right-3
                bottom-4
                z-30
                flex
                flex-col
                items-center
              "
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  toggleHomeMuted();
                }}
                aria-label={
                  homeMuted
                    ? "Unmute"
                    : "Mute"
                }
                title={
                  homeMuted
                    ? "Unmute"
                    : "Mute"
                }
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/20
                  bg-black/55
                  text-white
                  shadow-md
                  backdrop-blur-md
                  transition
                  hover:bg-black/70
                  active:scale-90
                "
              >
                {homeMuted ? (
                  <VolumeX
                    className="h-4 w-4"
                    strokeWidth={2}
                  />
                ) : (
                  <Volume2
                    className="h-4 w-4"
                    strokeWidth={2}
                  />
                )}
              </button>
            </div>
          )}

          {/* ====================================================
              OVERLAY CAPTION
          ==================================================== */}

          <div
            className="
              absolute
              inset-x-0
              bottom-0
              z-10
              space-y-1
              p-3
              pr-16
              text-white
            "
            onClick={(event) => {
              /*
               * Don't let clicking the caption trigger the
               * media double-tap handler.
               */
              event.stopPropagation();
            }}
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]">
              <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
                {post.category}
              </span>

              <span className="text-white/85">
                {post.source} · {publishedLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={readPost}
              className="block w-full text-left"
            >
              <h2 className="serif line-clamp-3 text-[20px] font-bold leading-[1.2] tracking-[-0.01em] text-white/95 drop-shadow-md sm:text-[22px] sm:leading-[1.2]">
                {title}
              </h2>
            </button>

            <p  className=" line-clamp-2 text-[12px] leading-[1.45] text-white/90 sm:text-[13px] sm:leading-[1.5]">
              {excerpt}
            </p>

            {/* ==================================================
                MUSIC INFORMATION
            ================================================== */}

            <div className="flex items-center justify-between gap-2 pt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/70">
              <span className="min-w-0 truncate">
                {post.author} · {post.readTime} min read
              </span>

              {!trackFailed && (
                <span
                  className="
                    inline-flex
                    min-w-0
                    max-w-[48%]
                    shrink-0
                    items-center
                    gap-1
                    text-white/80
                  "
                >
                  {playing ? (
                    <MusicEqualizer />
                  ) : null}

                  <span className="truncate">
                    {category} · {track.title} — {track.artist}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          ACTION BAR
      ======================================================== */}

      <div className="flex items-center gap-4 px-3 py-2">

        {/* Like */}
        <button
          type="button"
          onClick={() => {
            setLiked((value) => {
              if (!value) {
                recordLike(
                  post.category,
                  post.source,
                );
              }

              return !value;
            });
          }}
          aria-label="Like"
          className={`like-button transition active:scale-90 ${
            liked ? "is-liked" : ""
          }`}
        >
          <Heart
            className={`h-5 w-5 transition-transform duration-150 ${
              liked ? "fill-primary text-primary" : ""
            }`}
          />
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={share}
          aria-label={
            copied
              ? "Link copied"
              : "Share"
          }
          className="transition active:scale-90"
        >
          <Share2 className="h-5 w-5" />
        </button>

        {/* Save */}
        <button
          type="button"
          onClick={() => toggleSave(post.id)}
          aria-label="Save"
          className="ml-auto transition active:scale-90"
        >
          <Bookmark
            className={`h-5 w-5 ${
              saved
                ? "fill-ink text-ink"
                : ""
            }`}
          />
        </button>
      </div>
    </article>
  );
}

export const PostCard = memo(PostCardInner);
