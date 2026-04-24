// Velvet Note — Note hierarchy (top / heart / base) — 3 variations.

const { VN, Caption, Serif, Chip, FAMILY } = window;

const DEMO_NOTES = {
  top:   [['Bergamot','fresh'], ['Pink Pepper','spicy']],
  heart: [['Iris','floral'], ['Vetiver','woody']],
  base:  [['Oud','woody'], ['Leather','woody'], ['Tonka','oriental']],
};

// VARIATION A — Labeled rows (quiet editorial)
function NotesRows({ notes = DEMO_NOTES }) {
  const rows = [
    ['Top',   'The first impression',          notes.top],
    ['Heart', 'After a few minutes',           notes.heart],
    ['Base',  'What lingers',                  notes.base],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {rows.map(([label, sub, arr]) => (
        <div key={label} style={{ display: 'flex', gap: 20 }}>
          <div style={{ width: 68, flexShrink: 0, paddingTop: 4 }}>
            <Caption>{label}</Caption>
            <div style={{ fontSize: 11, color: VN.textMuted, marginTop: 4, lineHeight: 1.3 }}>{sub}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 2 }}>
            {arr.map(([n, f]) => <Chip key={n} label={n} family={f} size="sm" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// VARIATION B — Vertical pyramid / ladder (spatial)
function NotesPyramid({ notes = DEMO_NOTES }) {
  const rows = [
    ['Top',   notes.top,   0.55],
    ['Heart', notes.heart, 0.80],
    ['Base',  notes.base,  1.00],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
      <div style={{
        position: 'absolute', left: 42, top: 10, bottom: 10,
        width: 1, background: VN.border, opacity: 0.6,
      }}/>
      {rows.map(([label, arr, _w], i) => (
        <div key={label} style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0',
        }}>
          <div style={{
            width: 42, flexShrink: 0,
            fontFamily: VN.serif, fontSize: 13, letterSpacing: 2,
            color: VN.textDim, textTransform: 'uppercase',
          }}>{label}</div>
          <div style={{
            width: 9, height: 9, borderRadius: 999,
            background: i === 0 ? VN.textMuted : i === 1 ? '#A34637' : VN.accent,
            flexShrink: 0, zIndex: 1,
            boxShadow: `0 0 0 3px ${VN.bg}`,
          }}/>
          <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {arr.map(([n, f]) => <Chip key={n} label={n} family={f} size="sm" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// VARIATION C — Dry-down timeline (horizontal)
function NotesTimeline({ notes = DEMO_NOTES }) {
  const rows = [
    ['Top',   '0–15 min',  notes.top],
    ['Heart', '15m–2h',    notes.heart],
    ['Base',  '2h onward', notes.base],
  ];
  return (
    <div>
      {/* Timeline axis */}
      <div style={{
        height: 1, background: VN.border, margin: '0 0 18px',
        position: 'relative',
      }}>
        {[0, 33, 66].map((left, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${left}%`, top: -3,
            width: 7, height: 7, borderRadius: 999,
            background: i === 0 ? VN.textMuted : i === 1 ? '#A34637' : VN.accent,
          }}/>
        ))}
        <div style={{
          position: 'absolute', right: 0, top: -3,
          width: 7, height: 7, borderRadius: 999,
          border: `1px solid ${VN.border}`, background: VN.bg,
        }}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {rows.map(([label, dur, arr]) => (
          <div key={label}>
            <Caption style={{ marginBottom: 4 }}>{label}</Caption>
            <div style={{ fontSize: 10, color: VN.textMuted, marginBottom: 10, letterSpacing: 0.5 }}>{dur}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
              {arr.map(([n, f]) => <Chip key={n} label={n} family={f} size="sm" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { NotesRows, NotesPyramid, NotesTimeline, DEMO_NOTES });
