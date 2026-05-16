'use client'

/** Floating "Print this page" button. Hidden when actually printing
 *  (Tailwind's `print:hidden`), so it doesn't show up on the paper. */
export default function PrintButton() {
  return (
    <div className="print:hidden fixed top-4 right-4 z-10 flex gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-sm border-2 border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] hover:bg-black hover:text-white transition-colors"
      >
        Print this page
      </button>
    </div>
  )
}
