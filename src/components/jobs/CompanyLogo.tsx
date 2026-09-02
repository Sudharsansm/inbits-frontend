import { useState } from "react";

/**
 * Company logo with a real fallback: several of these listings' logo
 * URLs 404 or get blocked by the source site's hotlink protection. Just
 * rendering `<img src={logoUrl}>` left a broken-image icon sitting over
 * the initials in that case — this swaps to the initials the moment the
 * image actually fails to load, instead of only checking whether a URL
 * string was present.
 */
export function CompanyLogo({
  logoUrl,
  initials,
  size = "h-12 w-12",
  textSize = "text-xs",
}: {
  logoUrl: string;
  initials: string;
  size?: string;
  textSize?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = logoUrl && !failed;

  return (
    <div
      className={`grid ${size} flex-none place-items-center overflow-hidden rounded-full bg-secondary ${textSize} font-bold text-secondary-foreground`}
    >
      {showImage ? (
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}