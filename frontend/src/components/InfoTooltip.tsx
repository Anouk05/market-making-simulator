// A small circle with a question mark. Hovering over it (or focusing it with
// the Tab key) shows an explanation in a small window.
//
// The window uses `position: fixed`, measured from the question mark when it
// opens. That way it is never cut off by a scrolling box around it (like the
// settings window), and it is kept inside the screen: it opens below the
// question mark, or above it when there is not enough room below.

import { useRef, useState } from 'react'

interface InfoTooltipProps {
  text: string
}

const WIDTH = 320 // px, width of the explanation window
const GAP = 8 // px, space between the question mark and the window
const MARGIN = 8 // px, minimum distance to the edge of the screen

export function InfoTooltip({ text }: InfoTooltipProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ left: number; top?: number; bottom?: number } | null>(null)

  function show() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    // Centre under the question mark, but keep the window inside the screen.
    const centre = rect.left + rect.width / 2
    const left = Math.min(Math.max(centre - WIDTH / 2, MARGIN), window.innerWidth - WIDTH - MARGIN)
    // Open below if there is room for the text, otherwise above.
    const roomBelow = window.innerHeight - rect.bottom
    if (roomBelow > 260) setPosition({ left, top: rect.bottom + GAP })
    else setPosition({ left, bottom: window.innerHeight - rect.top + GAP })
  }

  const hide = () => setPosition(null)

  return (
    <span className="inline-flex align-middle">
      <button
        ref={buttonRef}
        type="button" // not "submit": clicking it must not submit the form
        aria-label="More information"
        onClick={(e) => e.preventDefault()} // inside a <label>, don't jump to the input
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="grid h-[22px] w-[22px] place-items-center rounded-full border border-dim text-xs font-semibold leading-none text-muted hover:border-muted hover:text-fg"
      >
        ?
      </button>
      {position && (
        <span
          role="tooltip"
          style={{ position: 'fixed', width: WIDTH, ...position }}
          className="pointer-events-none z-[100] rounded border border-line bg-raised px-3.5 py-3 text-sm font-normal normal-case leading-relaxed tracking-normal text-[#e4d8cb]"
        >
          {text}
        </span>
      )}
    </span>
  )
}
