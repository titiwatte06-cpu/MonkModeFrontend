function DoveIcon({ className = 'w-6 h-6' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 28c6-8 14-12 24-12 6 0 11 2 15 6" />
      <path d="M17 29c-3 7-3 12 1 17" />
      <path d="M22 41c7-2 14-2 21 0" />
      <path d="M27 18c2 3 4 4 6 5" />
      <path d="M41 24c2 2 3 4 4 7" />
      <path d="M30 23c0 3 0 5 2 7" />
      <circle cx="37" cy="22" r="1.2" fill="#4b5563" />
      <circle cx="45" cy="27" r="1.2" fill="#4b5563" />
      <circle cx="27" cy="30" r="1.2" fill="#4b5563" />
    </svg>
  );
}

export default DoveIcon;
