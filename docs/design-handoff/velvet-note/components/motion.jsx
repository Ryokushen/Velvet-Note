// Velvet Note — Signature motion: list row → detail shared-element expand.
// The brand/name typography and the row itself animate from their list
// position into the detail hero. This is the ONE motion we lean on.

const { VN, PhoneFrame, CollectionScreen, DetailRead, DetailWithImage,
        SAMPLE, TabBar, Header, Caption, Serif, Icon, BottlePlaceholder, FAMILY } = window;

// Interactive phone prototype with working transition.
function SignatureMotionProto({ withImages = false, rating = 'numeral', notes = 'rows' }) {
  const [screen, setScreen] = React.useState('list'); // list | detail
  const [openItem, setOpenItem] = React.useState(null);
  const [phase, setPhase] = React.useState('idle'); // idle | opening | open | closing
  const [fromRect, setFromRect] = React.useState(null);
  const containerRef = React.useRef(null);

  function open(item, e) {
    const btn = e.currentTarget.closest('button');
    const cRect = containerRef.current.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    setFromRect({
      top:    r.top - cRect.top,
      left:   r.left - cRect.left,
      width:  r.width,
      height: r.height,
    });
    setOpenItem(item);
    setPhase('opening');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setScreen('detail');
      setTimeout(() => setPhase('open'), 520);
    }));
  }

  function close() {
    setPhase('closing');
    setScreen('list');
    setTimeout(() => {
      setPhase('idle');
      setOpenItem(null);
    }, 480);
  }

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Base: collection list */}
      <CollectionScreen
        items={SAMPLE}
        withImages={withImages}
        onOpen={(item) => {}}
        onOpenEvent={open}
        activeTab="collection"
      />

      {/* Overlay: animated expanding card */}
      {openItem && phase !== 'idle' && (
        <ExpandingCard
          item={openItem}
          fromRect={fromRect}
          phase={phase}
          withImages={withImages}
          rating={rating}
          notes={notes}
          onClose={close}
        />
      )}
    </div>
  );
}

// The shared element: a row that grows into a full detail screen.
function ExpandingCard({ item, fromRect, phase, withImages, rating, notes, onClose }) {
  const open = phase === 'open' || phase === 'opening';
  // Target = full screen, except our paddingTop under status bar
  const target = { top: 0, left: 0, width: '100%', height: '100%' };

  // When opening: start at fromRect, animate to target
  // When closing: start at target, animate to fromRect
  const [style, setStyle] = React.useState({
    position: 'absolute',
    top: fromRect.top, left: fromRect.left,
    width: fromRect.width, height: fromRect.height,
    background: VN.bg,
    transition: 'all 480ms cubic-bezier(.2,.7,.2,1)',
    overflow: 'hidden',
    zIndex: 60,
  });

  React.useEffect(() => {
    if (phase === 'opening') {
      requestAnimationFrame(() => {
        setStyle(s => ({ ...s, top: 0, left: 0, width: '100%', height: '100%' }));
      });
    } else if (phase === 'closing') {
      setStyle(s => ({
        ...s,
        top: fromRect.top, left: fromRect.left,
        width: fromRect.width, height: fromRect.height,
      }));
    }
  }, [phase]);

  return (
    <div style={style}>
      {/* Phantom row version (fades out as detail appears) */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: open ? 0 : 1,
        transition: 'opacity 240ms ease-out',
        pointerEvents: 'none',
      }}>
        <div style={{
          padding: '20px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
          height: '100%',
        }}>
          {withImages && (
            <div style={{
              width: 56, height: 72, background: VN.surface, borderRadius: VN.r.sm,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <BottlePlaceholder width={36} height={56} tintOpacity={0.15} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Caption style={{ color: VN.textMuted, marginBottom: 4 }}>{item.brand}</Caption>
            <Serif size={17}>{item.name}</Serif>
          </div>
        </div>
      </div>

      {/* Detail version (fades in on top) */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: open ? 1 : 0,
        transition: `opacity 320ms ease-out ${open ? '120ms' : '0ms'}`,
        pointerEvents: open ? 'auto' : 'none',
      }}>
        {withImages
          ? <DetailWithImage item={item} rating={rating} notes={notes} onBack={onClose} />
          : <DetailRead item={item} rating={rating} notes={notes} onBack={onClose} />}
      </div>

      {/* Shared heading — typography that morphs position/scale */}
      <SharedHeading item={item} phase={phase} withImages={withImages} />
    </div>
  );
}

// Shared brand/name element that moves between list position and detail hero
function SharedHeading({ item, phase, withImages }) {
  const open = phase === 'open' || phase === 'opening';
  const titleY = withImages ? 458 : 88; // where the <Serif size={32+}> sits in detail
  const captionY = withImages ? 440 : 78;

  const listPadX = 20 + (withImages ? 56 + 16 : 0); // thumb width offset
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 0, pointerEvents: 'none',
      zIndex: 2,
    }}>
      <div style={{
        position: 'absolute',
        left: open ? 24 : listPadX,
        top: open ? captionY : 24,
        transition: 'all 480ms cubic-bezier(.2,.7,.2,1)',
      }}>
        <Caption style={{ color: VN.textMuted }}>{item.brand}</Caption>
      </div>
      <div style={{
        position: 'absolute',
        left: open ? 24 : listPadX,
        top: open ? titleY : 40,
        transition: 'all 480ms cubic-bezier(.2,.7,.2,1)',
        transformOrigin: 'top left',
        transform: open ? 'scale(1)' : 'scale(0.53)',
      }}>
        <Serif size={34}>{item.name}</Serif>
      </div>
    </div>
  );
}

// Patch CollectionScreen: intercept row clicks to pass the event too.
// We monkey-patch ListRow through a wrapper by duplicating the rendering.
// Instead, replace CollectionScreen's rows with event-passing ones.
function CollectionScreenWithMotion({ items = SAMPLE, withImages = false, onOpenEvent, activeTab = 'collection', onTab }) {
  const { CollectionScreen: _C } = window;
  // We'll just re-implement it lightly here so ListRow gets the event.
  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 54, paddingBottom: 88, display: 'flex', flexDirection: 'column' }}>
      <Header title="Collection" right={<button style={{ background:'none',border:'none',color:VN.textMuted,cursor:'pointer',padding:6 }}><Icon.LogOut /></button>} />
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
          <Serif size={28}>{items.length} bottles</Serif>
          <Caption>{items.filter(i => i.rating >= 8).length} favorites</Caption>
        </div>
        <div style={{
          height: 44, background: VN.surface, border: `1px solid ${VN.border}`, borderRadius: VN.r.sm,
          padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ color: VN.textMuted }}><Icon.Search width={16} height={16} /></div>
          <div style={{ flex: 1, fontSize: 14, color: VN.textMuted }}>Search your shelf</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {items.map(item => (
          <button key={item.id}
            onClick={(e) => onOpenEvent && onOpenEvent(item, e)}
            style={{ width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', display: 'block' }}>
            <div style={{
              padding: '20px 20px',
              borderBottom: `1px solid ${VN.borderSoft}`,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              {withImages && (
                <div style={{
                  width: 56, height: 72, background: VN.surface, borderRadius: VN.r.sm,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}><BottlePlaceholder width={36} height={56} tintOpacity={0.15} /></div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Caption style={{ color: VN.textMuted, marginBottom: 4 }}>{item.brand}</Caption>
                <Serif size={17} style={{ marginBottom: 6 }}>{item.name}</Serif>
                <div style={{ fontSize: 12, color: VN.textDim, letterSpacing: 0.3 }}>
                  {item.concentration} · {item.accords.slice(0,3).map(a => a[0]).join(', ')}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: VN.serif, fontSize: 22, color: VN.text, lineHeight: 1 }}>
                  {item.rating.toFixed(1)}
                </div>
                <Caption style={{ fontSize: 9, marginTop: 4 }}>Rating</Caption>
              </div>
            </div>
          </button>
        ))}
      </div>
      <TabBar active={activeTab} onChange={onTab} />
    </div>
  );
}

// Replace the earlier SignatureMotionProto body to use CollectionScreenWithMotion
function SignatureMotion({ withImages = false, rating = 'numeral', notes = 'rows' }) {
  const [openItem, setOpenItem] = React.useState(null);
  const [phase, setPhase] = React.useState('idle');
  const [fromRect, setFromRect] = React.useState(null);
  const containerRef = React.useRef(null);

  function open(item, e) {
    const btn = e.currentTarget;
    const cRect = containerRef.current.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    setFromRect({
      top:    r.top - cRect.top,
      left:   r.left - cRect.left,
      width:  r.width,
      height: r.height,
    });
    setOpenItem(item);
    setPhase('opening');
    setTimeout(() => setPhase('open'), 520);
  }

  function close() {
    setPhase('closing');
    setTimeout(() => {
      setPhase('idle');
      setOpenItem(null);
    }, 500);
  }

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <CollectionScreenWithMotion
        items={SAMPLE}
        withImages={withImages}
        onOpenEvent={open}
      />
      {openItem && phase !== 'idle' && fromRect && (
        <ExpandingCard
          item={openItem}
          fromRect={fromRect}
          phase={phase}
          withImages={withImages}
          rating={rating}
          notes={notes}
          onClose={close}
        />
      )}
    </div>
  );
}

Object.assign(window, { SignatureMotion, ExpandingCard, CollectionScreenWithMotion });
