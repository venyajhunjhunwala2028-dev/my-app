import Link from "next/link";
import Wordmark from "@/components/brand/Wordmark";
import { CONTAINER } from "./ui";

export const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#safety", label: "Safety" },
  { href: "#learn", label: "Learn" },
  { href: "#families", label: "For families" },
] as const;

/** Editorial top bar: wordmark left, plain anchors in the middle, an underlined "Open the app →" right. */
export default function TopBar() {
  return (
    <header className="relative z-40 bg-background lg:sticky lg:top-0 lg:bg-background/90 lg:backdrop-blur-md">
      <div className={`${CONTAINER} flex flex-wrap items-center justify-between gap-x-8 pt-3 lg:py-3`}>
        <Link href="/" aria-label="Tech Helper home" className="flex min-h-12 items-center rounded-lg">
          <Wordmark size="min(1.6rem, 8vw)" />
        </Link>
        <nav aria-label="Main" className="order-3 -mx-1 w-full border-t border-border lg:order-none lg:mx-0 lg:w-auto lg:border-0">
          <ul className="flex flex-wrap items-center justify-between gap-x-2 text-[0.85rem] font-medium whitespace-nowrap sm:justify-start sm:gap-x-4 sm:text-base lg:gap-x-6">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="inline-flex min-h-12 items-center rounded-lg text-foreground decoration-2 underline-offset-[6px] hover:underline focus-visible:-outline-offset-4 sm:px-2 lg:focus-visible:outline-offset-2"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <Link href="/app" className="link-cta text-base lg:text-lg">
          Open <span className="hidden sm:inline">the</span> app<span aria-hidden="true">→</span>
        </Link>
      </div>
    </header>
  );
}
