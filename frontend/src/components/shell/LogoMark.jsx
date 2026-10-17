/** Square product mark: a shield with a check, drawn inline. */
export default function LogoMark({ className = 'size-7' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="3" className="fill-brand-700" />
      <path
        d="M16 5.5 7.5 9v6.5c0 5.2 3.6 9.6 8.5 11 4.9-1.4 8.5-5.8 8.5-11V9L16 5.5Z"
        className="stroke-white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m12.5 16 2.5 2.5 4.5-5"
        className="stroke-white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
