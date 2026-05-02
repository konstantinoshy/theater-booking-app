// ─────────────────────────────────────────────────────────────────────────────
// Premium Dark Mode Palette — Obsidian + Champagne Gold
//
// All existing keys preserved for backwards-compatibility. Values remapped to
// new cool/neutral obsidian base with champagne gold as the primary CTA color.
// New keys added at the bottom for elevation hierarchy + semantic helpers.
// ─────────────────────────────────────────────────────────────────────────────

export const C = {
  // ── Surfaces (cool neutral, no more muddy browns) ──────────────────────────
  bg:         '#0F1115', // Obsidian — app background
  surface:    '#1A1D24', // Charcoal Velvet — cards, headers
  card:       '#242830', // Slate Elevated — inner surface / input bg

  // ── Brand (Champagne Gold, replaces the old blood-red) ────────────────────
  primary:     '#D4AF7A', // Champagne Gold — primary CTA
  primaryDark: '#B8945F', // Pressed / darker gold state
  accent:      '#E5C18F', // Antique Gold — highlights, icons, active tabs
  accentSoft:  '#F0D4A8', // Even softer gold — hover text, small accents

  // ── Text (warm whites on cool dark) ────────────────────────────────────────
  text:     '#F2F3F5', // Pearl White — high emphasis
  textSoft: '#A8ADB8', // Mist Gray — medium emphasis
  muted:    '#6B707A', // Stone Gray — low emphasis, placeholders

  // ── Dividers & hairlines ───────────────────────────────────────────────────
  border: '#2A2E36', // Hairline divider (near-surface tint)

  // ── Feedback (semantic) ────────────────────────────────────────────────────
  success:     '#3DD68C', // Sage Mint
  successSoft: '#163A2A', // Tonal success surface
  error:       '#E5484D', // Crimson Alert (kept exclusively for destructive/error)
  errorSoft:   '#7A2A2D', // Tonal error surface (muted ember)

  // ── NEW: Elevation hierarchy ───────────────────────────────────────────────
  surface2: '#242830', // Modals, dropdowns (alias of card)
  surface3: '#2E333D', // Hover / selected rows

  // ── NEW: Warning ───────────────────────────────────────────────────────────
  warning:     '#F5A524', // Amber
  warningSoft: '#3A2A0E', // Tonal warning surface

  // ── NEW: On-primary — dark ink for text/icons that sit ON gold ─────────────
  onPrimary: '#0F1115', // Use on gold buttons, gold cards, gold avatars

  // ── NEW: Overlay — modal backdrop ──────────────────────────────────────────
  overlay: 'rgba(0,0,0,0.6)',
};
