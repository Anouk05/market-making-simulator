// A pop-up window with a short explanation of the game.
// Opened with the question-mark button in the top bar. Closes with the
// button, the Escape key, or a click on the dark background.

import { useEffect } from 'react'

interface HelpDialogProps {
  onClose: () => void
}

export function HelpDialog({ onClose }: HelpDialogProps) {
  // Close with the Escape key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={(e) => e.stopPropagation()} // clicks inside the window should not close it
        className="max-h-full w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-slate-900 p-7 text-sm leading-relaxed text-slate-300 shadow-xl ring-1 ring-slate-700"
      >
        <h2 id="help-title" className="text-xl font-semibold text-slate-100">
          How to play
        </h2>

        <Section title="Your role">
          In this game, you are the market maker. Picture a shop that buys and sells Pokémon cards. The owner doesn't
          know exactly what a card is worth, and its price can change. So they buy a little below their estimate and
          sell a little above it. Your task is to do the same for one stock. Your goal is to make a profit while giving
          buyers and sellers someone to trade with at any time.
        </Section>

        <Section title="A round">
          <p className="mb-1.5">Each round works like a day in the shop:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              You see the current price and set two prices: a <Bid>bid</Bid>, the price at which you buy, and an{' '}
              <Ask>ask</Ask>, the price at which you sell. For each, you also choose a size: how many shares.
            </li>
            <li>
              A number of traders arrives. Each trader buys at your ask if they value the stock higher, sells at your
              bid if they value it lower, and otherwise does nothing.
            </li>
            <li>Orders are filled in order of arrival until your size is used up; the rest is cancelled.</li>
            <li>The new price is revealed and your cash, inventory and profit and loss (PnL) are updated.</li>
          </ol>
        </Section>

        <Section title="The traders">
          <p className="mb-1.5">There are two types of traders in this game:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-slate-100">Uninformed traders</span> trade for their own reasons, for
              example because they need cash. They don't know where the price is going.
            </li>
            <li>
              <span className="font-medium text-slate-100">Informed traders</span> know more than you do about where the
              price is going. So they may buy from you just before the price rises, or sell to you just before it falls.
            </li>
          </ul>
          <p className="mb-1.5">You can adjust the share of informed traders in the game settings.</p>
        </Section>

        <Section title="Score">
          At the end of the game any remaining inventory is closed at the final price. Your score is your final PnL. The
          markout in the trades table shows which trades made or lost money.
        </Section>

        <p className="text-xs text-slate-500">Tip: hover over the question marks next to each panel for more detail.</p>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</h3>
      <div>{children}</div>
    </section>
  )
}

const Bid = ({ children }: { children: React.ReactNode }) => (
  <span className="font-medium text-emerald-400">{children}</span>
)
const Ask = ({ children }: { children: React.ReactNode }) => (
  <span className="font-medium text-rose-400">{children}</span>
)
