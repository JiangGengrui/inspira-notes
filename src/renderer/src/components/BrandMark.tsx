export function BrandMark({ size = 18 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 1.6c.64 5.2 2.52 8.06 8.4 8.4-5.88.34-7.76 3.2-8.4 8.4-.64-5.2-2.52-8.06-8.4-8.4 5.88-.34 7.76-3.2 8.4-8.4Z"
        fill="currentColor"
      />
      <circle cx="18.9" cy="18.3" r="1.35" fill="currentColor" opacity="0.5" />
    </svg>
  )
}
