import Link from "next/link";

const NAV = [
  { href: "/fragrances", label: "Fragrances" },
  { href: "/deals", label: "Deals" },
  { href: "/restocks", label: "Restocks" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="text-lg">🔎</span>
          <span>
            Scent<span className="text-indigo-600 dark:text-indigo-400">Scout</span>
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/search" method="get" className="flex w-full max-w-xl gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search a fragrance or brand — e.g. Santal 33, Creed…"
        aria-label="Search fragrances"
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-indigo-900"
      />
      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Search
      </button>
    </form>
  );
}
