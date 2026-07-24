import Link from "next/link";

const NAV = [
  { href: "/fragrances", label: "Fragrances" },
  { href: "/deals", label: "Deals" },
  { href: "/restocks", label: "Restocks" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-baseline gap-6 px-6 py-5">
        <Link href="/" className="font-display text-2xl leading-none tracking-tight text-ink">
          Scent<span className="italic text-accent">Scout</span>
        </Link>
        <nav className="ml-auto flex items-baseline gap-6 text-[13px]">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-muted transition-colors hover:text-ink">
              {n.label}
            </Link>
          ))}
          <Link
            href="/account"
            className="border-b border-accent/40 pb-0.5 text-accent transition-colors hover:border-accent"
          >
            Account
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/search" method="get" className="flex w-full max-w-xl items-stretch">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search a fragrance or house — Santal 33, Creed…"
        aria-label="Search fragrances"
        className="w-full border-b border-line-strong bg-transparent px-1 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
      />
      <button
        type="submit"
        className="ml-4 shrink-0 border-b border-accent px-2 py-3 text-[13px] uppercase tracking-[0.12em] text-accent transition-colors hover:text-accent-strong"
      >
        Search
      </button>
    </form>
  );
}
