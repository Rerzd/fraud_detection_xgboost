/** Renders `code` spans written with backticks in backend text. */
export default function RichText({ text }) {
  return text.split(/`([^`]+)`/).map((part, i) =>
    i % 2 ? (
      <code key={i} className="rounded-xs border border-line bg-subtle px-1 font-mono text-[0.9em] text-ink">
        {part}
      </code>
    ) : (
      part
    ),
  )
}
