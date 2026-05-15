import Link from 'next/link'
import { Gear } from './Ornament'

/**
 * Global top navigation. Server component.
 *
 * Bold steampunk: dark mahogany ground with brass-deep border, brass
 * wordmark with a slowly-turning gear. Cinzel small caps everywhere.
 */
export default function TopNav() {
  return (
    <nav className="w-full border-b-2 border-brass-deep bg-background sticky top-0 z-30 shadow-[0_2px_12px_oklch(0_0_0/0.4)]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-cream hover:text-brass-glow transition-colors"
        >
          <Gear
            teeth={10}
            className="h-6 w-6 text-brass-glow animate-turn-slow drop-shadow-[0_0_6px_oklch(0.86_0.16_88/0.5)]"
          />
          <span
            className="text-base font-bold uppercase"
            style={{
              fontFamily: 'var(--font-cinzel)',
              letterSpacing: '0.22em',
              color: 'oklch(0.95 0.06 85)',
              textShadow: '0 0 8px oklch(0.74 0.14 80 / 0.4)',
            }}
          >
            Strata Mundo
          </span>
        </Link>

        <ul
          className="flex items-center gap-1 text-xs"
          style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.18em' }}
        >
          <NavLink href="/" label="Home" />
          <NavLink href="/vision" label="Vision" />
          <NavLink href="/resume" label="My voyage" />
          <NavLink href="/contribute" label="Contribute" />
          <NavLink href="/methodology" label="Methods" />
          <NavLink href="/feedback" label="Help us improve" />
          <li>
            <Link
              href="/search"
              aria-label="Search activities, standards, and contributors"
              className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-brass-deep/60 text-cream hover:text-brass-glow hover:border-brass transition-colors ml-1"
            >
              <SearchGlyph className="h-4 w-4" />
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="px-3 py-1.5 uppercase text-cream hover:text-brass-glow hover:underline hover:decoration-brass hover:decoration-1 hover:underline-offset-4 transition-colors"
      >
        {label}
      </Link>
    </li>
  )
}

/** Steampunk-styled magnifying glass — single-stroke, no decorative noise. */
function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="7" cy="7" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  )
}
