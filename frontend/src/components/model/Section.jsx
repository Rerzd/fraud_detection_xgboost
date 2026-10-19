/** One section of the model card document: a ruled uppercase heading, then the content. */
export default function Section({ id, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16">
      <h2
        id={`${id}-title`}
        tabIndex={-1}
        className="mb-3 border-b border-line-strong pb-1.5 text-xs font-semibold tracking-wider text-ink-muted uppercase focus:outline-none"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
