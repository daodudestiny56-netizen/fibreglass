/**
 * components/CardPattern.tsx
 *
 * Interactive 3D geometric floating cubes background pattern for cards.
 */



export function CardPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      <svg
        preserveAspectRatio="xMidYMid slice"
        height="100%"
        width="100%"
        className="cube-svg opacity-35"
        viewBox="0 0 120 104"
      >
        <defs>
          <linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="cube-dark">
            <stop stopColor="#232526" offset="0%" />
            <stop stopColor="#414345" offset="100%" />
          </linearGradient>
          <linearGradient y2="0%" x2="100%" y1="100%" x1="0%" id="cube-mid">
            <stop stopColor="#4b6cb7" offset="0%" />
            <stop stopColor="#182848" offset="100%" />
          </linearGradient>
          <linearGradient y2="100%" x2="0%" y1="0%" x1="100%" id="cube-light">
            <stop stopColor="#a8edea" offset="0%" />
            <stop stopColor="#fed6e3" offset="100%" />
          </linearGradient>
        </defs>

        {/* Floating Isometric Cube 1 (Center-Left) */}
        <g transform="translate(10, 15) scale(0.9)">
          <polygon points="60,20 90,35 60,50 30,35" fill="url(#cube-light)" />
          <polygon points="30,35 60,50 60,85 30,70" fill="url(#cube-mid)" />
          <polygon points="60,50 90,35 90,70 60,85" fill="url(#cube-dark)" />
        </g>

        {/* Floating Isometric Cube 2 (Top Right, Small) */}
        <g transform="translate(75, 5) scale(0.5)" opacity="0.6">
          <polygon points="60,20 90,35 60,50 30,35" fill="url(#cube-light)" />
          <polygon points="30,35 60,50 60,85 30,70" fill="url(#cube-mid)" />
          <polygon points="60,50 90,35 90,70 60,85" fill="url(#cube-dark)" />
        </g>

        {/* Floating Isometric Cube 3 (Bottom Right, Mid-size) */}
        <g transform="translate(65, 50) scale(0.75)" opacity="0.8">
          <polygon points="60,20 90,35 60,50 30,35" fill="url(#cube-light)" />
          <polygon points="30,35 60,50 60,85 30,70" fill="url(#cube-mid)" />
          <polygon points="60,50 90,35 90,70 60,85" fill="url(#cube-dark)" />
        </g>
      </svg>
    </div>
  );
}
