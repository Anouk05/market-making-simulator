// A pop-up window with a short explanation of the game.
// Opened with the question-mark button in the header. Closes with the
// buttons, the Escape key, or a click on the dark background.

import { useEffect } from 'react'

import { buttonPrimary, panelFooter } from '../styles'

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
    <div className="fixed inset-0 z-50 grid place-items-center bg-backdrop/85 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={(e) => e.stopPropagation()} // clicks inside the window should not close it
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[680px] flex-col rounded border border-line bg-ground"
      >
        <DialogHeader id="help-title" title="How to play" onClose={onClose} />

        <div className="min-h-0 space-y-[18px] overflow-y-auto px-6 py-5 text-[15px] leading-relaxed text-[#d8ccc0]">
          <Section title="Your role">
            In this game, you are the market maker. Picture a shop that buys and sells Pokémon cards. The owner doesn't
            know exactly what a card is worth, and its price can change. So they buy a little below their estimate and
            sell a little above it. Your task is to do the same for one stock. Your goal is to make a profit while
            giving buyers and sellers someone to trade with at any time.
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
                <span className="font-semibold text-fg">Uninformed traders</span> trade for their own reasons, for
                example because they need cash. They don't know where the price is going.
              </li>
              <li>
                <span className="font-semibold text-fg">Informed traders</span> know more than you do about where the
                price is going. So they may buy from you just before the price rises, or sell to you just before it
                falls.
              </li>
            </ul>
            <p className="mt-1.5">You can adjust the share of informed traders in the game settings.</p>
          </Section>

          <Section title="Score">
            At the end of the game any remaining inventory is closed at the final price. Your score is your final PnL.
            The markout in the trades table shows which trades made or lost money.
          </Section>

          <p className="text-[13px] text-muted">
            Tip: hover over the question marks next to each panel for more detail.
          </p>
        </div>

        <div className={panelFooter}>
          <button type="button" onClick={onClose} className={buttonPrimary}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

// The title strip of a dialog, with a close button. Also used by the settings window.
export function DialogHeader({ id, title, onClose }: { id: string; title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-6 py-3.5">
      <h2 id={id} className="text-[22px] font-extrabold text-peach">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="grid h-9 w-9 place-items-center rounded border border-line text-lg text-fg-soft hover:border-muted"
      >
        ×
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-[15px] font-semibold text-fg">{title}</h3>
      <div>{children}</div>
    </section>
  )
}

const Bid = ({ children }: { children: React.ReactNode }) => <span className="font-semibold text-teal">{children}</span>
const Ask = ({ children }: { children: React.ReactNode }) => <span className="font-semibold text-pink">{children}</span>
