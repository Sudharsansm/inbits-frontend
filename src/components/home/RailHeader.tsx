import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function RailHeader({
  title,
  subtitle,
  to,
  cta,
}: {
  title: string;
  subtitle: string;
  to: string;
  cta: string;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3 px-4">
      <div className="min-w-0">
        <h3 className="serif text-xl font-bold leading-tight">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Link to={to} aria-label={cta} className="mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary">
        <ArrowRight className="h-5 w-5" />
      </Link>
    </div>
  );
}
