export default function BearAvatar({ color = '#1b1b1b', size = 80, name = 'Player', glowing = false }) {
  const id = `bear-${color.replace('#', '')}-${size}`;
  const darkColor = color === '#1b1b1b' ? '#111' : color;

  return (
    <svg
      className="player-avatar"
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label={`Bear avatar for ${name}`}
      style={{
        filter: glowing
          ? `drop-shadow(0 0 8px ${color}88) drop-shadow(0 0 16px ${color}44)`
          : 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))'
      }}
    >
      <defs>
        <linearGradient id={`${id}-visor`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f7ff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#5cb8ff" stopOpacity="0.85" />
        </linearGradient>

        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={darkColor} stopOpacity="1" />
        </linearGradient>

        <radialGradient id={`${id}-head`} cx="45%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#fde9c8" />
          <stop offset="100%" stopColor="#e8c28a" />
        </radialGradient>

        <radialGradient id={`${id}-ear-inner`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5c5a0" />
          <stop offset="100%" stopColor="#d9956a" />
        </radialGradient>

        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.7" />
          <stop offset="60%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        <radialGradient id={`${id}-nose`} cx="40%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#8a5c42" />
          <stop offset="100%" stopColor="#4a2e1e" />
        </radialGradient>

        <radialGradient id={`${id}-shadow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <ellipse cx="40" cy="72" rx="20" ry="4" fill={`url(#${id}-shadow)`} />

      <rect x="18" y="38" width="44" height="28" rx="13" fill={`url(#${id}-body)`} />
      <ellipse cx="40" cy="42" rx="14" ry="5" fill="white" opacity="0.08" />

      <rect x="10" y="41" width="11" height="11" rx="5.5" fill={`url(#${id}-body)`} />
      <rect x="59" y="41" width="11" height="11" rx="5.5" fill={`url(#${id}-body)`} />
      <ellipse cx="15" cy="43" rx="3" ry="1.5" fill="white" opacity="0.1" />
      <ellipse cx="65" cy="43" rx="3" ry="1.5" fill="white" opacity="0.1" />

      <rect x="25" y="61" width="11" height="9" rx="4.5" fill={`url(#${id}-body)`} />
      <rect x="44" y="61" width="11" height="9" rx="4.5" fill={`url(#${id}-body)`} />
      <ellipse cx="30.5" cy="68.5" rx="3.5" ry="1.5" fill={darkColor} opacity="0.5" />
      <ellipse cx="49.5" cy="68.5" rx="3.5" ry="1.5" fill={darkColor} opacity="0.5" />

      <ellipse cx="40" cy="52" rx="9" ry="7" fill="white" opacity="0.07" />

      <circle cx="27" cy="15" r="7" fill={`url(#${id}-body)`} />
      <circle cx="53" cy="15" r="7" fill={`url(#${id}-body)`} />
      <circle cx="27" cy="15" r="4" fill={`url(#${id}-ear-inner)`} />
      <circle cx="53" cy="15" r="4" fill={`url(#${id}-ear-inner)`} />
      <circle cx="25.5" cy="13.5" r="1.2" fill="white" opacity="0.4" />
      <circle cx="51.5" cy="13.5" r="1.2" fill="white" opacity="0.4" />

      <circle cx="40" cy="27" r="17" fill={`url(#${id}-head)`} />
      <ellipse cx="30" cy="32" rx="4" ry="2.5" fill="#f4a07a" opacity="0.3" />
      <ellipse cx="50" cy="32" rx="4" ry="2.5" fill="#f4a07a" opacity="0.3" />

      <ellipse cx="40" cy="33" rx="7" ry="5" fill="#f0d4a8" />
      <ellipse cx="40" cy="33" rx="6.5" ry="4.5" fill="#f5dcb4" opacity="0.6" />

      <ellipse cx="40" cy="30" rx="3.5" ry="2.5" fill={`url(#${id}-nose)`} />
      <ellipse cx="39" cy="29.2" rx="1" ry="0.7" fill="white" opacity="0.4" />

      <path
        d="M37 33.5 Q40 36.5 43 33.5"
        stroke="#7a4030"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="40" y1="33" x2="40" y2="33.5" stroke="#7a4030" strokeWidth="1.2" strokeLinecap="round" />

      <circle cx="34" cy="26" r="2.5" fill="#2a1a10" />
      <circle cx="46" cy="26" r="2.5" fill="#2a1a10" />
      <circle cx="33.2" cy="25.2" r="0.9" fill="white" opacity="0.8" />
      <circle cx="45.2" cy="25.2" r="0.9" fill="white" opacity="0.8" />

      <rect x="21" y="19" width="38" height="17" rx="8.5" fill={`url(#${id}-visor)`} opacity="0.88" />
      <rect
        x="21"
        y="19"
        width="38"
        height="17"
        rx="8.5"
        fill="none"
        stroke="white"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <rect x="23" y="20" width="34" height="7" rx="4" fill={`url(#${id}-shine)`} opacity="0.6" />
      <circle cx="30" cy="24" r="3.5" fill="white" opacity="0.25" />
      <circle cx="29.2" cy="23.2" r="1.2" fill="white" opacity="0.55" />
      <circle cx="52" cy="27" r="1.5" fill="white" opacity="0.2" />

      <line x1="40" y1="10" x2="40" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="9" r="2.5" fill={color} />
      <circle cx="40" cy="9" r="1.2" fill="#fff" opacity="0.4" />
    </svg>
  );
}
