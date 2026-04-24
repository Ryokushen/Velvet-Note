// Velvet Note — Rating visualizations (3 variations).

const { VN, Serif, Caption } = window;

// VARIATION A — Oversized numeral (hero typography)
function RatingNumeral({ value = 8.5, size = 120 }) {
  const [whole, frac] = value.toFixed(1).split('.');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{
        fontFamily: VN.serif, fontWeight: 400,
        fontSize: size, lineHeight: 0.9,
        color: VN.text, letterSpacing: -2,
        display: 'flex', alignItems: 'baseline',
      }}>
        <span>{whole}</span>
        <span style={{ fontSize: size * 0.5, color: VN.accent, marginLeft: 2 }}>.{frac}</span>
        <span style={{ fontSize: size * 0.28, color: VN.textMuted, marginLeft: 10, letterSpacing: 2 }}>/10</span>
      </div>
      <Caption style={{ marginTop: 8 }}>— Your rating</Caption>
    </div>
  );
}

// VARIATION B — 10-dot row (tactile, discrete)
function RatingDots({ value = 8.5, size = 'lg' }) {
  const dotSize = size === 'lg' ? 16 : 10;
  const gap = size === 'lg' ? 10 : 6;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: size === 'lg' ? 16 : 8 }}>
        <span style={{ fontFamily: VN.serif, fontSize: size === 'lg' ? 32 : 18, color: VN.text, letterSpacing: 0 }}>
          {value.toFixed(1)}
        </span>
        <Caption>out of ten</Caption>
      </div>
      <div style={{ display: 'flex', gap }}>
        {[...Array(10)].map((_, i) => {
          const pos = i + 1;
          const fillRatio = Math.max(0, Math.min(1, value - i));
          return (
            <div key={i} style={{
              width: dotSize, height: dotSize,
              borderRadius: 999,
              border: `1px solid ${fillRatio > 0 ? VN.accent : VN.border}`,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${fillRatio * 100}%`,
                background: VN.accent,
              }}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Inline input variant used in Add form
function RatingDotsInput({ value = 0 }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
        <span style={{ fontFamily: VN.serif, fontSize: 28, color: value > 0 ? VN.text : VN.textMuted }}>
          {value > 0 ? value.toFixed(1) : '—'}
        </span>
        <Caption>{value > 0 ? 'out of ten' : 'tap to rate'}</Caption>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[...Array(10)].map((_, i) => {
          const fillRatio = Math.max(0, Math.min(1, value - i));
          return (
            <div key={i} style={{
              width: 14, height: 14,
              borderRadius: 999,
              border: `1px solid ${fillRatio > 0 ? VN.accent : VN.border}`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${fillRatio * 100}%`,
                background: VN.accent,
              }}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// VARIATION C — Horizontal bar (editorial)
function RatingBar({ value = 8.5 }) {
  const pct = (value / 10) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span style={{ fontFamily: VN.serif, fontSize: 44, color: VN.text, lineHeight: 1 }}>
          {value.toFixed(1)}
        </span>
        <Caption>of 10</Caption>
      </div>
      <div style={{
        height: 3, background: VN.border, borderRadius: 2,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`, background: VN.accent, borderRadius: 2,
        }}/>
        <div style={{
          position: 'absolute', left: `calc(${pct}% - 6px)`, top: -4,
          width: 11, height: 11, borderRadius: 999, background: VN.accent,
          boxShadow: `0 0 0 3px ${VN.bg}`,
        }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        {['1','','','','5','','','','','10'].map((l, i) => (
          <span key={i} style={{ fontSize: 10, color: VN.textMuted, letterSpacing: 0.5 }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { RatingNumeral, RatingDots, RatingDotsInput, RatingBar });
