export function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M7 4.75 12.25 10 7 15.25"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.8"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle
        cx="8.75"
        cy="8.75"
        r="4.75"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
      />
      <path
        d="M12.5 12.5 16 16"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-width="1.7"
      />
    </svg>
  );
}

export function ArrowTrendIcon({ positive }: { positive: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d={positive ? "M4.5 12.5 9 8l3 3 3.5-4" : "M4.5 7.5 9 12l3-3 3.5 4"}
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.85"
      />
    </svg>
  );
}
