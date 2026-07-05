// ---- VLOOB reusable control components ----
import { useState, useRef, useEffect } from 'react';
import { COLOR_PRESETS } from '../vloob/constants.js';

export function Section({ title, hint, onHint, children, collapsible }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="section" data-collapsed={collapsible ? !open : false}>
      <div className="section-title">
        <span onClick={()=> collapsible && setOpen(o=>!o)} style={{cursor: collapsible?'pointer':'default'}}>
          {collapsible ? (open?'▾ ':'▸ ') : ''}{title}
        </span>
        {hint && <span className="hint" onClick={onHint}>{hint}</span>}
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}

export function Slider({ label, value, min, max, step=1, unit='', onChange, disabled }) {
  return (
    <div className="field">
      <div className="field-row">
        <span className="field-label">{label}</span>
        <span className="field-val">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        onChange={e=>onChange(parseFloat(e.target.value))} aria-label={label} aria-valuenow={value} />
    </div>
  );
}

export function Toggle({ label, value, onChange }) {
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <div className="toggle" data-on={!!value} role="switch" aria-checked={!!value} tabIndex={0}
        onClick={()=>onChange(!value)} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();onChange(!value);}}} aria-label={label} />
    </div>
  );
}

export function Dropdown({ label, value, options, onChange }) {
  // options: [{v,label}] or [str]
  const opts = options.map(o => typeof o==='string' ? {v:o,label:o} : o);
  return (
    <div className="field">
      {label && <div className="field-row"><span className="field-label">{label}</span></div>}
      <select className="dd" value={value} onChange={e=>onChange(e.target.value)} aria-label={label}>
        {opts.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Segmented({ label, value, options, onChange }) {
  const opts = options.map(o => typeof o==='string' ? {v:o,label:o} : o);
  return (
    <div className="field">
      {label && <div className="field-row"><span className="field-label">{label}</span></div>}
      <div className="seg">
        {opts.map(o => <button key={o.v} className={value===o.v?'on':''} onClick={()=>onChange(o.v)}>{o.label}</button>)}
      </div>
    </div>
  );
}

export function Stepper({ label, value, min, max, onChange }) {
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <div className="stepper" style={{width:96}}>
        <button onClick={()=>onChange(Math.max(min,value-1))} aria-label="decrease">–</button>
        <span className="v">{value}</span>
        <button onClick={()=>onChange(Math.min(max,value+1))} aria-label="increase">+</button>
      </div>
    </div>
  );
}

export function ColorField({ label, value, onChange, allowTransparent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    if(!open) return;
    const h = (e)=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return ()=>document.removeEventListener('mousedown', h);
  },[open]);
  const isTrans = value==='transparent' || !value;
  return (
    <div className="field-row" style={{position:'relative'}} ref={ref}>
      <span className="field-label">{label}</span>
      <div className="swatch" onClick={()=>setOpen(o=>!o)} aria-label={label+' color'} tabIndex={0}
        style={isTrans ? {background:'repeating-conic-gradient(#888 0% 25%, #444 0% 50%) 50%/8px 8px'} : {background:value}} />
      {open && (
        <div className="color-pop" style={{right:0, top:'30px'}}>
          <div className="row">
            <input type="color" value={isTrans?'#ffffff':value} onChange={e=>onChange(e.target.value)} />
            <input className="txt" value={isTrans?'transparent':value} onChange={e=>onChange(e.target.value)} style={{flex:1}} />
          </div>
          <div className="presets">
            {COLOR_PRESETS.map(c => <div key={c} style={{background:c}} title={c} onClick={()=>{onChange(c);setOpen(false);}} />)}
          </div>
          {allowTransparent && <button className="mini-btn" onClick={()=>{onChange('transparent');setOpen(false);}}>Transparent</button>}
        </div>
      )}
    </div>
  );
}

export function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div className="field">
      {label && <div className="field-row"><span className="field-label">{label}</span></div>}
      <input className="txt" value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} aria-label={label} />
    </div>
  );
}
