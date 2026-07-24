import type { ReactNode } from "react";

/** Shared layout for long-form policy pages. */
export function Prose({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-4 font-display text-[2.75rem] leading-tight text-ink">{title}</h1>
      <p className="mt-3 text-xs text-faint">Last updated {updated}</p>
      <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-body [&_a]:text-accent [&_a]:underline-offset-2 hover:[&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-ink [&_li]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
