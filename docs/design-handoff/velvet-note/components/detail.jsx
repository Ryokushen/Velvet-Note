// Velvet Note — Detail screen (read + edit modes, with and without imagery).

const { VN, PhoneFrame, Header, Caption, Serif, Icon, Chip, FAMILY,
        BottlePlaceholder, NotesRows, NotesPyramid, NotesTimeline,
        RatingNumeral, RatingDots, RatingBar, PrimaryButton, GhostButton } = window;

// Read mode — no imagery (current data shape)
function DetailRead({ item, rating = 'numeral', notes = 'rows', onBack, onEdit, expanded }) {
  const RatingVariant = rating === 'dots' ? RatingDots : rating === 'bar' ? RatingBar : RatingNumeral;
  const NotesVariant  = notes === 'pyramid' ? NotesPyramid : notes === 'timeline' ? NotesTimeline : NotesRows;
  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 54, display: 'flex', flexDirection: 'column', background: VN.bg }}>
      <Header
        title=""
        left={<button onClick={onBack} style={{ background:'none',border:'none',color:VN.text,cursor:'pointer',padding:6 }}><Icon.ChevronLeft /></button>}
        right={<button onClick={onEdit} style={{ background:'none',border:'none',color:VN.textDim,cursor:'pointer',padding:6,fontFamily:VN.sans,fontSize:12,letterSpacing:1.2,textTransform:'uppercase' }}>Edit</button>}
      />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '24px 24px 0' }}>
          <Caption data-shared={`brand-${item.id}`}>{item.brand}</Caption>
          <Serif size={34} data-shared={`name-${item.id}`} style={{ marginTop: 10, marginBottom: 14, letterSpacing: 0.2 }}>
            {item.name}
          </Serif>
          <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginBottom: 32 }}>
            <Caption>{item.concentration}</Caption>
            <span style={{ color: VN.textMuted, fontSize: 11 }}>·</span>
            <Caption>{item.year}</Caption>
          </div>

          <div style={{ marginBottom: 40 }}>
            <RatingVariant value={item.rating} />
          </div>

          <div style={{ height: 1, background: VN.borderSoft, margin: '0 0 32px' }}/>

          <Caption style={{ marginBottom: 20 }}>Notes</Caption>
          <div style={{ marginBottom: 40 }}>
            <NotesVariant notes={splitAccords(item.accords)} />
          </div>

          <div style={{ height: 1, background: VN.borderSoft, margin: '0 0 24px' }}/>

          <Caption style={{ marginBottom: 12 }}>On the shelf since</Caption>
          <div style={{ fontFamily: VN.serif, fontSize: 20, color: VN.text, marginBottom: 32 }}>
            March 2024
          </div>

          <div style={{ paddingBottom: 48 }}>
            <GhostButton danger>Remove from shelf</GhostButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// Detail v2 — with hero imagery
function DetailWithImage({ item, rating = 'numeral', notes = 'rows', onBack, onEdit }) {
  const RatingVariant = rating === 'dots' ? RatingDots : rating === 'bar' ? RatingBar : RatingNumeral;
  const NotesVariant  = notes === 'pyramid' ? NotesPyramid : notes === 'timeline' ? NotesTimeline : NotesRows;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: VN.bg }}>
      {/* Hero */}
      <div style={{
        position: 'relative',
        height: 420,
        background: `radial-gradient(ellipse at 50% 40%, ${VN.surfaceElevated} 0%, ${VN.bg} 70%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingTop: 54,
        borderBottom: `1px solid ${VN.borderSoft}`,
      }}>
        <button onClick={onBack} style={{
          position: 'absolute', top: 62, left: 16,
          width: 40, height: 40,
          background: 'rgba(26,25,23,0.6)',
          border: `1px solid ${VN.border}`,
          borderRadius: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: VN.text, cursor: 'pointer', backdropFilter: 'blur(8px)',
        }}><Icon.ChevronLeft /></button>
        <button onClick={onEdit} style={{
          position: 'absolute', top: 62, right: 16,
          width: 40, height: 40,
          background: 'rgba(26,25,23,0.6)',
          border: `1px solid ${VN.border}`,
          borderRadius: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: VN.text, cursor: 'pointer', backdropFilter: 'blur(8px)',
        }}><Icon.Edit /></button>
        <BottlePlaceholder width={180} height={280} tintOpacity={0.35} accent />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '28px 24px 0' }}>
          <Caption>{item.brand}</Caption>
          <Serif size={32} style={{ marginTop: 10, marginBottom: 14 }}>{item.name}</Serif>
          <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginBottom: 32 }}>
            <Caption>{item.concentration}</Caption>
            <span style={{ color: VN.textMuted, fontSize: 11 }}>·</span>
            <Caption>{item.year}</Caption>
          </div>

          <div style={{ marginBottom: 40 }}>
            <RatingVariant value={item.rating} />
          </div>

          <div style={{ height: 1, background: VN.borderSoft, margin: '0 0 32px' }}/>

          <Caption style={{ marginBottom: 20 }}>Notes</Caption>
          <div style={{ marginBottom: 40 }}>
            <NotesVariant notes={splitAccords(item.accords)} />
          </div>

          <div style={{ height: 1, background: VN.borderSoft, margin: '0 0 24px' }}/>

          <Caption style={{ marginBottom: 12 }}>Last worn</Caption>
          <div style={{ fontFamily: VN.serif, fontSize: 20, color: VN.text, marginBottom: 32 }}>
            6 days ago · April 17
          </div>

          <div style={{ paddingBottom: 48 }}>
            <GhostButton danger>Remove from shelf</GhostButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit mode
function DetailEdit({ item, onBack, onSave }) {
  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 54, display: 'flex', flexDirection: 'column', background: VN.bg }}>
      <Header
        title="Editing"
        left={<button onClick={onBack} style={{ background:'none',border:'none',color:VN.textDim,cursor:'pointer',padding:6,fontFamily:VN.sans,fontSize:12,letterSpacing:1.2,textTransform:'uppercase' }}>Cancel</button>}
        right={<button onClick={onSave} style={{ background:'none',border:'none',color:VN.accent,cursor:'pointer',padding:6,fontFamily:VN.sans,fontSize:12,letterSpacing:1.2,textTransform:'uppercase',fontWeight:500 }}>Save</button>}
        serif={false}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <EditField label="Brand" value={item.brand} />
          <EditField label="Name" value={item.name} serif />
          <div>
            <Caption style={{ marginBottom: 10 }}>Concentration</Caption>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['EDT','EDP','Parfum','Cologne','Other'].map(c => {
                const sel = c === item.concentration;
                return (
                  <div key={c} style={{
                    padding: '10px 16px',
                    background: sel ? VN.accentMuted : 'transparent',
                    border: `1px solid ${sel ? VN.accent : VN.border}`,
                    borderRadius: 999,
                    color: sel ? VN.text : VN.textDim,
                    fontFamily: VN.sans, fontSize: 12, letterSpacing: 0.6,
                  }}>{c}</div>
                );
              })}
            </div>
          </div>
          <div>
            <Caption style={{ marginBottom: 10 }}>Accords</Caption>
            <div style={{
              minHeight: 56,
              background: VN.surface, border: `1px solid ${VN.border}`,
              borderRadius: VN.r.sm, padding: 10,
              display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
            }}>
              {item.accords.map(([n, f]) => (
                <span key={n} style={{
                  display:'inline-flex',alignItems:'center',gap:6,
                  padding:'7px 12px', background: FAMILY[f].tint,
                  border: `1px solid ${FAMILY[f].border}`, borderRadius: 999,
                  fontSize: 12, color: VN.text,
                }}>
                  <span style={{width:5,height:5,borderRadius:999,background:FAMILY[f].dot}}/>
                  {n}
                  <Icon.X width={12} height={12} />
                </span>
              ))}
              <span style={{ color: VN.textMuted, fontSize: 13, paddingLeft: 4 }}>+ add</span>
            </div>
          </div>
          <div>
            <Caption style={{ marginBottom: 10 }}>Rating</Caption>
            <RatingDots value={item.rating} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditField({ label, value, serif }) {
  return (
    <div>
      <Caption style={{ marginBottom: 8 }}>{label}</Caption>
      <div style={{
        background: VN.surface, border: `1px solid ${VN.border}`, borderRadius: VN.r.sm,
        padding: '12px 14px', fontSize: 15,
        fontFamily: serif ? VN.serif : VN.sans,
        color: VN.text,
      }}>{value}</div>
    </div>
  );
}

// Convert flat accord array into top/heart/base approximation for demo.
// In Phase 2 the schema will split these; here we distribute by family.
function splitAccords(accords) {
  // Rough heuristic: fresh → top; floral → heart; woody/oriental/spicy → base.
  const top = [], heart = [], base = [];
  accords.forEach(a => {
    const fam = a[1];
    if (fam === 'fresh') top.push(a);
    else if (fam === 'floral') heart.push(a);
    else base.push(a);
  });
  return {
    top:   top.length   ? top   : accords.slice(0,1),
    heart: heart.length ? heart : accords.slice(1,2),
    base:  base.length  ? base  : accords.slice(2),
  };
}

Object.assign(window, { DetailRead, DetailWithImage, DetailEdit, splitAccords });
