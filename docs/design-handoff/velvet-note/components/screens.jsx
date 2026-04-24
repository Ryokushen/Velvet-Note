// Velvet Note — Phase 1 screens (sign-in, collection list, add form, detail).
// Pure visual components so they can be placed standalone on the design canvas
// or composed in the interactive prototype.

const { VN, PhoneFrame, Caption, Serif, Icon, FAMILY, BottlePlaceholder } = window;

// ——— Sample data ———
// Curated-feeling collection; avoid real brand copy, no logos.
const SAMPLE = [
  { id: '1',  brand: 'Maison Delacroix',      name: 'Vetiver Noir',         concentration: 'EDP',      accords: [['Woody','woody'],['Smoke','woody'],['Iris','floral']], rating: 8.5, year: 2019 },
  { id: '2',  brand: 'Atelier Morne',         name: 'Figue de Barbarie',    concentration: 'EDT',      accords: [['Fig','fresh'],['Milk','fresh'],['Cedar','woody']],    rating: 7.0, year: 2022 },
  { id: '3',  brand: 'House of Orris',        name: 'No. 04 Oud',           concentration: 'Parfum',   accords: [['Oud','woody'],['Rose','floral'],['Saffron','spicy']], rating: 9.0, year: 2018 },
  { id: '4',  brand: 'Parfumerie Severin',    name: 'Après la Pluie',       concentration: 'EDT',      accords: [['Petrichor','fresh'],['Vetiver','woody']],              rating: 6.5, year: 2021 },
  { id: '5',  brand: 'Benoît Roux',           name: 'Tabac Cuir',           concentration: 'EDP',      accords: [['Leather','woody'],['Tobacco','oriental'],['Honey','oriental']], rating: 8.0, year: 2020 },
  { id: '6',  brand: 'Studio Kestner',        name: 'Mandarine Amère',      concentration: 'Cologne',  accords: [['Mandarin','fresh'],['Neroli','floral'],['Bergamot','fresh']],   rating: 7.5, year: 2023 },
  { id: '7',  brand: 'Maison Delacroix',      name: 'Ambre Gris',           concentration: 'Parfum',   accords: [['Amber','oriental'],['Labdanum','oriental'],['Vanilla','oriental']], rating: 9.0, year: 2017 },
];

// ——— Header ———
function Header({ title, left, right, serif = true, style }) {
  return (
    <div style={{
      height: 52,
      padding: '0 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${VN.borderSoft}`,
      ...style,
    }}>
      <div style={{ width: 44, display: 'flex', justifyContent: 'flex-start' }}>{left}</div>
      {serif
        ? <Serif size={18} style={{ letterSpacing: 0.4 }}>{title}</Serif>
        : <Caption>{title}</Caption>}
      <div style={{ width: 44, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

// ——— Tab bar (Collection | Add) ———
function TabBar({ active = 'collection', onChange, withCalendar = false, style }) {
  const tabs = withCalendar
    ? [['collection','Collection'],['calendar','Calendar'],['add','Add']]
    : [['collection','Collection'],['add','Add']];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 24, paddingTop: 8,
      borderTop: `1px solid ${VN.borderSoft}`,
      background: VN.bg,
      display: 'flex', justifyContent: 'space-around',
      ...style,
    }}>
      {tabs.map(([id, label]) => {
        const isActive = id === active;
        return (
          <button key={id}
            onClick={() => onChange && onChange(id)}
            style={{
              background: 'none', border: 'none', padding: '8px 16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: isActive ? VN.text : VN.textMuted,
              cursor: 'pointer',
            }}>
            {id === 'collection' && <Icon.Book />}
            {id === 'calendar'   && <Icon.Calendar />}
            {id === 'add'        && <Icon.Plus />}
            <span style={{
              fontFamily: VN.sans, fontSize: 10, letterSpacing: 0.9,
              textTransform: 'uppercase', fontWeight: 500,
            }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SIGN IN
// ═══════════════════════════════════════════════════════════════════
function SignInScreen() {
  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 54, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: '0 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: 64 }}>
          <Caption style={{ marginBottom: 12 }}>— Velvet Note</Caption>
          <Serif size={40} style={{ lineHeight: 1.1, marginBottom: 16 }}>
            A private<br/>catalog<br/>of scent.
          </Serif>
          <div style={{ fontSize: 14, color: VN.textDim, lineHeight: 1.55, maxWidth: 280 }}>
            For collectors who want to remember every bottle on the shelf.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Email" value="you@example.com" muted />
          <Input label="Password" value="••••••••" muted type="password" />
        </div>

        <div style={{ marginTop: 28 }}>
          <PrimaryButton>Sign in</PrimaryButton>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: VN.textDim }}>
            No account? <span style={{ color: VN.text, textDecoration: 'underline', textUnderlineOffset: 3, textDecorationColor: VN.accent }}>Create one</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, placeholder, muted, type, style }) {
  return (
    <div style={style}>
      <Caption style={{ marginBottom: 8 }}>{label}</Caption>
      <div style={{
        height: 48,
        background: VN.surface,
        border: `1px solid ${VN.border}`,
        borderRadius: VN.r.sm,
        padding: '0 14px',
        display: 'flex', alignItems: 'center',
        fontSize: 15,
        fontFamily: VN.sans,
        color: muted ? VN.textDim : VN.text,
        letterSpacing: type === 'password' ? 2 : 0,
      }}>{value || placeholder}</div>
    </div>
  );
}

function PrimaryButton({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', height: 52,
      background: VN.accent,
      border: 'none',
      borderRadius: VN.r.sm,
      color: VN.text,
      fontFamily: VN.sans,
      fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500,
      cursor: 'pointer',
      ...style,
    }}>{children}</button>
  );
}

function GhostButton({ children, onClick, style, danger }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', height: 52,
      background: 'transparent',
      border: `1px solid ${danger ? VN.error : VN.border}`,
      borderRadius: VN.r.sm,
      color: danger ? VN.error : VN.text,
      fontFamily: VN.sans,
      fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500,
      cursor: 'pointer',
      ...style,
    }}>{children}</button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LIST ROW (two flavors: with image, without image)
// ═══════════════════════════════════════════════════════════════════
function ListRow({ item, withImage = false, onClick, compact = false }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: 'none', border: 'none', padding: 0,
      textAlign: 'left', cursor: 'pointer',
      display: 'block',
    }}>
      <div style={{
        padding: '20px 20px',
        borderBottom: `1px solid ${VN.borderSoft}`,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {withImage && (
          <div style={{
            width: 56, height: 72,
            background: VN.surface,
            borderRadius: VN.r.sm,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <BottlePlaceholder width={36} height={56} tintOpacity={0.15} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Caption style={{ color: VN.textMuted, marginBottom: 4 }}>{item.brand}</Caption>
          <Serif size={17} style={{ marginBottom: compact ? 0 : 6 }}>{item.name}</Serif>
          {!compact && (
            <div style={{ fontSize: 12, color: VN.textDim, letterSpacing: 0.3 }}>
              {item.concentration} · {item.accords.slice(0,3).map(a => a[0]).join(', ')}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: VN.serif, fontSize: 22, color: VN.text, lineHeight: 1 }}>
            {item.rating.toFixed(1)}
          </div>
          <Caption style={{ fontSize: 9, marginTop: 4 }}>Rating</Caption>
        </div>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COLLECTION LIST
// ═══════════════════════════════════════════════════════════════════
function CollectionScreen({ items = SAMPLE, state = 'populated', withImages = false, onOpen, activeTab = 'collection', onTab, withCalendar = false }) {
  const empty = state === 'empty' || items.length === 0;
  const searching = state === 'searching';

  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 54, paddingBottom: 88, display: 'flex', flexDirection: 'column' }}>
      <Header
        title="Collection"
        right={<button style={{ background:'none',border:'none',color:VN.textMuted,cursor:'pointer',padding:6 }}><Icon.LogOut /></button>}
      />
      {/* Count + search */}
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
          <Serif size={28}>{empty ? 'Your shelf' : `${items.length} bottles`}</Serif>
          {!empty && <Caption>{items.filter(i => i.rating >= 8).length} favorites</Caption>}
        </div>
        <SearchField value={searching ? 'vetiv' : ''} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {empty ? <EmptyState /> : (
          searching ? (
            <>
              {items.filter(i => /vetiv|fig|petri/i.test(i.name + i.brand + i.accords.map(a=>a[0]).join(' '))).slice(0,3).map(item => (
                <ListRow key={item.id} item={item} withImage={withImages} onClick={() => onOpen && onOpen(item)} />
              ))}
              <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                <Caption style={{ color: VN.textMuted }}>3 results for "vetiv"</Caption>
              </div>
            </>
          ) : (
            items.map(item => (
              <ListRow key={item.id} item={item} withImage={withImages} onClick={() => onOpen && onOpen(item)} />
            ))
          )
        )}
      </div>

      <TabBar active={activeTab} onChange={onTab} withCalendar={withCalendar} />
    </div>
  );
}

function SearchField({ value }) {
  return (
    <div style={{
      height: 44,
      background: VN.surface,
      border: `1px solid ${VN.border}`,
      borderRadius: VN.r.sm,
      padding: '0 14px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ color: VN.textMuted }}><Icon.Search width={16} height={16} /></div>
      <div style={{
        flex: 1, fontSize: 14, color: value ? VN.text : VN.textMuted,
        fontFamily: VN.sans,
      }}>
        {value || 'Search your shelf'}
      </div>
      {value && <div style={{ color: VN.textMuted }}><Icon.X width={16} height={16} /></div>}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      padding: '80px 40px 0', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 80, height: 110,
        border: `1px dashed ${VN.border}`,
        borderRadius: VN.r.md,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
      }}>
        <BottlePlaceholder width={44} height={72} tintOpacity={0.08} />
      </div>
      <Serif size={22}>Nothing yet.</Serif>
      <div style={{ fontSize: 13, color: VN.textDim, lineHeight: 1.5, maxWidth: 240 }}>
        Catalog the bottles on your shelf. Start with the one you reached for this morning.
      </div>
      <div style={{ marginTop: 16 }}>
        <Caption style={{ color: VN.textDim, letterSpacing: 1.5 }}>— Add your first bottle ↓</Caption>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ADD FORM
// ═══════════════════════════════════════════════════════════════════
function AddScreen({ onBack, activeTab = 'add', onTab, withCalendar = false, filled = false }) {
  const [concentration, setConcentration] = React.useState(filled ? 'EDP' : null);
  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 54, paddingBottom: 88, display: 'flex', flexDirection: 'column' }}>
      <Header title="Add to shelf" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Brand" value={filled ? 'Maison Delacroix' : ''} placeholder="Who made it" muted={!filled} />
          <Input label="Name" value={filled ? 'Vetiver Noir' : ''} placeholder="What it's called" muted={!filled} />

          <div>
            <Caption style={{ marginBottom: 10 }}>Concentration</Caption>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['EDT','EDP','Parfum','Cologne','Other'].map(c => (
                <button key={c}
                  onClick={() => setConcentration(c)}
                  style={{
                    padding: '10px 16px',
                    background: concentration === c ? VN.accentMuted : 'transparent',
                    border: `1px solid ${concentration === c ? VN.accent : VN.border}`,
                    borderRadius: 999,
                    color: concentration === c ? VN.text : VN.textDim,
                    fontFamily: VN.sans, fontSize: 12, letterSpacing: 0.6,
                    cursor: 'pointer',
                  }}>{c}</button>
              ))}
            </div>
          </div>

          <div>
            <Caption style={{ marginBottom: 10 }}>Accords</Caption>
            <div style={{
              minHeight: 56,
              background: VN.surface,
              border: `1px solid ${VN.border}`,
              borderRadius: VN.r.sm,
              padding: 10,
              display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
            }}>
              {filled ? (
                <>
                  <Chip label="Vetiver" family="woody" />
                  <Chip label="Smoke" family="woody" />
                  <Chip label="Iris" family="floral" />
                  <span style={{ color: VN.textMuted, fontSize: 13, paddingLeft: 4 }}>+ add</span>
                </>
              ) : (
                <span style={{ color: VN.textMuted, fontSize: 13, paddingLeft: 4 }}>Type a note and press return</span>
              )}
            </div>
          </div>

          <div>
            <Caption style={{ marginBottom: 10 }}>Rating</Caption>
            <RatingDotsInput value={filled ? 8.5 : 0} />
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 88, left: 0, right: 0, padding: '16px 20px', background: VN.bg, borderTop: `1px solid ${VN.borderSoft}` }}>
        <PrimaryButton>Save to shelf</PrimaryButton>
      </div>
      <TabBar active={activeTab} onChange={onTab} withCalendar={withCalendar} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CHIPS (family-tinted)
// ═══════════════════════════════════════════════════════════════════
function Chip({ label, family = 'woody', size = 'md', style }) {
  const f = FAMILY[family] || FAMILY.woody;
  const pad = size === 'sm' ? '5px 10px' : '7px 12px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: pad,
      background: f.tint,
      border: `1px solid ${f.border}`,
      borderRadius: 999,
      fontFamily: VN.sans,
      fontSize: size === 'sm' ? 11 : 12,
      letterSpacing: 0.4,
      color: VN.text,
      ...style,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: 999, background: f.dot, opacity: 0.9,
      }}/>
      {label}
    </span>
  );
}

// ——— Chip family legend (for showing the taxonomy) ———
function ChipLegend() {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {Object.entries(FAMILY).map(([k, f]) => (
        <Chip key={k} label={f.label} family={k} size="sm" />
      ))}
    </div>
  );
}

Object.assign(window, {
  SAMPLE, Header, TabBar, Input, PrimaryButton, GhostButton,
  SignInScreen, CollectionScreen, ListRow, SearchField, EmptyState,
  AddScreen, Chip, ChipLegend,
});
