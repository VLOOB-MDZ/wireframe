// ---- VLOOB module control panels ----
const { useState: uS } = React;
const { FONT_LIST, WEIGHTS, FRAME_PRESETS } = window.VLOOB;

function setIn(obj, path, value) {
  const keys = Array.isArray(path) ? path : path.split('.');
  const clone = Array.isArray(obj) ? [...obj] : {...obj};
  let cur = clone;
  for (let i=0;i<keys.length-1;i++){ const k=keys[i]; cur[k] = Array.isArray(cur[k])?[...cur[k]]:{...cur[k]}; cur=cur[k]; }
  cur[keys[keys.length-1]] = value;
  return clone;
}

// ============ REFRAME PANEL (crop · resize · border) ============
const SHAPE_OPTS = [
  {v:'fill',label:'Fill'},{v:'circle',label:'Circle'},{v:'rounded',label:'Rounded'},
  {v:'square',label:'Square'},{v:'portrait',label:'Portrait'},{v:'arch',label:'Arch'},
  {v:'diamond',label:'Diamond'},{v:'hexagon',label:'Hexagon'},
];
const PRESET_ICON = {
  'Full Bleed':   <rect x="4" y="6" width="52" height="28" rx="1" fill="currentColor" opacity="0.35"/>,
  'Circle Badge': <circle cx="30" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="2"/>,
  'Rounded Card': <rect x="12" y="6" width="36" height="28" rx="6" fill="currentColor" opacity="0.35"/>,
  'Square Inset': <rect x="16" y="6" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5"/>,
  'Portrait':     <rect x="20" y="4" width="20" height="32" fill="currentColor" opacity="0.35"/>,
  'Arch':         <path d="M17 34 V18 a13 13 0 0 1 26 0 V34 Z" fill="none" stroke="currentColor" strokeWidth="2"/>,
};
function FramePanel({ S, setS, hasImage }) {
  const f = (p,v)=> setS(setIn(S,p,v));
  const applyPreset = (name)=>{
    const p = FRAME_PRESETS[name];
    let ns = setIn(S,'shape',p.shape);
    ns = setIn(ns,'inset',p.inset);
    ns = setIn(ns,'radius',p.radius);
    ns = setIn(ns,'border.width',p.borderWidth);
    setS(ns);
  };
  const veil = hasImage?'':'disabled-veil';
  const isRound = S.shape==='rounded';
  return (
    <>
      <Section title="Frame Presets">
        <div className="preset-grid">
          {Object.keys(FRAME_PRESETS).map(name => (
            <button key={name} className={'preset-btn'+(S.shape===FRAME_PRESETS[name].shape?' on':'')} onClick={()=>applyPreset(name)}>
              <svg viewBox="0 0 60 40">{PRESET_ICON[name]}</svg>
              <span className="lbl">{name}</span>
            </button>
          ))}
        </div>
      </Section>

      <div className={veil}>
      <Section title="Crop Shape">
        <Dropdown label="Shape" value={S.shape} options={SHAPE_OPTS} onChange={v=>f('shape',v)} />
        {isRound && <Slider label="Corner radius" value={S.radius} min={0} max={50} unit="%" onChange={v=>f('radius',v)} />}
        <Slider label="Inset / margin" value={S.inset} min={0} max={30} unit="%" onChange={v=>f('inset',v)} />
      </Section>

      <Section title="Resize Image">
        <Segmented label="Fit" value={S.fit} options={[{v:'cover',label:'Cover (fill)'},{v:'contain',label:'Contain (fit)'}]} onChange={v=>f('fit',v)} />
        <Slider label="Zoom" value={S.zoom} min={20} max={300} unit="%" onChange={v=>f('zoom',v)} />
        <Slider label="Offset X" value={S.offsetX} min={-400} max={400} unit="px" onChange={v=>f('offsetX',v)} />
        <Slider label="Offset Y" value={S.offsetY} min={-400} max={400} unit="px" onChange={v=>f('offsetY',v)} />
        <div className="row-btns">
          <button className="mini-btn" onClick={()=>{ setS(setIn(setIn(setIn(S,'zoom',100),'offsetX',0),'offsetY',0)); }}>Recenter</button>
        </div>
      </Section>

      <Section title="Border">
        <Slider label="Width" value={S.border.width} min={0} max={40} unit="px" onChange={v=>f('border.width',v)} />
        {S.border.width>0 && <>
          <ColorField label="Color" value={S.border.color} onChange={v=>f('border.color',v)} />
          <Dropdown label="Style" value={S.border.style} options={['solid','dashed','dotted']} onChange={v=>f('border.style',v)} />
        </>}
      </Section>

      <Section title="Crosshair" collapsible>
        <Toggle label="Schematic crosshair" value={S.crosshair.enabled} onChange={v=>f('crosshair.enabled',v)} />
        {S.crosshair.enabled && <>
          <Dropdown label="Type" value={S.crosshair.type} options={[{v:'full',label:'Full Lines'},{v:'segments',label:'Segments'},{v:'dotdash',label:'Dot-Dash'},{v:'corner',label:'Corner Marks'}]} onChange={v=>f('crosshair.type',v)} />
          <ColorField label="Color" value={S.crosshair.color} onChange={v=>f('crosshair.color',v)} />
          <Slider label="Opacity" value={S.crosshair.opacity} min={0} max={100} unit="%" onChange={v=>f('crosshair.opacity',v)} />
          <Slider label="Thickness" value={S.crosshair.thickness} min={0.5} max={4} step={0.5} unit="px" onChange={v=>f('crosshair.thickness',v)} />
          <Toggle label="Center dot" value={S.crosshair.dot} onChange={v=>f('crosshair.dot',v)} />
          {S.crosshair.dot && <Slider label="Dot size" value={S.crosshair.dotSize} min={2} max={20} unit="px" onChange={v=>f('crosshair.dotSize',v)} />}
        </>}
      </Section>
      </div>
    </>
  );
}

// ============ DRAWING STUDIO PANEL ============
const TOOLS = [['pen','pen'],['line','line'],['rect','rect'],['circle','circle'],['arrow','arrow'],['text','text'],['eraser','eraser'],['hand','pan']];
function DrawingStudioPanel({ S, setS, hasImage, onUndo, onRedo, onClear, canUndo, canRedo }) {
  const f = (p,v)=> setS(setIn(S,p,v));
  const veil = hasImage?'':'disabled-veil';
  return (
    <>
      <Section title="Tools">
        <div className="toolbar">
          {TOOLS.map(([icon,tool])=>{ const Ico=Icon[icon];
            return <button key={tool} className={'tool-btn'+(S.tool===tool?' on':'')} onClick={()=>f('tool',tool)} aria-label={tool} title={tool}><Ico/></button>; })}
        </div>
      </Section>
      <div className={veil}>
      <Section title="Stroke">
        <ColorField label="Stroke color" value={S.strokeColor} onChange={v=>f('strokeColor',v)} />
        <ColorField label="Fill color" value={S.fillColor} onChange={v=>f('fillColor',v)} allowTransparent />
        <Slider label="Stroke width" value={S.strokeWidth} min={1} max={30} unit="px" onChange={v=>f('strokeWidth',v)} />
        <Slider label="Opacity" value={S.opacity} min={0} max={100} unit="%" onChange={v=>f('opacity',v)} />
        <Segmented label="Line cap" value={S.lineCap} options={['round','square','butt']} onChange={v=>f('lineCap',v)} />
        <Toggle label="Smooth pen" value={S.smooth} onChange={v=>f('smooth',v)} />
      </Section>
      {S.tool==='text' &&
      <Section title="Text">
        <Dropdown label="Font" value={S.textFont} options={FONT_LIST} onChange={v=>f('textFont',v)} />
        <Slider label="Font size" value={S.textSize} min={8} max={120} unit="px" onChange={v=>f('textSize',v)} />
        <p className="field-val" style={{lineHeight:1.5}}>Click the canvas to place text, type, then click away.</p>
      </Section>}
      <Section title="Layer">
        <Slider label="Layer opacity" value={S.layerOpacity} min={0} max={100} unit="%" onChange={v=>f('layerOpacity',v)} />
        <div className="row-btns">
          <button className="mini-btn" onClick={onUndo} disabled={!canUndo}>Undo</button>
          <button className="mini-btn" onClick={onRedo} disabled={!canRedo}>Redo</button>
        </div>
        <button className="mini-btn" onClick={onClear}>Clear Drawing</button>
        <p className="field-val">{(S.strokes||[]).length} object(s) on overlay</p>
      </Section>
      </div>
    </>
  );
}

// ============ GEO GENERATOR PANEL ============
const PATTERNS = [{v:'schematic',label:'Schematic (line-art)'},{v:'grid',label:'Grid'},{v:'dots',label:'Dot Matrix'},{v:'triangle',label:'Triangle Mesh'},{v:'rings',label:'Concentric Rings'},{v:'radial',label:'Radial Lines'},{v:'hexagon',label:'Hexagon Grid'},{v:'scatter',label:'Random Scatter'},{v:'diagonal',label:'Diagonal Stripe'}];
const BLENDS = [{v:'normal',label:'Normal'},{v:'multiply',label:'Multiply'},{v:'screen',label:'Screen'},{v:'overlay',label:'Overlay'},{v:'difference',label:'Difference'},{v:'dodge',label:'Color Dodge'}];

function LayerControls({ L, set, name }) {
  return (
    <Section title={name} collapsible>
      <Toggle label="Enabled" value={L.enabled} onChange={v=>set('enabled',v)} />
      {L.enabled && <>
        <Dropdown label="Pattern type" value={L.type} options={PATTERNS} onChange={v=>set('type',v)} />
        <Slider label="Density / cell" value={L.cell} min={10} max={200} unit="px" onChange={v=>set('cell',v)} />
        <Slider label="Line thickness" value={L.thickness} min={0.5} max={5} step={0.5} unit="px" onChange={v=>set('thickness',v)} />
        <ColorField label="Color" value={L.color} onChange={v=>set('color',v)} />
        <Slider label="Opacity" value={L.opacity} min={0} max={100} unit="%" onChange={v=>set('opacity',v)} />
        <Dropdown label="Blend mode" value={L.blend} options={BLENDS} onChange={v=>set('blend',v)} />
        <Slider label="Rotation" value={L.rotation} min={0} max={360} unit="°" onChange={v=>set('rotation',v)} />
        <Slider label="Offset X" value={L.offX} min={-100} max={100} unit="%" onChange={v=>set('offX',v)} />
        <Slider label="Offset Y" value={L.offY} min={-100} max={100} unit="%" onChange={v=>set('offY',v)} />
      </>}
    </Section>
  );
}

function GeoGeneratorPanel({ S, setS, hasImage }) {
  const setLayer = (layer)=> (key,v)=> setS(setIn(S,[layer,key],v));
  const randomize = ()=>{
    const r=()=>Math.random();
    const pick=arr=>arr[Math.floor(r()*arr.length)].v;
    const cols=window.VLOOB.COLOR_PRESETS;
    const newA = {...S.layerA, type:pick(PATTERNS), cell:Math.round(20+r()*140), color:cols[Math.floor(r()*cols.length)], opacity:Math.round(20+r()*60), rotation:Math.round(r()*360), seed:Math.floor(r()*9999), blend:pick(BLENDS)};
    setS(setIn(S,'layerA',newA));
  };
  const veil = hasImage?'':'disabled-veil';
  return (
    <>
      <Section title="Generator" hint="⚄ Randomize" onHint={randomize}>
        <p className="field-val" style={{lineHeight:1.5}}>Stack up to two procedural pattern layers over your image. Hit Randomize for happy accidents.</p>
      </Section>
      <div className={veil}>
        <LayerControls L={S.layerA} set={setLayer('layerA')} name="Layer A" />
        <LayerControls L={S.layerB} set={setLayer('layerB')} name="Layer B" />
      </div>
    </>
  );
}

// ============ HERO COMPOSER PANEL ============
const HERO_TEMPLATES = [{v:'fullbleed',label:'Full Bleed'},{v:'split-left',label:'Split — Left'},{v:'split-right',label:'Split — Right'},{v:'inset-circle',label:'Inset Circle'},{v:'top-banner',label:'Top Banner'},{v:'edge-frame',label:'Edge Frame'}];
const TPL_ICONS = {
  fullbleed:<><rect x="3" y="5" width="54" height="30" fill="currentColor" opacity="0.3"/><rect x="6" y="26" width="20" height="3" fill="currentColor"/></>,
  'split-left':<><rect x="3" y="5" width="26" height="30" fill="currentColor" opacity="0.5"/><rect x="31" y="5" width="26" height="30" fill="currentColor" opacity="0.2"/></>,
  'split-right':<><rect x="3" y="5" width="26" height="30" fill="currentColor" opacity="0.2"/><rect x="31" y="5" width="26" height="30" fill="currentColor" opacity="0.5"/></>,
  'inset-circle':<><rect x="3" y="5" width="54" height="30" fill="currentColor" opacity="0.2"/><circle cx="30" cy="18" r="9" fill="currentColor" opacity="0.5"/></>,
  'top-banner':<><rect x="3" y="5" width="54" height="18" fill="currentColor" opacity="0.3"/><rect x="3" y="23" width="54" height="12" fill="currentColor" opacity="0.5"/></>,
  'edge-frame':<><rect x="3" y="5" width="54" height="30" fill="currentColor" opacity="0.4"/><rect x="9" y="9" width="42" height="22" fill="none" stroke="currentColor" strokeWidth="1.5"/></>,
};

function HeroComposerPanel({ S, setS, hasImage }) {
  const [bi, setBi] = uS(0);
  const f=(p,v)=>setS(setIn(S,p,v));
  const b=S.blocks[bi];
  const setB=(key,v)=>{ const arr=[...S.blocks]; arr[bi]={...arr[bi],[key]:v}; f('blocks',arr); };
  const showBlock = ['split-left','split-right','inset-circle','top-banner','edge-frame'].includes(S.template);
  const veil = hasImage?'':'disabled-veil';
  return (
    <>
      <Section title="Layout Template">
        <div className="preset-grid">
          {HERO_TEMPLATES.map(t=>(
            <button key={t.v} className={'preset-btn'+(S.template===t.v?' on':'')} onClick={()=>f('template',t.v)}>
              <svg viewBox="0 0 60 40">{TPL_ICONS[t.v]}</svg>
              <span className="lbl">{t.label}</span>
            </button>
          ))}
        </div>
      </Section>
      <div className={veil}>
      <Section title="Image Framing">
        <Slider label="Image zoom" value={S.imageZoom} min={50} max={200} unit="%" onChange={v=>f('imageZoom',v)} />
        <Slider label="Offset X" value={S.imageOffX} min={-300} max={300} unit="px" onChange={v=>f('imageOffX',v)} />
        <Slider label="Offset Y" value={S.imageOffY} min={-300} max={300} unit="px" onChange={v=>f('imageOffY',v)} />
      </Section>
      <Section title="Text Blocks">
        <Segmented value={String(bi)} options={[{v:'0',label:'Headline'},{v:'1',label:'Sub'},{v:'2',label:'Caption'}]} onChange={v=>setBi(+v)} />
        <Toggle label="Show this block" value={b.on} onChange={v=>setB('on',v)} />
        {b.on && <>
          <TextInput label="Content" value={b.text} onChange={v=>setB('text',v)} />
          <Dropdown label="Font" value={b.font} options={FONT_LIST} onChange={v=>setB('font',v)} />
          <Dropdown label="Weight" value={b.weight} options={Object.keys(WEIGHTS)} onChange={v=>setB('weight',v)} />
          <Slider label="Font size" value={b.size} min={10} max={260} unit="px" onChange={v=>setB('size',v)} />
          <Slider label="Letter spacing" value={b.spacing} min={-5} max={30} unit="px" onChange={v=>setB('spacing',v)} />
          <ColorField label="Color" value={b.color} onChange={v=>setB('color',v)} />
          <Slider label="Position X" value={b.x} min={0} max={100} unit="%" onChange={v=>setB('x',v)} />
          <Slider label="Position Y" value={b.y} min={0} max={100} unit="%" onChange={v=>setB('y',v)} />
          <Dropdown label="Transform" value={b.transform} options={[{v:'none',label:'None'},{v:'uppercase',label:'Uppercase'},{v:'lowercase',label:'Lowercase'}]} onChange={v=>setB('transform',v)} />
          <Slider label="Opacity" value={b.opacity} min={0} max={100} unit="%" onChange={v=>setB('opacity',v)} />
        </>}
      </Section>
      {showBlock &&
      <Section title="Color Block" collapsible>
        <ColorField label="Block color" value={S.block.color} onChange={v=>f('block.color',v)} />
        <Slider label="Block opacity" value={S.block.opacity} min={0} max={100} unit="%" onChange={v=>f('block.opacity',v)} />
        {(S.template==='split-left'||S.template==='split-right') && <Slider label="Block width" value={S.block.width} min={20} max={80} unit="%" onChange={v=>f('block.width',v)} />}
      </Section>}
      <Section title="Rule Line" collapsible>
        <Toggle label="Horizontal rule" value={S.rule.enabled} onChange={v=>f('rule.enabled',v)} />
        {S.rule.enabled && <>
          <Slider label="Position Y" value={S.rule.y} min={0} max={100} unit="%" onChange={v=>f('rule.y',v)} />
          <ColorField label="Color" value={S.rule.color} onChange={v=>f('rule.color',v)} />
          <Slider label="Thickness" value={S.rule.thickness} min={1} max={10} unit="px" onChange={v=>f('rule.thickness',v)} />
          <Slider label="Width" value={S.rule.width} min={10} max={100} unit="%" onChange={v=>f('rule.width',v)} />
          <Dropdown label="Style" value={S.rule.style} options={['solid','dashed','double']} onChange={v=>f('rule.style',v)} />
        </>}
      </Section>
      </div>
    </>
  );
}

Object.assign(window, { setIn, FramePanel, DrawingStudioPanel, GeoGeneratorPanel, HeroComposerPanel });
