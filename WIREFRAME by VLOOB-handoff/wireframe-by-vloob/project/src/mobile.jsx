// ---- WIREFRAME Mobile Quick Edit — simplified, big-button studio for phones ----
const { useRef: MR, useState: MS, useEffect: MU } = React;
const { PALETTES: MPALETTES, PALETTE_NAMES: MPALETTE_NAMES, FRAME_PRESETS: MFRAME_PRESETS } = window.VLOOB;

const MOBILE_PRESET_ORDER = ['Full Bleed','Circle Badge','Rounded Card','Square Inset','Portrait','Arch'];
const MOBILE_SHAPE_ICON = {
  'Full Bleed':   <rect x="4" y="6" width="52" height="28" rx="1" fill="currentColor" opacity="0.35"/>,
  'Circle Badge': <circle cx="30" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="2"/>,
  'Rounded Card': <rect x="12" y="6" width="36" height="28" rx="6" fill="currentColor" opacity="0.35"/>,
  'Square Inset': <rect x="16" y="6" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5"/>,
  'Portrait':     <rect x="20" y="4" width="20" height="32" fill="currentColor" opacity="0.35"/>,
  'Arch':         <path d="M17 34 V18 a13 13 0 0 1 26 0 V34 Z" fill="none" stroke="currentColor" strokeWidth="2"/>,
};

function MobileStudio({
  canvasRef, module, canvasSize, setCanvasSize, sizePresets,
  hasImage, onUpload, dragOver, onDragOver, onDragLeave, onDrop,
  onShuffle, autoOn, setAutoOn,
  frameShape, onFramePreset,
  grade, onPalette, onClearGrade,
  onExport, onUseFullEditor,
}) {
  const curPalIdx = MPALETTES.findIndex(p => grade.enabled && p[0]===grade.shadowColor && p[1]===grade.highlightColor);

  // ---- bound the preview so it never eats the whole screen, whatever the canvas aspect ----
  const wrapRef = MR(null);
  const [box, setBox] = MS({ w: 300, h: 300 });
  MU(()=>{
    const calc = ()=>{
      const wrap = wrapRef.current; if (!wrap) return;
      const availW = wrap.clientWidth;
      const availH = Math.max(180, window.innerHeight * 0.42);
      const ar = canvasSize.w / canvasSize.h;
      let w = availW, h = w / ar;
      if (h > availH) { h = availH; w = h * ar; }
      setBox({ w: Math.round(w), h: Math.round(h) });
    };
    calc();
    window.addEventListener('resize', calc);
    const ro = new ResizeObserver(calc); if (wrapRef.current) ro.observe(wrapRef.current);
    return ()=>{ window.removeEventListener('resize', calc); ro.disconnect(); };
  }, [canvasSize.w, canvasSize.h]);

  return (
    <div className="mobile-studio">
      <div className="mobile-canvas-wrap" ref={wrapRef} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        <div className="mobile-canvas-frame" style={{ width: box.w, height: box.h }}>
          <canvas ref={canvasRef} style={{ width:'100%', height:'100%', display:'block' }}
            role="img" aria-label={`WIREFRAME ${module} composition`} />
          {!hasImage && (
            <div className={'empty-drop'+(dragOver?' drag':'')} onClick={onUpload}>
              <Icon.image/>
              <span className="big">Tap to upload a photo</span>
              <span className="sm">JPG · PNG · WEBP · max 10MB</span>
            </div>
          )}
        </div>
        <div className="mobile-dims">{canvasSize.w}×{canvasSize.h}</div>
      </div>

      <div className="mobile-panel">
        <div className="quick-section">
          <button className="quick-shuffle" onClick={onShuffle} disabled={!hasImage}><Icon.dice/> Shuffle the look</button>
          <label className="lz-auto" style={{justifyContent:'center', marginTop:8}}>
            <div className="toggle" data-on={autoOn} onClick={()=>setAutoOn(!autoOn)} role="switch" aria-checked={autoOn} aria-label="auto shuffle"></div>
            Auto-shuffle
          </label>
        </div>

        <div className="quick-section">
          <span className="quick-label">Duotone filter</span>
          <div className="quick-row">
            <button className={'quick-chip-color'+(!grade.enabled?' on':'')} onClick={onClearGrade} title="No filter">
              <span className="none-swatch">×</span>
            </button>
            {MPALETTES.map((p,i)=>(
              <button key={i} className={'quick-chip-color'+(curPalIdx===i?' on':'')} onClick={()=>onPalette(i)} title={MPALETTE_NAMES[i]} disabled={!hasImage}>
                <span style={{background:`linear-gradient(105deg, ${p[0]} 45%, ${p[1]} 55%)`}}></span>
              </button>
            ))}
          </div>
        </div>

        <div className="quick-section">
          <span className="quick-label">Frame shape</span>
          <div className="quick-row">
            {MOBILE_PRESET_ORDER.map(name => (
              <button key={name} className={'quick-shape'+(frameShape===MFRAME_PRESETS[name].shape?' on':'')} onClick={()=>onFramePreset(name)} disabled={!hasImage} title={name}>
                <svg viewBox="0 0 60 40">{MOBILE_SHAPE_ICON[name]}</svg>
              </button>
            ))}
          </div>
        </div>

        <div className="quick-section">
          <span className="quick-label">Canvas size</span>
          <div className="quick-row">
            {sizePresets.map(s => {
              const on = canvasSize.w===s.w && canvasSize.h===s.h;
              const r = s.w/s.h, bw = r>=1?18:18*r, bh = r>=1?18/r:18;
              return (
                <button key={s.id} className={'quick-size'+(on?' on':'')} onClick={()=>setCanvasSize({w:s.w,h:s.h})} title={s.label}>
                  <span className="quick-size-ico"><span style={{width:bw,height:bh}}></span></span>
                  <span className="quick-size-lbl">{s.w}×{s.h}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button className="quick-desktop-link" onClick={onUseFullEditor}>Need manual drawing, text & fine layers? Try the full editor →</button>
      </div>

      <div className="mobile-bottombar">
        <button className="mobile-export-btn" onClick={onExport} disabled={!hasImage}><Icon.download/> Export</button>
      </div>
    </div>
  );
}

window.MobileStudio = MobileStudio;
