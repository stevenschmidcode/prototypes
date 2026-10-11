import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 md:px-6", className)}>{children}</div>;
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  id?: string;
  className?: string;
};

export function SectionHeader({ eyebrow, title, description, action, id, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4", className)}>
      <div className="space-y-1.5">
        {eyebrow && <p className="eyebrow text-terracotta-strong">{eyebrow}</p>}
        <h2 id={id} className="text-2xl font-semibold tracking-[-0.025em] md:text-[1.75rem]">
          {title}
        </h2>
        {description && <p className="max-w-xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1 rounded-full py-2 text-sm font-medium text-forest underline-offset-4 hover:underline"
        >
          {action.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

type PageIntroProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function PageIntro({ eyebrow, title, description, children, className }: PageIntroProps) {
  return (
    <header className={cn("animate-rise space-y-3 pt-8 pb-6 md:pt-12", className)}>
      {eyebrow && <p className="eyebrow text-terracotta-strong">{eyebrow}</p>}
      <h1 className="display text-[2.4rem] md:text-6xl">{title}</h1>
      {description && <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{description}</p>}
      {children}
    </header>
  );
}

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-3xl border border-dashed border-input bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-sand text-forest">{icon}</div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
