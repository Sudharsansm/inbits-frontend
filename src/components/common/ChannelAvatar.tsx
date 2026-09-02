import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logoForItem } from "@/lib/channelLogo";
import { cn } from "@/lib/utils";

/**
 * A publisher's real website logo, used wherever a channel/source needs an
 * avatar (post headers, channel rails, the channel page itself). Falls
 * back to a monogram automatically — via Radix's built-in
 * onLoadingStatusChange, not a manual onError flag — if the favicon
 * service has nothing for that domain or the request fails.
 */
export function ChannelAvatar({
  source,
  sampleUrl,
  className,
}: {
  source: string;
  sampleUrl?: string;
  className?: string;
}) {
  const logoUrl = logoForItem(source, sampleUrl, 64);
  return (
    <Avatar className={cn("h-8 w-8 ring-2 ring-paper", className)}>
      {logoUrl && <AvatarImage src={logoUrl} alt="" loading="lazy" />}
      <AvatarFallback className="bg-gradient-to-tr from-primary via-primary/70 to-primary/30 text-[11px] font-black text-primary-foreground">
        {source.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
