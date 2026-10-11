import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-6 -ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:mt-8"
    >
      <ArrowLeft className="size-4" aria-hidden /> {label}
    </Link>
  );
}
