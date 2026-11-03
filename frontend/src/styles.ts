// Shared class names for common style.

// Panels: a 1 px outline with a title strip, a body and an optional footer strip.
export const panel = 'flex flex-col rounded border border-line'
export const panelHeader = 'flex min-h-11 items-center justify-between gap-3 border-b border-line px-4 py-2'
export const panelTitle = 'flex items-center gap-2 text-[15px] font-semibold text-peach'
export const panelFooter = 'mt-auto flex items-center justify-end gap-3 border-t border-line px-4 py-3'

// Buttons, all 44 px tall. Primary: one per view, for the main action.
const button =
  'inline-flex h-11 shrink-0 items-center whitespace-nowrap justify-center rounded border text-[15px] disabled:cursor-not-allowed'
export const buttonPrimary = `${button} gap-3 border-peach bg-peach-tint px-[18px] font-semibold text-peach hover:bg-[#2b3330] disabled:border-disabled-line disabled:bg-transparent disabled:text-disabled`
export const buttonOutline = `${button} border-peach px-[18px] font-bold text-peach hover:bg-peach-tint disabled:border-disabled-line disabled:text-disabled`
export const buttonSecondary = `${button} border-line px-[18px] font-semibold text-fg-soft hover:border-muted hover:text-fg`
export const iconButton = `${button} w-11 border-line font-bold text-fg hover:border-muted`

// Inputs: an underline only, numbers in mono. Add the underline width and colour where used,
// e.g. 'border-b-2 border-teal' for the bid.
export const underlineInput =
  'w-full min-w-0 bg-transparent p-0 font-mono font-medium text-fg outline-none placeholder:text-dim focus:border-peach'
