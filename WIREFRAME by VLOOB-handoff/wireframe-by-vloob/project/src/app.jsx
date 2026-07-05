// ---- VLOOB main app ----
const { useState: US, useRef: UR, useEffect: UE, useCallback: UC } = React;
const { makeDefaults } = window.VLOOB;
const { renderModule } = window.VLOOBR;

const MODULES = [
  { id:'frame',   label:'Reframe' },
  { id:'drawing', label:'Drawing Studio' },
  { id:'geo',     label:'Geo Generator' },
  { id:'hero',    label:'Hero Composer' },
];
const MODULE_DESC = {
  frame:'Resize, crop & frame your image — pick a shape, fit, border, and preset.',
  drawing:'Freehand & shape annotations on a live overlay above your image.',
  geo:'Procedural geometric pattern layers composited over your image.',
  hero:'Arrange your image into a hero composition with text, blocks & rules.',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "carbon",
  "density": "regular",
  "framing": "dots",
  "topbar": "center",
  "uiFont": "JetBrains Mono",
  "accent": "#ffffff"
}/*EDITMODE-END*/;

const SIZE_PRESETS = [
  { id:'1080x1080', label:'Square · 1080×1080', w:1080, h:1080, note:'Instagram post' },
  { id:'1920x1080', label:'Landscape · 1920×1080', w:1920, h:1080, note:'Slide / cover' },
  { id:'1080x1920', label:'Story · 1080×1920', w:1080, h:1920, note:'Reel / story' },
  { id:'1200x628',  label:'Link · 1200×628', w:1200, h:628, note:'OG / banner' },
  { id:'1080x1350', label:'Portrait · 1080×1350', w:1080, h:1350, note:'IG portrait' },
];
const sizeById = (id)=> SIZE_PRESETS.find(s=>s.id===id) || SIZE_PRESETS[0];

// shared random schematic+duotone generator (desktop Style Lab + mobile Quick Edit)
function buildRandomStyle(paletteLock){
  const { PALETTES } = window.VLOOB;
  const R = Math.random;
  const pal = paletteLock==='random' ? PALETTES[Math.floor(R()*PALETTES.length)] : PALETTES[+paletteLock];
  const seed = Math.floor(R()*99999);
  const layerA = { enabled:true, type:'schematic', cell:Math.round(40+R()*80), thickness: R()<0.5?1:1.5,
    color:'#ffffff', opacity:Math.round(58+R()*30), blend:'normal', rotation:0, offX:0, offY:0, seed };
  const useB = R()<0.55;
  const layerB = { enabled:useB, type: R()<0.5?'grid':'dots', cell:Math.round(26+R()*44), thickness:1,
    color:'#ffffff', opacity:Math.round(7+R()*13), blend:'normal', rotation:0, offX:0, offY:0, seed:seed+5 };
  const grade = { enabled:true, duotone:true, shadowColor:pal[0], highlightColor:pal[1],
    intensity:Math.round(85+R()*15), grain:Math.round(22+R()*28), fade:Math.round(6+R()*16),
    vignette:Math.round(22+R()*26), frame: R()<0.85, frameColor:'#e8e8e8', frameInset:+(5.5+R()*3).toFixed(1), frameLabels:true };
  return { geo:{layerA, layerB}, grade };
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [module, setModule] = US('frame');
  const [view, setView] = US('landing');
  const [canvasSize, setCanvasSize] = US({ w:1080, h:1080 });
  const [state, setState] = US(makeDefaults);
  const [image, setImage] = US(null);
  const originalRef = UR(null);
  const sampleRef = UR(null);
  const [usingSample, setUsingSample] = US(true);
  const [zoom, setZoom] = US(100);
  const [drawerOpen, setDrawerOpen] = US(true);
  const [showExport, setShowExport] = US(false);
  const [toast, setToast] = US(null);
  const [live, setLive] = US(null);
  const [dragOver, setDragOver] = US(false);
  const [fontReady, setFontReady] = US(false);
  const [textEdit, setTextEdit] = US(null);
  const [autoOn, setAutoOn] = US(true);
  const [autoSpeed, setAutoSpeed] = US(2.2);
  const [paletteLock, setPaletteLock] = US('random');
  const [noticeOn, setNoticeOn] = US(true);
  UE(()=>{ document.body.setAttribute('data-notice-open', String(noticeOn)); }, [noticeOn]);
  const [isMobile, setIsMobile] = US(false);
  const [forceDesktop, setForceDesktop] = US(false);
  UE(()=>{
    const mq = window.matchMedia('(max-width: 760px)');
    const forced = new URLSearchParams(window.location.search).get('mobile') === '1';
    const upd = ()=> setIsMobile(mq.matches || forced);
    upd(); mq.addEventListener('change', upd); return ()=>mq.removeEventListener('change', upd);
  }, []);
  const mobileMode = isMobile && !forceDesktop;

  const canvasRef = UR(null);
  const stageRef = UR(null);
  const fileRef = UR(null);
  const drawingRef = UR(null);
  const [, force] = US(0);

  // ---- apply tweaks to <html> ----
  UE(()=>{
    const el = document.documentElement;
    el.setAttribute('data-theme', t.theme);
    el.setAttribute('data-density', t.density);
    el.setAttribute('data-framing', t.framing);
    el.setAttribute('data-topbar', t.topbar);
    el.style.setProperty('--ui-font', `"${t.uiFont}", ui-monospace, monospace`);
    el.style.setProperty('--accent', t.accent);
    el.style.setProperty('--accent-soft', t.accent+'22');
  }, [t]);

  // ---- preload sample + fonts ----
  UE(()=>{
    const img = new Image(); img.onload = ()=> { setImage(img); sampleRef.current = img; }; img.src = 'assets/sample.jpeg';
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(()=>setFontReady(f=>!f));
  }, []);

  // ---- render canvas on any change ----
  UE(()=>{
    const c = canvasRef.current; if (!c) return;
    if (c.width !== canvasSize.w || c.height !== canvasSize.h) { c.width = canvasSize.w; c.height = canvasSize.h; }
    renderModule(c, module, state, image, module==='drawing' ? live : null);
  }, [module, state, image, live, fontReady, canvasSize, mobileMode]);

  // ---- sizing ----
  const [stageSize, setStageSize] = US({w:600,h:600});
  UE(()=>{
    const s = stageRef.current; if (!s) return;
    const ro = new ResizeObserver(()=> setStageSize({w:s.clientWidth, h:s.clientHeight}));
    ro.observe(s); return ()=>ro.disconnect();
  }, []);
  const ar = canvasSize.w / canvasSize.h;
  const availW = stageSize.w - 72, availH = stageSize.h - 72;
  let baseW = Math.max(120, Math.min(availW, availH * ar));
  const dispW = baseW * zoom/100;
  const dispH = dispW / ar;

  // ---- module slice setter ----
  const setSlice = (key)=> (newSlice)=> setState(s=> ({...s, [key]: newSlice}));

  const setGrade = (key, v)=> setState(s=> ({...s, global:{...s.global, grade: setIn(s.global.grade, key, v)}}));

  // ---- Style Lab randomizer (toward schematic-duotone aesthetic) ----
  const { PALETTES } = window.VLOOB;
  const randomizeStyle = UC(()=>{
    const s = buildRandomStyle(paletteLock);
    setState(st=> ({...st, geo:s.geo, global:{...st.global, grade:s.grade}}));
    setModule('geo');
  }, [paletteLock]);

  UE(()=>{ if(!autoOn) return; const id=setInterval(randomizeStyle, autoSpeed*1000); return ()=>clearInterval(id); }, [autoOn, autoSpeed, randomizeStyle]);

  // first impression: land on a generated look
  UE(()=>{ randomizeStyle(); }, []); // eslint-disable-line
  const enterStudio = ()=>{ setAutoOn(false); setView('editor');
    if (usingSample){ setImage(null); }
    else if (image) { curSrcRef.current = image.src; initHistory(image.src, state, module); } };
  const backToLanding = ()=>{ if (!image && sampleRef.current){ setImage(sampleRef.current); } setAutoOn(true); setView('landing'); };

  // ---- global history (undo / redo) ----
  const history = UR({ stack: [], idx: -1 });
  const [histVer, setHistVer] = US(0);
  const skipHist = UR(false);
  const curSrcRef = UR(null);
  const clone = (o)=> JSON.parse(JSON.stringify(o));

  const initHistory = (src, st, mod)=>{ history.current = { stack:[{src, state:clone(st), module:mod}], idx:0 }; skipHist.current=true; setHistVer(v=>v+1); };
  const pushHistory = (src, st, mod)=>{
    const h = history.current;
    h.stack = h.stack.slice(0, h.idx+1);
    h.stack.push({ src, state: clone(st), module: mod });
    if (h.stack.length > 40) h.stack.shift();
    h.idx = h.stack.length - 1;
    setHistVer(v=>v+1);
  };
  // debounced snapshot of in-section setting edits (working image unchanged)
  UE(()=>{
    if (view!=='editor' || !image || history.current.idx<0) return;
    if (skipHist.current) { skipHist.current=false; return; }
    const id = setTimeout(()=> pushHistory(curSrcRef.current, state, module), 450);
    return ()=> clearTimeout(id);
  }, [state]); // eslint-disable-line

  const applyEntry = (entry)=>{
    skipHist.current = true;
    setState(entry.state);
    if (entry.module) setModule(entry.module);
    if (entry.src !== curSrcRef.current) {
      curSrcRef.current = entry.src;
      const img = new Image(); img.onload = ()=> setImage(img); img.src = entry.src;
    }
  };
  const undo = ()=>{ const h=history.current; if(h.idx<=0) return; h.idx--; setHistVer(v=>v+1); applyEntry(h.stack[h.idx]); };
  const redo = ()=>{ const h=history.current; if(h.idx>=h.stack.length-1) return; h.idx++; setHistVer(v=>v+1); applyEntry(h.stack[h.idx]); };
  const canUndo = history.current.idx > 0;
  const canRedo = history.current.idx < history.current.stack.length-1;

  // bake the current module's render into the working image
  const bakeCurrent = (curState, curModule)=>{
    const work = document.createElement('canvas'); work.width=canvasSize.w; work.height=canvasSize.h;
    renderModule(work, curModule, curState, image, null);
    const src = work.toDataURL('image/png');
    curSrcRef.current = src;
    const img = new Image(); img.onload = ()=> setImage(img); img.src = src;
    return src;
  };
  // switching sections auto-commits the current look, then opens a fresh layer
  const switchModule = (next)=>{
    if (next === module) return;
    if (!image) { setModule(next); return; }
    const curState = state, curModule = module;
    const src = bakeCurrent(curState, curModule);
    const def = makeDefaults();
    const ns = { ...curState };
    ns[curModule] = def[curModule];
    ns.global = { ...curState.global, grade: def.global.grade };
    skipHist.current = true;
    setState(ns);
    setModule(next);
    pushHistory(src, ns, next);
  };

  const resetToOriginal = ()=>{
    if (!originalRef.current) return;
    const def = makeDefaults();
    curSrcRef.current = originalRef.current.src;
    setImage(originalRef.current);
    setState(def);
    setModule('frame');
    initHistory(originalRef.current.src, def, 'frame');
    popToast('Reset to original image');
  };

  // ---- Mobile Quick Edit actions ----
  const mobileShuffle = ()=>{
    switchModule('geo');
    const s = buildRandomStyle(paletteLock);
    setState(st=> ({...st, geo:s.geo, global:{...st.global, grade:s.grade}}));
  };
  const applyFramePresetMobile = (name)=>{
    const { FRAME_PRESETS } = window.VLOOB;
    const p = FRAME_PRESETS[name];
    switchModule('frame');
    setState(st=> ({...st, frame:{...st.frame, shape:p.shape, inset:p.inset, radius:p.radius, border:{...st.frame.border, width:p.borderWidth}}}));
  };
  const applyPaletteMobile = (i)=>{
    const { PALETTES } = window.VLOOB;
    const pal = PALETTES[i];
    setState(st=> ({...st, global:{...st.global, grade:{...st.global.grade, enabled:true, duotone:true, shadowColor:pal[0], highlightColor:pal[1]}}}));
  };
  const clearGradeMobile = ()=> setState(st=> ({...st, global:{...st.global, grade:{...st.global.grade, enabled:false}}}));

  const commitStrokes = (newStrokes)=> setState(s=> ({...s, drawing:{...s.drawing, strokes:newStrokes}}));
  const clearDrawing = ()=> commitStrokes([]);

  UE(()=>{
    const h = (e)=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){ e.preventDefault(); e.shiftKey?redo():undo(); }
      else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){ e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', h); return ()=>window.removeEventListener('keydown', h);
  });

  // ---- pointer → canvas coords ----
  const getPos = (e)=>{ const c=canvasRef.current, r=c.getBoundingClientRect();
    return { x:(e.clientX-r.left)/r.width*c.width, y:(e.clientY-r.top)/r.height*c.height }; };

  const onDown = (e)=>{
    if (module!=='drawing') return;
    const D = state.drawing;
    if (D.tool==='pan') return;
    e.target.setPointerCapture?.(e.pointerId);
    const p = getPos(e);
    if (D.tool==='text') {
      const r = canvasRef.current.getBoundingClientRect();
      setTextEdit({ x:p.x, y:p.y, sx:e.clientX-r.left, sy:e.clientY-r.top, value:'' });
      return;
    }
    drawingRef.current = { tool:D.tool, points:[p], x0:p.x,y0:p.y,x1:p.x,y1:p.y,
      strokeColor:D.strokeColor, fillColor:D.fillColor, strokeWidth:D.strokeWidth, opacity:D.opacity, lineCap:D.lineCap, smooth:D.smooth };
    setLive({...drawingRef.current});
  };
  const onMove = (e)=>{
    if (!drawingRef.current) return;
    const p = getPos(e); const d = drawingRef.current;
    if (d.tool==='pen'||d.tool==='eraser') d.points.push(p);
    else { d.x1=p.x; d.y1=p.y; }
    setLive({...d, points:[...d.points]});
  };
  const onUp = ()=>{
    if (!drawingRef.current) return;
    const d = drawingRef.current; drawingRef.current=null; setLive(null);
    const valid = (d.tool==='pen'||d.tool==='eraser') ? d.points.length>0 : (Math.abs(d.x1-d.x0)>2||Math.abs(d.y1-d.y0)>2);
    if (valid) commitStrokes([...state.drawing.strokes, d]);
  };
  const commitText = ()=>{
    if (!textEdit) return;
    if (textEdit.value.trim()) {
      const D = state.drawing;
      commitStrokes([...state.drawing.strokes, { tool:'text', x0:textEdit.x, y0:textEdit.y, text:textEdit.value,
        textFont:D.textFont, textSize:D.textSize, strokeColor:D.strokeColor, opacity:D.opacity }]);
    }
    setTextEdit(null);
  };

  // ---- upload ----
  const handleFile = (file)=>{
    if (!file) return;
    if (!/image\/(jpeg|jpg|png|webp)/.test(file.type)) { setToast('Unsupported format — use JPG, PNG or WEBP'); return; }
    if (file.size > 10*1024*1024) { setToast('File too large — keep under 10MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev)=>{ const img=new Image(); img.onload=()=>{
      setImage(img); originalRef.current = img; setUsingSample(false);
      const def = makeDefaults();
      setState(def); setModule('frame'); setAutoOn(false);
      curSrcRef.current = ev.target.result;
      initHistory(ev.target.result, def, 'frame');
      setToast('Image loaded — fresh start'); }; img.src=ev.target.result; };
    reader.readAsDataURL(file);
  };

  const popToast = (m)=>{ setToast(m); };
  UE(()=>{ if(!toast) return; const id=setTimeout(()=>setToast(null), 1800); return ()=>clearTimeout(id); }, [toast]);

  // ---- export: save the canvas exactly as composed, at its native size ----
  const doExport = (opts)=>{
    const out = document.createElement('canvas'); out.width=canvasSize.w; out.height=canvasSize.h;
    const exState = {...state, global:{...state.global, includeBackground:opts.includeBackground}};
    renderModule(out, module, exState, image, null);
    return out;
  };
  const download = (opts)=>{
    const out = doExport(opts);
    out.toBlob((blob)=>{
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
      a.download=`${opts.filename||'vloob-asset'}.${opts.format}`; a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
    }, opts.format==='jpg'?'image/jpeg':'image/png', opts.quality/100);
    setShowExport(false); popToast('Exported '+canvasSize.w+'×'+canvasSize.h);
  };
  const copyClip = async (opts)=>{
    try {
      const out = doExport(opts);
      out.toBlob(async (blob)=>{ await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]); popToast('Copied to clipboard'); }, 'image/png');
    } catch(e){ popToast('Clipboard unavailable'); }
  };

  const hasImage = !!image;
  const dims = `${canvasSize.w}×${canvasSize.h}`;

  return (
    <>
      {noticeOn && <div className="desktop-notice show">
        <span>✦ {mobileMode ? 'Quick Edit mode — open on desktop for the full manual Studio.' : 'WIREFRAME works best on a desktop screen — mobile support is functional but tighter.'}</span>
        <button className="x" onClick={()=>setNoticeOn(false)} aria-label="dismiss">×</button>
      </div>}
      {view==='landing' && <Landing state={state} image={image} module={module}
        randomizeStyle={randomizeStyle} autoOn={autoOn} setAutoOn={setAutoOn}
        paletteLock={paletteLock} setPaletteLock={setPaletteLock}
        canvasSize={canvasSize} setCanvasSize={setCanvasSize} sizePresets={SIZE_PRESETS}
        onEnter={enterStudio} onUpload={()=>fileRef.current && fileRef.current.click()} />}
      {/* TOPBAR */}
      <div className="topbar">
        <div className="logo" onClick={backToLanding} style={{cursor:'pointer'}} title="Back to start"><span className="mark"></span><span className="full">WIREFRAME<span className="by"> by VLOOB</span></span></div>
        {!mobileMode && <div className="tabs-wrap">
          <div className="tabs" role="tablist">
            {MODULES.map(m => <button key={m.id} className={'tab'+(module===m.id?' active':'')} role="tab" aria-selected={module===m.id} onClick={()=>switchModule(m.id)}>{m.label}</button>)}
          </div>
        </div>}
        <div className="spacer-mid"></div>
        <div className="topbar-right">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])} />
          <button className="btn ghost" onClick={()=>fileRef.current.click()} title="Upload image"><Icon.upload/> <span className="blabel">Upload</span></button>
          <div className="undo-group">
            <button className="btn ghost undo-btn" onClick={undo} disabled={!canUndo} title="Undo (⌘Z)" aria-label="undo" style={{opacity:canUndo?1:0.3, cursor:canUndo?'pointer':'not-allowed'}}><Icon.undo/></button>
            <button className="btn ghost undo-btn" onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)" aria-label="redo" style={{opacity:canRedo?1:0.3, cursor:canRedo?'pointer':'not-allowed'}}><Icon.redo/></button>
          </div>
          <button className="btn filled" onClick={()=>setShowExport(true)} title="Export"><Icon.download/> <span className="blabel">Export</span></button>
          {!mobileMode && <button className={'btn drawer-tab '+(drawerOpen?'ghost':'filled')} onClick={()=>setDrawerOpen(o=>!o)} aria-label="toggle controls"><Icon.sliders/> <span className="blabel">{drawerOpen?'Hide':'Edit'}</span></button>}
        </div>
      </div>

      {/* MAIN */}
      {mobileMode ? (
        <MobileStudio
          canvasRef={canvasRef} module={module} canvasSize={canvasSize} setCanvasSize={setCanvasSize} sizePresets={SIZE_PRESETS}
          hasImage={hasImage} onUpload={()=>fileRef.current.click()} dragOver={dragOver}
          onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
          onShuffle={mobileShuffle} autoOn={autoOn} setAutoOn={setAutoOn}
          frameShape={state.frame.shape} onFramePreset={applyFramePresetMobile}
          grade={state.global.grade} onPalette={applyPaletteMobile} onClearGrade={clearGradeMobile}
          onExport={()=>setShowExport(true)} onUseFullEditor={()=>setForceDesktop(true)}
        />
      ) : (
      <div className="main">
        <div className="stage" ref={stageRef} data-tool={module==='drawing'?state.drawing.tool:''}
          style={{overflow:zoom>100?'auto':'hidden'}}
          onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}>
          <div className="canvas-frame" style={{width:dispW, height:dispH, margin:'auto'}}>
            <canvas ref={canvasRef} style={{width:'100%', height:'100%'}}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
              role="img" aria-label={`WIREFRAME ${module} composition`} />
            {textEdit && (
              <input autoFocus className="txt" value={textEdit.value}
                onChange={e=>setTextEdit({...textEdit, value:e.target.value})}
                onBlur={commitText} onKeyDown={e=>{if(e.key==='Enter')commitText(); if(e.key==='Escape')setTextEdit(null);}}
                style={{position:'absolute', left:textEdit.sx, top:textEdit.sy, width:180, zIndex:20}} placeholder="type…" />
            )}
            {!hasImage && (
              <div className={'empty-drop'+(dragOver?' drag':'')} onClick={()=>fileRef.current.click()}>
                <Icon.image/>
                <span className="big">Drop your image here</span>
                <span className="sm">or click to upload — JPG · PNG · WEBP · max 10MB</span>
              </div>
            )}
            <div className="canvas-meta"><span>{module.toUpperCase()}</span><span>{dims}</span><span>{Math.round(zoom)}%</span></div>
          </div>
          <div className="zoom-ctl">
            <button onClick={()=>setZoom(z=>Math.max(50,z-10))} aria-label="zoom out">−</button>
            <span>{Math.round(zoom)}%</span>
            <button onClick={()=>setZoom(z=>Math.min(200,z+10))} aria-label="zoom in">+</button>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className={'sidebar'+(drawerOpen?' open':'')}>
          <div className="panel-head">
            <button className="panel-close" onClick={()=>setDrawerOpen(false)} aria-label="close controls">×</button>
            <div className="name">{MODULES.find(m=>m.id===module).label}</div>
            <div className="desc">{MODULE_DESC[module]}</div>
          </div>
          <div className="stylelab">
            <Section title="✦ Style Lab">
              <p className="field-val" style={{lineHeight:1.5}}>One-click schematic + duotone looks. Toggle Auto to keep shuffling until you like one.</p>
              <button className="btn filled" style={{width:'100%',justifyContent:'center',height:38}} onClick={randomizeStyle}><Icon.dice/> Shuffle Style</button>
              <Toggle label="Auto-shuffle" value={autoOn} onChange={setAutoOn} />
              {autoOn && <Slider label="Speed" value={autoSpeed} min={0.6} max={5} step={0.2} unit="s" onChange={setAutoSpeed} />}
              <Dropdown label="Palette" value={paletteLock} options={[{v:'random',label:'Random palette'}, ...window.VLOOB.PALETTE_NAMES.map((n,i)=>({v:String(i),label:n}))]} onChange={setPaletteLock} />
            </Section>
          </div>
          {module==='frame' && <FramePanel S={state.frame} setS={setSlice('frame')} hasImage={hasImage} />}
          {module==='drawing' && <DrawingStudioPanel S={state.drawing} setS={setSlice('drawing')} hasImage={hasImage} onUndo={undo} onRedo={redo} onClear={clearDrawing} canUndo={canUndo} canRedo={canRedo} />}
          {module==='geo' && <GeoGeneratorPanel S={state.geo} setS={setSlice('geo')} hasImage={hasImage} />}
          {module==='hero' && <HeroComposerPanel S={state.hero} setS={setSlice('hero')} hasImage={hasImage} />}
          <Section title="Canvas">
            <Dropdown label="Canvas size" value={(SIZE_PRESETS.find(s=>s.w===canvasSize.w&&s.h===canvasSize.h)||SIZE_PRESETS[0]).id} options={SIZE_PRESETS.map(s=>({v:s.id,label:s.label}))} onChange={id=>{const s=sizeById(id); setCanvasSize({w:s.w,h:s.h});}} />
            <p className="field-val" style={{lineHeight:1.5}}>Switching sections <strong style={{color:'var(--text)'}}>permanently applies</strong> the current look to your image, so each section stacks on the last. Use <strong style={{color:'var(--text)'}}>Undo / Redo</strong> (top bar, or ⌘Z) to step back.</p>
            <div className="row-btns">
              <button className="mini-btn" onClick={undo} disabled={!canUndo}>Undo</button>
              <button className="mini-btn" onClick={redo} disabled={!canRedo}>Redo</button>
            </div>
            <button className="mini-btn" onClick={resetToOriginal}>Reset to Original</button>
            <ColorField label="Background" value={state.global.backgroundColor} onChange={v=>setState(s=>({...s, global:{...s.global, backgroundColor:v}}))} />
          </Section>
          <Section title="Color Grade" collapsible>
            <Toggle label="Enable grade" value={state.global.grade.enabled} onChange={v=>setGrade('enabled',v)} />
            {state.global.grade.enabled && <>
              <ColorField label="Shadows" value={state.global.grade.shadowColor} onChange={v=>setGrade('shadowColor',v)} />
              <ColorField label="Highlights" value={state.global.grade.highlightColor} onChange={v=>setGrade('highlightColor',v)} />
              <Slider label="Intensity" value={state.global.grade.intensity} min={0} max={100} unit="%" onChange={v=>setGrade('intensity',v)} />
              <Slider label="Grain" value={state.global.grade.grain} min={0} max={80} unit="%" onChange={v=>setGrade('grain',v)} />
              <Slider label="Fade" value={state.global.grade.fade} min={0} max={50} unit="%" onChange={v=>setGrade('fade',v)} />
              <Slider label="Vignette" value={state.global.grade.vignette} min={0} max={80} unit="%" onChange={v=>setGrade('vignette',v)} />
              <Toggle label="Faded frame" value={state.global.grade.frame} onChange={v=>setGrade('frame',v)} />
              {state.global.grade.frame && <>
                <ColorField label="Frame color" value={state.global.grade.frameColor} onChange={v=>setGrade('frameColor',v)} />
                <Toggle label="Frame labels" value={state.global.grade.frameLabels} onChange={v=>setGrade('frameLabels',v)} />
              </>}
            </>}
          </Section>
        </div>
      </div>
      )}
      {isMobile && forceDesktop && (
        <button className="quick-edit-fab" onClick={()=>setForceDesktop(false)}>✦ Quick Edit</button>
      )}

      {showExport && <ExportModal onClose={()=>setShowExport(false)} onDownload={download} onCopy={copyClip} canvasSize={canvasSize} />}
      {toast && <div className="toast">{toast}</div>}

      <TweaksPanel>
        <TweakSection label="Color & Type" />
        <TweakSelect label="Theme" value={t.theme} options={[{value:'carbon',label:'Carbon (dark)'},{value:'ink',label:'Ink (warm)'},{value:'slate',label:'Slate (cool)'},{value:'paper',label:'Paper (light)'}]} onChange={v=>setTweak('theme',v)} />
        <TweakSelect label="UI font" value={t.uiFont} options={['JetBrains Mono','Space Grotesk','Oswald','Archivo']} onChange={v=>setTweak('uiFont',v)} />
        <TweakColor label="Accent" value={t.accent} options={['#ffffff','#f5c518','#00e0ff','#ff4d2e','#2ee6a8']} onChange={v=>setTweak('accent',v)} />
        <TweakSection label="Control panel density" />
        <TweakRadio label="Density" value={t.density} options={['compact','regular','comfy']} onChange={v=>setTweak('density',v)} />
        <TweakSection label="Canvas framing" />
        <TweakRadio label="Backdrop" value={t.framing} options={[{value:'checker',label:'Checker'},{value:'solid',label:'Solid'},{value:'dots',label:'Dots'},{value:'grid',label:'Grid'}]} onChange={v=>setTweak('framing',v)} />
        <TweakSection label="Topbar layout" />
        <TweakRadio label="Tabs" value={t.topbar} options={[{value:'center',label:'Center'},{value:'left',label:'Left'},{value:'segment',label:'Segment'}]} onChange={v=>setTweak('topbar',v)} />
      </TweaksPanel>
    </>
  );
}

function ExportModal({ onClose, onDownload, onCopy, canvasSize }) {
  const [format, setFormat] = US('png');
  const [quality, setQuality] = US(92);
  const [includeBg, setIncludeBg] = US(true);
  const [filename, setFilename] = US('wireframe-asset');
  const opts = { format, quality, includeBackground:includeBg, filename };
  const clip = !!(navigator.clipboard && window.ClipboardItem);
  return (
    <div className="modal-bg" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal">
        <div className="modal-head"><span className="t">Export Asset</span><button className="x" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <Segmented label="Format" value={format} options={[{v:'png',label:'PNG'},{v:'jpg',label:'JPG'}]} onChange={setFormat} />
          {format==='jpg' && <Slider label="JPG quality" value={quality} min={50} max={100} unit="%" onChange={setQuality} />}
          <Toggle label="Include background" value={includeBg} onChange={setIncludeBg} />
          <TextInput label="Filename" value={filename} onChange={setFilename} />
          <p className="field-val">Saves at canvas size · {canvasSize.w}×{canvasSize.h}px · {format.toUpperCase()}</p>
        </div>
        <div className="modal-foot">
          {clip && <button className="btn ghost" style={{flex:1, justifyContent:'center'}} onClick={()=>onCopy(opts)}><Icon.copy/> Copy</button>}
          <button className="btn filled" style={{flex:2, justifyContent:'center'}} onClick={()=>onDownload(opts)}><Icon.download/> Download</button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
