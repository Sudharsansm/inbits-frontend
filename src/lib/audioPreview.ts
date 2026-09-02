let currentAudio: HTMLAudioElement | null = null;

/** Stops whatever post's music preview is currently playing, if any —
 * called right before a new one starts so scrolling through the feed
 * never stacks multiple tracks on top of each other. */
export function stopOtherPreviews(except?: HTMLAudioElement) {
  if (currentAudio && currentAudio !== except) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (except) currentAudio = except;
}

export function clearActivePreview(audio: HTMLAudioElement) {
  if (currentAudio === audio) currentAudio = null;
}
