// ---- VLOOB landing / hero — Style Lab as the front door ----
const { useRef: LR, useEffect: LE } = React;

function Landing({ state, image, module, randomizeStyle, autoOn, setAutoOn, paletteLock, setPaletteLock, canvasSize, setCanvasSize, sizePresets, onEnter, onUpload }) {
  const cRef = LR(null);
  LE(() => {
    const c = cRef.current;if (!c) return;
    if (c.width !== canvasSize.w || c.height !== canvasSize.h) {c.width = canvasSize.w;c.height = canvasSize.h;}
    window.VLOOBR.renderModule(c, module, state, image, null);
  }, [state, image, module, canvasSize]);

  const { PALETTES, PALETTE_NAMES } = window.VLOOB;

  const pickPalette = (i) => {setPaletteLock(String(i));setTimeout(randomizeStyle, 0);};

  return (
    <div className="landing">
      <div className="lz-top">
        <div className="lz-brand"><span className="mark"></span>WIREFRAME<span className="by"> by VLOOB</span></div>
        <span className="lz-ver">v1.0 · GENESIS SYSTEM</span>
      </div>

      <div className="lz-grid">
        <div className="lz-copy">
          <div className="lz-kicker">Brand Image Generator</div>
          <h1 className="lz-title">Turn any photo into a <em>schematic</em> brand asset.</h1>
          <p className="lz-sub">Drop in an image and we will maps it into duotone, technical line-art compositions — circles, grids, hero layouts. Hit shuffle until it clicks, then fine-tune everything in the Studio.</p>

          <div className="lz-cta">
            <button className="lz-shuffle" onClick={randomizeStyle}><Icon.dice /> Shuffle the look</button>
            <button className="lz-enter" onClick={onEnter}>Enter Studio →</button>
          </div>

          <div className="lz-palettes">
            <span className="lz-plabel">Canvas size — sets your export dimensions</span>
            <div className="lz-sizes">
              {sizePresets.map((s) => {
                const on = canvasSize.w === s.w && canvasSize.h === s.h;
                const r = s.w / s.h, bw = r >= 1 ? 24 : 24 * r, bh = r >= 1 ? 24 / r : 24;
                return (
                  <button key={s.id} className={'lz-size' + (on ? ' on' : '')} onClick={() => setCanvasSize({ w: s.w, h: s.h })} title={s.label}>
                    <span className="lz-size-ico"><span style={{ width: bw, height: bh }}></span></span>
                    <span className="lz-size-lbl">{s.w}×{s.h}</span>
                  </button>);
              })}
            </div>
          </div>

          <div className="lz-palettes">
            <span className="lz-plabel">Duotone palette</span>
            <div className="lz-chips">
              {PALETTES.map((p, i) =>
              <div key={i} className={'lz-chip' + (paletteLock === String(i) ? ' on' : '')} title={PALETTE_NAMES[i]} onClick={() => pickPalette(i)}>
                  <span style={{ background: `linear-gradient(105deg, ${p[0]} 45%, ${p[1]} 55%)` }}></span>
                </div>
              )}
            </div>
          </div>

          <div className="lz-meta">
            <label className="lz-auto">
              <div className="toggle" data-on={autoOn} onClick={() => setAutoOn(!autoOn)} role="switch" aria-checked={autoOn} aria-label="auto shuffle"></div>
              Auto-shuffle
            </label>
            <button className="lz-upload" onClick={onUpload}><Icon.upload /> Use your own image</button>
          </div>
        </div>

        <div className="lz-preview">
          <div className="lz-frame" style={{ aspectRatio: canvasSize.w + ' / ' + canvasSize.h }}><canvas ref={cRef} role="img" aria-label="WIREFRAME live preview"></canvas></div>
          <div className="lz-caption"><span className="dot"></span><span>LIVE PREVIEW</span><span>{canvasSize.w}×{canvasSize.h}</span></div>
        </div>
      </div>
    </div>);

}

window.Landing = Landing;