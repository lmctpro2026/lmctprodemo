/* ─────────────────────────────────────────────────────────────────────
   LMCT PRO brand mark.
   • <LogoMark /> — the square symbol on its own (nav, sidebar, app icon).
   • <Wordmark /> — the typographic part on its own.
   • <Logo />     — full horizontal lockup (mark + wordmark).
   No external dependencies; all SVG paths or inline text with the
   site fonts (Fraunces + DM Mono, loaded globally from app/layout.tsx).
   The mark scales cleanly from 14px to 200px.

   Brand story baked into the mark:
     • Premium-sedan silhouette in gold (long bonnet, generous roofline,
       short rear deck — S-Class / A8 proportions, not muscle).
     • Single continuous stroke. Round caps. No fills.
     • Thin gold heraldic ring framing the silhouette — the badge.
     • Ink ground with rounded corners — the surface.
   ───────────────────────────────────────────────────────────────────── */

interface MarkProps {
  size?: number
  className?: string
  /** Background tone. "ink" (default) for cream contexts, "transparent"
   *  for dark contexts where the surface already does the job. */
  tone?: "ink" | "transparent"
  /** Optional title for accessibility. */
  title?: string
}

export function LogoMark({
  size = 32,
  className,
  tone = "ink",
  title = "LMCT PRO",
}: MarkProps) {
  const ground = tone === "ink" ? "#0d1117" : "transparent"
  const ringStroke = tone === "ink" ? "rgba(200, 169, 110, 0.42)" : "rgba(200, 169, 110, 0.55)"
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* Rounded ink ground */}
      <rect width="64" height="64" rx="14" fill={ground} />
      {/* Heraldic gold ring — the badge frame */}
      <circle
        cx="32"
        cy="32"
        r="25"
        fill="none"
        stroke={ringStroke}
        strokeWidth="0.9"
      />
      {/* Sedan top silhouette — bonnet → A-pillar → roofline → C-pillar → boot.
          Premium proportions: long bonnet, long roof, short rear deck. */}
      <path
        d="M 11 38 L 17 38 Q 19 28 26 23 L 38 23 Q 45 28 47 38 L 53 38"
        fill="none"
        stroke="#c8a96e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Body underline — broken by the wheel arches */}
      <line x1="11" y1="38" x2="18" y2="38" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="38" x2="38" y2="38" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="38" x2="53" y2="38" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" />
      {/* Wheels — elegant small circles, inkfilled so the ring sits on top */}
      <circle cx="22" cy="42" r="3.4" fill={ground} stroke="#c8a96e" strokeWidth="1.8" />
      <circle cx="42" cy="42" r="3.4" fill={ground} stroke="#c8a96e" strokeWidth="1.8" />
    </svg>
  )
}

interface WordmarkProps {
  /** Pixel height of the wordmark. Defaults to 18 (nav scale). */
  height?: number
  /** Text colour. Defaults to currentColor so it inherits. */
  color?: string
  /** Accent dot colour. Defaults to muted gold #c8a96e. */
  accent?: string
  className?: string
}

export function Wordmark({
  height = 18,
  color = "currentColor",
  accent = "#c8a96e",
  className,
}: WordmarkProps) {
  // Scale the type from a reference of 18px → adjust gap/dot proportionally.
  const s = height / 18
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 6 * s,
        color,
        lineHeight: 1,
        letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontWeight: 800,
          fontSize: height * 1.0,
          letterSpacing: "-0.022em",
          lineHeight: 1,
          color,
        }}
      >
        LMCT
      </span>
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: Math.max(3, 3 * s),
          height: Math.max(3, 3 * s),
          borderRadius: 999,
          background: accent,
          transform: `translateY(-${height * 0.18}px)`,
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
          fontWeight: 500,
          fontSize: height * 0.72,
          letterSpacing: "0.04em",
          lineHeight: 1,
          color,
        }}
      >
        PRO
      </span>
    </span>
  )
}

interface LogoProps {
  /** Mark size in pixels. Default 32. */
  size?: number
  /** Tone of the mark. "ink" on cream contexts, "transparent" on dark. */
  tone?: "ink" | "transparent"
  /** Text colour for the wordmark. */
  color?: string
  /** Accent colour (mark uses brand gold regardless). */
  accent?: string
  className?: string
}

export function Logo({
  size = 32,
  tone = "ink",
  color = "currentColor",
  accent = "#c8a96e",
  className,
}: LogoProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <LogoMark size={size} tone={tone} />
      <Wordmark height={Math.round(size * 0.56)} color={color} accent={accent} />
    </span>
  )
}
