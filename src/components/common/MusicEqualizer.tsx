/** Tiny three-bar equalizer, bouncing out of phase — the same "this one's
 * making sound" cue Instagram/TikTok show on the audio chip of whichever
 * post is currently playing. Reads at a glance, unlike a static note icon,
 * so a feed full of otherwise-identical music chips still makes clear
 * which single one is actually live right now. `bg-current` means it
 * always matches the surrounding text color (white on the photo scrim on
 * both Home and Updates) without a color prop to keep in sync. */
export function MusicEqualizer({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-3 flex-none items-end gap-[2px] ${className}`}
      aria-hidden="true"
    >
      <span
        className="eq-bar w-[2.5px] rounded-full bg-current"
        style={{ height: "60%", animationDelay: "-0.9s" }}
      />
      <span
        className="eq-bar w-[2.5px] rounded-full bg-current"
        style={{ height: "100%", animationDelay: "-0.5s" }}
      />
      <span
        className="eq-bar w-[2.5px] rounded-full bg-current"
        style={{ height: "80%", animationDelay: "-0.2s" }}
      />
    </span>
  );
}
