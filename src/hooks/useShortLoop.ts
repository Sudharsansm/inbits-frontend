import { useEffect, type RefObject } from "react";
import { SHORT_LOOP_SECONDS } from "@/lib/music";

/**
 * Keeps an <audio> element looping a short, catchy clip from the start of
 * the track instead of playing the whole thing end-to-end — the same
 * "~30 seconds, then loop" pattern Instagram/Reels uses for background
 * music, which is what actually keeps a track feeling like a hook instead
 * of fading into the background. The HTML `loop` attribute alone only
 * restarts at the track's real end (often minutes away), so this steps in
 * with `timeupdate` to jump back to 0 once the clip's window is up —
 * seamless while it's playing, no pause/restart flicker.
 */
export function useShortLoop(audioRef: RefObject<HTMLAudioElement | null>) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      if (audio.currentTime >= SHORT_LOOP_SECONDS) {
        audio.currentTime = 0;
      }
    };
    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => audio.removeEventListener("timeupdate", onTimeUpdate);
  }, [audioRef]);
}
