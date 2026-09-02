import { X, Link2, Check, Share2 } from "lucide-react";
import { ShareOption } from "@/components/updates/ShareOption";

export function ShareSheet({
  post,
  onClose,
  onToast,
}: {
  post: { id: string; title: string; excerpt: string };
  onClose: () => void;
  onToast: (m: string) => void;
}) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/post/${post.id}`
      : `/post/${post.id}`;
  const text = `${post.title} — via InBits`;

  const openWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
    onClose();
  };
  const openLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
    onClose();
  };
  const shareVia = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt, url });
        onClose();
        return;
      } catch {
        /* cancelled */
      }
    }
    onToast("Sharing not supported — link copied");
    await copy();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      onToast("Link copied");
    } catch {
      onToast("Could not copy");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[440px] rounded-t-3xl bg-paper p-5 text-ink shadow-2xl animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="serif text-lg font-bold">Share</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 pb-2">
          <ShareOption color="#25D366" label="WhatsApp" onClick={openWhatsApp}>
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" aria-hidden>
              <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.09.55 4.13 1.6 5.93L0 24l6.34-1.66a11.9 11.9 0 0 0 5.7 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.42-8.41ZM12.05 21.5h-.01a9.6 9.6 0 0 1-4.9-1.34l-.35-.21-3.76.98 1-3.66-.23-.38a9.55 9.55 0 0 1-1.47-5.09c0-5.29 4.31-9.6 9.62-9.6 2.57 0 4.98 1 6.8 2.82a9.53 9.53 0 0 1 2.82 6.8c0 5.3-4.32 9.68-9.52 9.68Zm5.5-7.19c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.68-2.09-.18-.3-.02-.46.13-.6.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.24-.24-.58-.48-.5-.68-.51l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.51 0 1.48 1.08 2.91 1.23 3.11.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.13-.28-.2-.58-.35Z" />
            </svg>
          </ShareOption>
          <ShareOption color="#0A66C2" label="LinkedIn" onClick={openLinkedIn}>
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" aria-hidden>
              <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5.001ZM3 9h4v12H3V9Zm7 0h3.8v1.71h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.35c0-1.28-.02-2.93-1.78-2.93-1.79 0-2.06 1.39-2.06 2.83V21h-4V9Z" />
            </svg>
          </ShareOption>
          <ShareOption color="hsl(var(--primary))" label="Share via" onClick={shareVia}>
            <Share2 className="h-6 w-6 text-white" />
          </ShareOption>
          <ShareOption color="#1f2937" label="Copy link" onClick={copy}>
            <Link2 className="h-6 w-6 text-white" />
          </ShareOption>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
          <Check className="h-4 w-4 text-primary" />
          <span className="truncate">{url}</span>
        </div>
      </div>
    </div>
  );
}
