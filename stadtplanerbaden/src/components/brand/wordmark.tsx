import { cn } from "@/lib/utils";

/** Wortmarke «baden.» – der Punkt in Terracotta. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-heading font-semibold tracking-[-0.04em] leading-none", className)}>
      baden<span className="text-terracotta">.</span>
    </span>
  );
}
