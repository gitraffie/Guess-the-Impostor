export default function PlayerAvatar({ color = '#1b1b1b', size = 36 }) {
  return (
    <svg
      className="player-avatar"
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="visor-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d7f2ff" />
          <stop offset="100%" stopColor="#7cc7ff" />
        </linearGradient>
      </defs>

      <ellipse cx="40" cy="70" rx="18" ry="4" fill="rgba(0, 0, 0, 0.18)" />

      <circle cx="40" cy="30" r="18" fill={color} />
      <rect x="20" y="22" width="40" height="18" rx="9" fill="url(#visor-gradient)" />

      <ellipse cx="40" cy="55" rx="18" ry="14" fill={color} />

      <rect x="16" y="48" width="10" height="10" rx="5" fill={color} />
      <rect x="54" y="48" width="10" height="10" rx="5" fill={color} />

      <rect x="28" y="66" width="10" height="8" rx="4" fill={color} />
      <rect x="42" y="66" width="10" height="8" rx="4" fill={color} />
    </svg>
  );
}
