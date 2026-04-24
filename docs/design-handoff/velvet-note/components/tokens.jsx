// Velvet Note — design tokens, primitives, and Lucide icon pack.
// All components share the locked Phase 1 palette/type/spacing.

const VN = {
  // Palette (locked from code)
  bg: '#0F0E0D',
  surface: '#1A1917',
  surfaceElevated: '#252320',
  border: '#2F2C28',
  borderSoft: '#221F1C',
  text: '#EDE6DA',
  textDim: '#B5AD9E',
  textMuted: '#7F7869',
  accent: '#8B3A3A',
  accentMuted: '#5E2828',
  error: '#C4594F',
  success: '#6A8E5A',

  // Type
  serif: 'Georgia, "Times New Roman", serif',
  sans: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',

  // Spacing
  s: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },

  // Radius
  r: { sm: 4, md: 8, lg: 16 },
};

// ——— Phone frame ———
// A minimal, quiet iPhone-ish frame. We draw a subtle bezel only; the interior
// is flush with the app background so the design reads as the app, not a prop.
function PhoneFrame({ width = 393, height = 852, children, showStatusBar = true, time = '9:41', bgOverride }) {
  const bg = bgOverride || VN.bg;
  return (
    <div style={{
      width, height,
      background: bg,
      borderRadius: 44,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 0 0 1px #2a2724, 0 0 0 8px #0a0908, 0 0 0 9px #1c1a18',
      fontFamily: VN.sans,
      color: VN.text,
    }}>
      {showStatusBar && <StatusBar time={time} />}
      <div style={{ position: 'absolute', inset: 0 }}>
        {children}
      </div>
      {/* Dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 34, borderRadius: 20, background: '#000', zIndex: 50,
      }} />
      {/* Home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 3, background: VN.text, opacity: 0.5, zIndex: 50,
      }} />
    </div>
  );
}

function StatusBar({ time = '9:41' }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 54,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 32px 0', fontFamily: VN.sans, color: VN.text,
      fontSize: 15, fontWeight: 600, zIndex: 40, pointerEvents: 'none',
    }}>
      <span>{time}</span>
      <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <Icon.Signal />
        <Icon.Wifi />
        <Icon.Battery />
      </span>
    </div>
  );
}

// ——— Caption / Serif helpers ———
function Caption({ children, style, ...rest }) {
  return (
    <div style={{
      fontFamily: VN.sans,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: VN.textMuted,
      fontWeight: 500,
      ...style,
    }} {...rest}>{children}</div>
  );
}

function Serif({ children, size = 24, style, as = 'div', ...rest }) {
  const Tag = as;
  return (
    <Tag style={{
      fontFamily: VN.serif,
      fontWeight: 400,
      fontSize: size,
      letterSpacing: 0.2,
      color: VN.text,
      lineHeight: 1.15,
      ...style,
    }} {...rest}>{children}</Tag>
  );
}

// ——— Lucide-style icons (hairline 1.5px) ———
// Drawn inline so we don't add dependencies. Strokes match Lucide visual weight.
const iconBase = {
  width: 20, height: 20, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
};

const Icon = {
  Search: (p) => <svg {...iconBase} {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  Plus: (p) => <svg {...iconBase} {...p}><path d="M12 5v14M5 12h14"/></svg>,
  Check: (p) => <svg {...iconBase} {...p}><path d="M20 6 9 17l-5-5"/></svg>,
  X: (p) => <svg {...iconBase} {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  ChevronLeft: (p) => <svg {...iconBase} {...p}><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: (p) => <svg {...iconBase} {...p}><path d="m9 18 6-6-6-6"/></svg>,
  ChevronDown: (p) => <svg {...iconBase} {...p}><path d="m6 9 6 6 6-6"/></svg>,
  Edit: (p) => <svg {...iconBase} {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>,
  Trash: (p) => <svg {...iconBase} {...p}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>,
  Droplet: (p) => <svg {...iconBase} {...p}><path d="M12 2.5s6 7 6 11.5a6 6 0 0 1-12 0c0-4.5 6-11.5 6-11.5z"/></svg>,
  Calendar: (p) => <svg {...iconBase} {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>,
  Grid: (p) => <svg {...iconBase} {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Menu: (p) => <svg {...iconBase} {...p}><path d="M4 6h16M4 12h16M4 18h16"/></svg>,
  More: (p) => <svg {...iconBase} {...p}><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  LogOut: (p) => <svg {...iconBase} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>,
  Book: (p) => <svg {...iconBase} {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M4 19.5V21h16"/></svg>,
  Sparkle: (p) => <svg {...iconBase} {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>,
  Signal: (p) => <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" {...p}><rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="4.5" y="5" width="3" height="6" rx="0.5"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.5"/><rect x="13.5" y="0" width="3" height="11" rx="0.5"/></svg>,
  Wifi: (p) => <svg width="17" height="11" viewBox="0 0 17 12" fill="currentColor" {...p}><path d="M8.5 2a10 10 0 0 1 7 2.8l-1.3 1.4a8 8 0 0 0-11.4 0L1.5 4.8A10 10 0 0 1 8.5 2zm0 3.4a6.5 6.5 0 0 1 4.6 1.9l-1.4 1.4a4.5 4.5 0 0 0-6.3 0L4 7.3a6.5 6.5 0 0 1 4.5-1.9zm0 3.5a3 3 0 0 1 2.1.9L8.5 12 6.4 9.8a3 3 0 0 1 2.1-.9z"/></svg>,
  Battery: (p) => <svg width="26" height="12" viewBox="0 0 26 12" fill="none" {...p}><rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="19" height="8" rx="1.5" fill="currentColor"/><rect x="23.5" y="4" width="1.5" height="4" rx="0.75" fill="currentColor" opacity="0.4"/></svg>,
};

// ——— Accord families ———
// All hues live within the oxblood family — chroma/lightness shifted only a hair.
// These are surface tints + border tints; text stays bone.
const FAMILY = {
  woody:    { tint: 'rgba(139,58,58,0.22)', border: 'rgba(139,58,58,0.45)', dot: '#8B3A3A', label: 'Woody' },
  oriental: { tint: 'rgba(163,70,55,0.18)', border: 'rgba(163,70,55,0.40)', dot: '#A34637', label: 'Oriental' },
  fresh:    { tint: 'rgba(120,88,88,0.18)', border: 'rgba(120,88,88,0.38)', dot: '#785858', label: 'Fresh' },
  floral:   { tint: 'rgba(170,110,110,0.16)', border: 'rgba(170,110,110,0.36)', dot: '#AA6E6E', label: 'Floral' },
  spicy:    { tint: 'rgba(139,58,58,0.28)', border: 'rgba(139,58,58,0.55)', dot: '#8B3A3A', label: 'Spicy' },
};

// ——— Bottle placeholder ———
// No brand logos. A quiet vessel illustration: faceted rectangle with a cap.
// Color only hints at concentration via a subtle tint.
function BottlePlaceholder({ width = 120, height = 180, tintOpacity = 0.22, accent = false, label }) {
  const strokeCol = accent ? VN.accent : VN.textMuted;
  const tintCol = accent ? `rgba(139,58,58,${tintOpacity})` : `rgba(237,230,218,${tintOpacity * 0.4})`;
  return (
    <svg width={width} height={height} viewBox="0 0 120 180" style={{ display: 'block' }}>
      {/* cap */}
      <rect x="46" y="16" width="28" height="22" rx="1" fill="none" stroke={strokeCol} strokeWidth="1" opacity="0.7"/>
      {/* collar */}
      <rect x="50" y="38" width="20" height="8" fill="none" stroke={strokeCol} strokeWidth="1" opacity="0.6"/>
      {/* body */}
      <rect x="24" y="46" width="72" height="118" rx="3" fill={tintCol} stroke={strokeCol} strokeWidth="1" opacity="0.9"/>
      {/* liquid line */}
      <line x1="24" y1="92" x2="96" y2="92" stroke={strokeCol} strokeWidth="0.5" opacity="0.3"/>
      {label && (
        <text x="60" y="140" textAnchor="middle" fontSize="6" fill={VN.textMuted}
              fontFamily={VN.sans} letterSpacing="1">{label}</text>
      )}
    </svg>
  );
}

// Export all to window so screens can pick them up.
Object.assign(window, {
  VN, PhoneFrame, StatusBar, Caption, Serif, Icon, FAMILY, BottlePlaceholder,
});
