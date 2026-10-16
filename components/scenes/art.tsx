import type { CSSProperties } from "react";

import { mix } from "@/lib/sceneTheme";

type ArtProps = {
  color?: string;
  accent?: string;
  className?: string;
  style?: CSSProperties;
};

const svgBase = {
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
  focusable: false,
} as const;

export function Rose({ color = "#c8566b", className, style }: ArtProps) {
  const dark = mix(color, "#000000", 0.38);
  const light = mix(color, "#ffffff", 0.3);

  return (
    <svg {...svgBase} viewBox="0 0 100 100" className={className} style={style}>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="24"
          rx="21"
          ry="26"
          transform={`rotate(${angle} 50 50)`}
          fill={color}
          stroke={dark}
          strokeWidth="1.2"
        />
      ))}
      {[36, 108, 180, 252, 324].map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="33"
          rx="14"
          ry="18"
          transform={`rotate(${angle} 50 50)`}
          fill={light}
          stroke={dark}
          strokeWidth="1"
        />
      ))}
      <circle cx="50" cy="50" r="15" fill={color} stroke={dark} strokeWidth="1.2" />
      <path
        d="M50 38c12 0 14 14 2 17-10 2-14-9-6-12 6-2 10 4 5 6"
        fill="none"
        stroke={dark}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Blossom({ color = "#f4c2cf", accent = "#e8b04a", className, style }: ArtProps) {
  const dark = mix(color, "#000000", 0.25);

  return (
    <svg {...svgBase} viewBox="0 0 100 100" className={className} style={style}>
      {[0, 72, 144, 216, 288].map((angle) => (
        <path
          key={angle}
          d="M50 50C34 36 36 10 50 6c14 4 16 30 0 44z"
          transform={`rotate(${angle} 50 50)`}
          fill={color}
          stroke={dark}
          strokeWidth="1"
        />
      ))}
      <circle cx="50" cy="50" r="7" fill={accent} />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <circle
          key={angle}
          cx={50 + Math.cos((angle * Math.PI) / 180) * 12}
          cy={50 + Math.sin((angle * Math.PI) / 180) * 12}
          r="1.8"
          fill={accent}
        />
      ))}
    </svg>
  );
}

export function Leaf({ color = "#6d8b63", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 60 100" className={className} style={style}>
      <path
        d="M30 2C58 28 56 70 30 98 4 70 2 28 30 2z"
        fill={color}
        stroke={mix(color, "#000000", 0.3)}
        strokeWidth="1.2"
      />
      <path d="M30 14v78" stroke={mix(color, "#000000", 0.3)} strokeWidth="1.2" />
    </svg>
  );
}

export function Branch({ color = "#6d8b63", accent, className, style }: ArtProps) {
  const dark = mix(color, "#000000", 0.3);

  return (
    <svg {...svgBase} viewBox="0 0 200 120" className={className} style={style}>
      <path d="M4 100C60 90 120 60 196 14" fill="none" stroke={dark} strokeWidth="2.4" strokeLinecap="round" />
      {[
        [30, 94, -50],
        [52, 86, 40],
        [76, 76, -50],
        [100, 64, 40],
        [124, 50, -50],
        [150, 36, 40],
        [176, 22, -45],
      ].map(([x, y, angle]) => (
        <ellipse
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          rx="6"
          ry="15"
          transform={`rotate(${angle} ${x} ${y})`}
          fill={color}
          stroke={dark}
          strokeWidth="0.8"
        />
      ))}
      {accent && <circle cx="196" cy="14" r="4" fill={accent} />}
    </svg>
  );
}

export function Balloon({ color = "#ff6b6b", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 60 120" className={className} style={style}>
      <path
        d="M30 4C10 4 4 24 6 40c3 20 16 32 24 34 8-2 21-14 24-34C56 24 50 4 30 4z"
        fill={color}
      />
      <path
        d="M16 22c2-8 8-12 14-12"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path d="M26 74l4 6 4-6z" fill={mix(color, "#000000", 0.25)} />
      <path d="M30 80c-6 10 6 18 0 38" fill="none" stroke="#8a8a8a" strokeWidth="1" />
    </svg>
  );
}

export function Cloud({ color = "#ffffff", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 160 80" className={className} style={style}>
      <path
        d="M36 72C14 72 4 58 8 46c3-10 14-14 22-12 2-16 16-28 34-26 14 2 22 10 26 20 14-6 32 2 34 18 12 0 22 8 20 20-1 4-4 6-8 6z"
        fill={color}
      />
    </svg>
  );
}

export function Sparkle({ color = "#e8c987", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 100 100" className={className} style={style}>
      <path
        d="M50 0C54 38 62 46 100 50 62 54 54 62 50 100 46 62 38 54 0 50 38 46 46 38 50 0z"
        fill={color}
      />
    </svg>
  );
}

export function Star5({ color = "#fbd55a", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 100 100" className={className} style={style}>
      <path
        d="M50 6l13 28 30 4-22 21 6 30-27-15-27 15 6-30L7 38l30-4z"
        fill={color}
        stroke={mix(color, "#000000", 0.2)}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Heart({ color = "#e0566f", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 100 90" className={className} style={style}>
      <path
        d="M50 86C14 58 2 40 2 26 2 12 13 2 26 2c10 0 19 6 24 15C55 8 64 2 74 2c13 0 24 10 24 24 0 14-12 32-48 60z"
        fill={color}
      />
    </svg>
  );
}

export function Petal({ color = "#f4c2cf", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 60 80" className={className} style={style}>
      <path
        d="M30 2C52 14 62 40 30 78 -2 40 8 14 30 2z"
        fill={color}
        fillOpacity="0.92"
      />
      <path d="M30 10v56" stroke={mix(color, "#000000", 0.18)} strokeOpacity="0.5" />
    </svg>
  );
}

export function GradCap({ color = "#1c2a44", accent = "#d4af37", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 120 90" className={className} style={style}>
      <path d="M26 44v22c0 8 16 14 34 14s34-6 34-14V44L60 58z" fill={mix(color, "#000000", 0.2)} />
      <path d="M60 8L4 34l56 26 56-26z" fill={color} stroke={accent} strokeWidth="2" strokeLinejoin="round" />
      <path d="M104 40v28" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <circle cx="104" cy="72" r="5" fill={accent} />
    </svg>
  );
}

export function Rings({ color = "#e8c987", gem = "#ffffff", className, style }: ArtProps & { gem?: string }) {
  return (
    <svg {...svgBase} viewBox="0 0 140 100" className={className} style={style}>
      <circle cx="52" cy="58" r="32" fill="none" stroke={color} strokeWidth="7" />
      <circle cx="88" cy="58" r="32" fill="none" stroke={mix(color, "#000000", 0.15)} strokeWidth="7" />
      <path d="M70 6l10 12-10 14-10-14z" fill={gem} stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function Teddy({ color = "#c99a6b", className, style }: ArtProps) {
  const dark = mix(color, "#000000", 0.35);
  const light = mix(color, "#ffffff", 0.55);

  return (
    <svg {...svgBase} viewBox="0 0 120 130" className={className} style={style}>
      <circle cx="28" cy="22" r="14" fill={color} stroke={dark} strokeWidth="2" />
      <circle cx="92" cy="22" r="14" fill={color} stroke={dark} strokeWidth="2" />
      <circle cx="28" cy="22" r="7" fill={light} />
      <circle cx="92" cy="22" r="7" fill={light} />
      <ellipse cx="60" cy="96" rx="34" ry="30" fill={color} stroke={dark} strokeWidth="2" />
      <ellipse cx="60" cy="102" rx="20" ry="20" fill={light} />
      <circle cx="26" cy="86" r="11" fill={color} stroke={dark} strokeWidth="2" />
      <circle cx="94" cy="86" r="11" fill={color} stroke={dark} strokeWidth="2" />
      <circle cx="60" cy="46" r="32" fill={color} stroke={dark} strokeWidth="2" />
      <ellipse cx="60" cy="56" rx="14" ry="11" fill={light} stroke={dark} strokeWidth="1.5" />
      <circle cx="48" cy="40" r="3.4" fill={dark} />
      <circle cx="72" cy="40" r="3.4" fill={dark} />
      <ellipse cx="60" cy="52" rx="4.5" ry="3.2" fill={dark} />
      <path d="M60 55v4M54 60c3 3 9 3 12 0" fill="none" stroke={dark} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M48 76l12 6 12-6-12-3z" fill="#e8a5b0" stroke={dark} strokeWidth="1.2" />
    </svg>
  );
}

/* Mongolian "ulzii" endless knot, drawn as interlaced rounded squares. */
export function UlziiKnot({ color = "#e0b24f", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 100 100" className={className} style={style}>
      <g fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round">
        <rect x="24" y="24" width="52" height="52" rx="14" />
        <rect x="24" y="24" width="52" height="52" rx="14" transform="rotate(45 50 50)" />
        <rect x="38" y="38" width="24" height="24" rx="6" transform="rotate(22 50 50)" />
      </g>
      <circle cx="50" cy="50" r="4.5" fill={color} />
    </svg>
  );
}

/* Ram-horn spiral ("evereguls"), a classic Mongolian ornament. */
export function HornScroll({ color = "#e0b24f", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 120 120" className={className} style={style}>
      <path
        d="M104 16C60 8 14 30 14 66c0 22 16 36 34 34 16-2 24-14 20-26-3-9-14-12-22-8-7 4-6 14 2 16"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="104" cy="16" r="5" fill={color} />
    </svg>
  );
}

/* Wheel-like roof crown of a ger ("toono"). */
export function Toono({ color = "#e0b24f", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 200 200" className={className} style={style}>
      <g fill="none" stroke={color} strokeWidth="3">
        <circle cx="100" cy="100" r="92" />
        <circle cx="100" cy="100" r="70" strokeOpacity="0.7" />
        <circle cx="100" cy="100" r="22" />
        {Array.from({ length: 16 }, (_, index) => {
          const angle = (index * Math.PI * 2) / 16;
          return (
            <line
              key={index}
              x1={100 + Math.cos(angle) * 22}
              y1={100 + Math.sin(angle) * 22}
              x2={100 + Math.cos(angle) * 92}
              y2={100 + Math.sin(angle) * 92}
              strokeOpacity="0.8"
            />
          );
        })}
      </g>
    </svg>
  );
}

export function Chandelier({ color = "#e8c987", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 160 200" className={className} style={style}>
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M80 0v36" />
        <path d="M20 90C20 62 50 48 80 48s60 14 60 42" />
        <path d="M80 48v58M40 100C40 70 60 60 80 60M120 100C120 70 100 60 80 60" />
        <path d="M30 108h100M44 130h72" />
      </g>
      {[24, 54, 80, 106, 136].map((x, index) => (
        <g key={x}>
          <path d={`M${x} 96v14`} stroke={color} strokeWidth="2" />
          <ellipse cx={x} cy={90 - (index % 2) * 4} rx="4" ry="9" fill="#fff6d8" className="sc-flame" />
        </g>
      ))}
      {[50, 80, 110].map((x) => (
        <path key={x} d={`M${x} 130l-5 18 5 12 5-12z`} fill={color} fillOpacity="0.6" />
      ))}
    </svg>
  );
}

export function Scroll({ color = "#f3ead9", accent = "#d4af37", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 160 70" className={className} style={style}>
      <rect x="14" y="14" width="132" height="42" rx="4" fill={color} />
      <rect x="6" y="8" width="14" height="54" rx="7" fill={mix(color, "#000000", 0.12)} />
      <rect x="140" y="8" width="14" height="54" rx="7" fill={mix(color, "#000000", 0.12)} />
      <path d="M36 30h88M44 40h72" stroke={mix(color, "#000000", 0.3)} strokeWidth="2" strokeLinecap="round" />
      <path d="M76 52l-6 16 10-6 10 6-6-16z" fill={accent} />
    </svg>
  );
}

export function Moon({ color = "#fbe4a6", className, style }: ArtProps) {
  return (
    <svg {...svgBase} viewBox="0 0 80 80" className={className} style={style}>
      <path d="M52 6C30 8 14 26 14 46c0 18 14 30 32 30 10 0 18-4 24-10-22 4-40-14-36-36 2-10 8-18 18-24z" fill={color} />
    </svg>
  );
}

export function Bunting({ colors, className, style }: { colors: string[]; className?: string; style?: CSSProperties }) {
  const flags = 9;

  return (
    <svg {...svgBase} viewBox="0 0 360 60" preserveAspectRatio="none" className={className} style={style}>
      <path d="M0 6Q180 30 360 6" fill="none" stroke="#8a8a8a" strokeWidth="1.5" />
      {Array.from({ length: flags }, (_, index) => {
        const x = 14 + index * 40;
        const y = 6 + 24 * Math.sin(Math.PI * (x / 360));
        return (
          <path
            key={index}
            d={`M${x - 14} ${y - 2}L${x + 14} ${y - 2}L${x} ${y + 30}z`}
            fill={colors[index % colors.length]}
          />
        );
      })}
    </svg>
  );
}
