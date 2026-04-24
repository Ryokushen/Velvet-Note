// Velvet Note — Wear Calendar (Phase 1.5) — Month grid + Fragrance-centric view.

const { VN, PhoneFrame, Header, Caption, Serif, Icon, TabBar, SAMPLE, FAMILY } = window;

// Dummy wear log: day-of-month -> fragrance id. April 2026.
const WEAR_LOG = {
  1: '3', 2: '1', 3: '1', 5: '7', 6: '5', 8: '2', 9: '2',
  10: '6', 12: '3', 13: '3', 14: '1', 15: '7', 17: '1',
  18: '5', 20: '6', 21: '2', 22: '4', 23: '1',
};

const byId = (id) => SAMPLE.find(s => s.id === id);
function accentFor(id) {
  // Deterministic family-within-oxblood dot per fragrance
  const fams = ['woody','oriental','fresh','floral','spicy'];
  return FAMILY[fams[parseInt(id, 10) % fams.length]].dot;
}

// ═══════════════════════════════════════════════════════
// A — Month grid calendar
// ═══════════════════════════════════════════════════════
function CalendarMonth({ onTab, withDetail = false }) {
  // April 2026: April 1 = Wednesday
  const firstDow = 3; // Sun=0
  const daysInMonth = 30;
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  const today = 23;
  const [selected, setSelected] = React.useState(withDetail ? 23 : null);

  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 54, paddingBottom: 88, display: 'flex', flexDirection: 'column' }}>
      <Header title="Calendar" />
      <div style={{ padding: '20px 24px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <Serif size={28}>April</Serif>
          <Caption>2026</Caption>
        </div>
        <Caption style={{ color: VN.textMuted }}>19 wears · 7 bottles</Caption>
      </div>

      {/* Weekday header */}
      <div style={{ padding: '16px 16px 8px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, color: VN.textMuted, letterSpacing: 1.2 }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} style={{ aspectRatio: '1' }} />;
          const fid = WEAR_LOG[d];
          const worn = !!fid;
          const isToday = d === today;
          const isSelected = d === selected;
          return (
            <button key={i} onClick={() => setSelected(d)} style={{
              aspectRatio: '1',
              background: isSelected ? VN.surfaceElevated : 'transparent',
              border: isSelected ? `1px solid ${VN.accent}` : `1px solid transparent`,
              borderRadius: VN.r.sm,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 5, padding: 6, cursor: 'pointer', position: 'relative',
            }}>
              <span style={{
                fontFamily: VN.serif, fontSize: 15,
                color: isToday ? VN.accent : worn ? VN.text : VN.textMuted,
              }}>{d}</span>
              {worn ? (
                <div style={{
                  width: 6, height: 6, borderRadius: 999,
                  background: accentFor(fid),
                }}/>
              ) : (
                <div style={{ width: 6, height: 6 }}/>
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail sheet */}
      {selected && (
        <div style={{
          margin: '20px 20px 0',
          background: VN.surface,
          border: `1px solid ${VN.border}`,
          borderRadius: VN.r.md,
          padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div>
              <Caption>Thursday</Caption>
              <Serif size={22} style={{ marginTop: 4 }}>April {selected}</Serif>
            </div>
            <button style={{ background: 'none', border: 'none', color: VN.textMuted, cursor: 'pointer' }}>
              <Icon.Plus width={18} height={18} />
            </button>
          </div>
          {WEAR_LOG[selected] ? (() => {
            const f = byId(WEAR_LOG[selected]);
            return (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                paddingTop: 12, borderTop: `1px solid ${VN.borderSoft}`,
              }}>
                <div style={{
                  width: 4, height: 40, borderRadius: 2, background: accentFor(f.id),
                }}/>
                <div style={{ flex: 1 }}>
                  <Caption style={{ marginBottom: 3 }}>{f.brand}</Caption>
                  <div style={{ fontFamily: VN.serif, fontSize: 16, color: VN.text }}>{f.name}</div>
                </div>
                <Caption style={{ color: VN.textDim }}>{f.concentration}</Caption>
              </div>
            );
          })() : (
            <div style={{
              paddingTop: 12, borderTop: `1px solid ${VN.borderSoft}`,
              fontSize: 13, color: VN.textMuted,
            }}>Nothing worn.</div>
          )}
        </div>
      )}

      <TabBar active="calendar" onChange={onTab} withCalendar />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// B — Fragrance-centric "last worn"
// ═══════════════════════════════════════════════════════
function CalendarByFragrance({ onTab }) {
  // Build wear-count per fragrance from WEAR_LOG
  const stats = {};
  Object.entries(WEAR_LOG).forEach(([day, id]) => {
    stats[id] = stats[id] || { count: 0, last: 0 };
    stats[id].count++;
    stats[id].last = Math.max(stats[id].last, parseInt(day));
  });
  const today = 23;
  const rows = SAMPLE.map(f => ({
    ...f,
    count: stats[f.id]?.count || 0,
    lastAgo: stats[f.id] ? (today - stats[f.id].last) : null,
  })).sort((a, b) => (a.lastAgo ?? 999) - (b.lastAgo ?? 999));

  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 54, paddingBottom: 88, display: 'flex', flexDirection: 'column' }}>
      <Header title="Calendar" />
      <div style={{ padding: '20px 24px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Serif size={28}>By bottle</Serif>
          <Caption style={{ color: VN.textDim }}>April</Caption>
        </div>
        <Caption style={{ color: VN.textMuted, marginTop: 4 }}>What you've reached for</Caption>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
        {rows.map(r => (
          <div key={r.id} style={{
            padding: '18px 24px',
            borderBottom: `1px solid ${VN.borderSoft}`,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 3, height: 44, borderRadius: 2,
              background: r.count ? accentFor(r.id) : VN.border,
            }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Caption style={{ marginBottom: 3 }}>{r.brand}</Caption>
              <div style={{ fontFamily: VN.serif, fontSize: 16, color: VN.text, marginBottom: 6 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: VN.textMuted, letterSpacing: 0.3 }}>
                {r.lastAgo === null
                  ? 'Unworn this month'
                  : r.lastAgo === 0 ? 'Today'
                  : r.lastAgo === 1 ? 'Yesterday'
                  : `${r.lastAgo} days ago`}
                {r.count > 0 && ` · ${r.count} ${r.count === 1 ? 'wear' : 'wears'}`}
              </div>
            </div>
            {/* Sparkline dots — which days this bottle appeared */}
            <div style={{ display: 'flex', gap: 2 }}>
              {[...Array(10)].map((_, i) => {
                // last 10 days: today-9 .. today
                const day = today - 9 + i;
                const worn = WEAR_LOG[day] === r.id;
                return (
                  <div key={i} style={{
                    width: 4, height: 16,
                    borderRadius: 1,
                    background: worn ? accentFor(r.id) : VN.border,
                    opacity: worn ? 1 : 0.5,
                  }}/>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <TabBar active="calendar" onChange={onTab} withCalendar />
    </div>
  );
}

Object.assign(window, { CalendarMonth, CalendarByFragrance, WEAR_LOG });
