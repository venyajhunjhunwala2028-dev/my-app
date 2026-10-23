import Link from "next/link";
import Mascot from "@/components/Mascot";

export default function TopBar() {
  return (
    <header className="z-40 border-b border-border/60 bg-background/90 backdrop-blur sm:sticky sm:top-0">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-0 px-4 py-2">
        <Link href="/" className="flex min-h-12 items-center gap-2 rounded-xl text-lg font-extrabold text-foreground sm:text-xl">
          <Mascot size={2} animate={false} />
          Tech Helper
        </Link>
        <nav aria-label="Main" className="order-3 w-full sm:order-none sm:w-auto">
          <ul className="-ml-3 flex items-center gap-1 text-base font-semibold sm:ml-0">
            <li>
              <a href="#how-it-works" className="inline-flex min-h-12 items-center rounded-xl px-3 text-foreground hover:bg-lavender">
                How it works
              </a>
            </li>
            <li>
              <a href="#safety" className="inline-flex min-h-12 items-center rounded-xl px-3 text-foreground hover:bg-lavender">
                Safety
              </a>
            </li>
          </ul>
        </nav>
        <Link href="/app" className="btn-primary min-h-12 w-auto px-4 text-base sm:px-5">
          Open app
        </Link>
      </div>
    </header>
  );
}
