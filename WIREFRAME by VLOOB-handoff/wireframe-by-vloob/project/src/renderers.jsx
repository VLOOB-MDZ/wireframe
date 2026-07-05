// ---- VLOOB canvas renderers (pure functions) ----
const { CANVAS_FONTS, WEIGHTS } = window.VLOOB;

// deterministic PRNG
function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function hexA(hex, opacityPct) {
  const o = Math.round(Math.max(0,Math.min(100,opacityPct))/100*255).toString(16).padStart(2,'0');
  if (!hex || hex==='transparent') return 'transparent';
  let h = hex.replace('#',''); if (h.length===3) h = h.split('').map(c=>c+c).join('');
  return '#'+h.slice(0,6)+o;
}

// cover-draw an image into rect (sx/sy cover crop + zoom + offset)
function drawCover(ctx, img, dx, dy, dw, dh, zoom=1, offX=0, offY=0) {
  if (!img) return;
  const ir = img.width/img.height, rr = dw/dh;
  let sw, sh;
  if (ir > rr) { sh = img.height; sw = sh*rr; } else { sw = img.width; sh = sw/rr; }
  sw /= zoom; sh /= zoom;
  let sx = (img.width - sw)/2 - offX*(img.width/dw);
  let sy = (img.height - sh)/2 - offY*(img.height/dh);
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function dash(ctx, style, t) {
  if (style==='dashed') ctx.setLineDash([t*4, t*4]);
  else if (style==='dotted') ctx.setLineDash([t, t*2.2]);
  else ctx.setLineDash([]);
}

function placeholderBG(ctx, W, H) {
  ctx.fillStyle = '#161616'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle = '#242424'; ctx.lineWidth = 2;
  for (let i=-H; i<W; i+=46) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i+H,H); ctx.stroke(); }
  ctx.fillStyle = '#3a3a3a'; ctx.font = '600 22px "JetBrains Mono", monospace';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('NO IMAGE', W/2, H/2);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
}

function hexToRgb(h){ h=(h||'#000000').replace('#',''); if(h.length===3)h=h.split('').map(c=>c+c).join('');
  return { r:parseInt(h.slice(0,2),16)||0, g:parseInt(h.slice(2,4),16)||0, b:parseInt(h.slice(4,6),16)||0 }; }

// ---- color grade: duotone gradient-map + fade (run right after the image, before overlays) ----
function gradeImage(ctx, W, H, gr) {
  if (!gr || !gr.enabled || !gr.duotone) return;
  const sh = hexToRgb(gr.shadowColor), hi = hexToRgb(gr.highlightColor);
  const inten = gr.intensity/100, lift = gr.fade/100*55;
  let id; try { id = ctx.getImageData(0,0,W,H); } catch(e){ return; }
  const d = id.data;
  for (let i=0;i<d.length;i+=4){
    const r=d[i], g=d[i+1], b=d[i+2];
    let t=(0.299*r+0.587*g+0.114*b)/255; t=t*t*(3-2*t);
    let nr=sh.r+(hi.r-sh.r)*t+lift, ng=sh.g+(hi.g-sh.g)*t+lift, nb=sh.b+(hi.b-sh.b)*t+lift;
    d[i]=r+(nr-r)*inten; d[i+1]=g+(ng-g)*inten; d[i+2]=b+(nb-b)*inten;
  }
  ctx.putImageData(id,0,0);
}

let _noise=null;
function getNoise(){ if(_noise) return _noise; const n=document.createElement('canvas'); n.width=n.height=220;
  const c=n.getContext('2d'); const id=c.createImageData(220,220), d=id.data;
  for(let i=0;i<d.length;i+=4){ const v=Math.random()*255; d[i]=d[i+1]=d[i+2]=v; d[i+3]=255; }
  c.putImageData(id,0,0); _noise=n; return n; }

// ---- finishing pass: vignette, grain, frame + micro labels (run last, over everything) ----
function finishCanvas(ctx, W, H, gr) {
  if (!gr || !gr.enabled) return;
  if (gr.vignette>0){
    const grd=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.32,W/2,H/2,Math.max(W,H)*0.62);
    grd.addColorStop(0,'rgba(0,0,0,0)'); grd.addColorStop(1,`rgba(0,0,0,${gr.vignette/100})`);
    ctx.save(); ctx.fillStyle=grd; ctx.fillRect(0,0,W,H); ctx.restore();
  }
  if (gr.grain>0){
    const n=getNoise(); ctx.save(); ctx.globalAlpha=gr.grain/100; ctx.globalCompositeOperation='overlay';
    for(let y=0;y<H;y+=220) for(let x=0;x<W;x+=220) ctx.drawImage(n,x,y);
    ctx.restore();
  }
  if (gr.frame){
    const m=gr.frameInset/100*Math.min(W,H);
    ctx.save(); ctx.strokeStyle=gr.frameColor; ctx.globalAlpha=0.85; ctx.lineWidth=Math.max(1,W/900); ctx.setLineDash([]);
    ctx.strokeRect(m,m,W-2*m,H-2*m);
    if (gr.frameLabels){
      ctx.fillStyle=gr.frameColor; ctx.globalAlpha=0.78;
      const fs=Math.max(9,Math.round(W/100)); ctx.font=`${fs}px "JetBrains Mono", monospace`; ctx.textBaseline='alphabetic';
      ctx.textAlign='left';  ctx.fillText('VLOOB // GENESIS SYSTEM', m+10, m+fs+4);
      ctx.textAlign='right'; ctx.fillText('FIG.01 / REV β', W-m-10, m+fs+4);
      ctx.textAlign='left';  ctx.fillText('LAT 1.3521  LNG 103.8198', m+10, H-m-8);
      ctx.textAlign='right'; ctx.fillText('AUTO-RENDER', W-m-10, H-m-8);
      ctx.textAlign='left';
    }
    ctx.restore();
  }
}

// ---- schematic overlay: technical line-art with nodes + annotation labels ----
const SCHEMA_WORDS=['NODE','SECTOR','GENESIS','VLOOB','AXIS','GRID','REF','VEC','SYS','ORB','LINK','BASE','PT','SCAN','TRACE'];
function pad2(n){ return String(n).padStart(2,'0'); }
function makeLabel(rnd){
  const r=rnd(); const L=()=>String.fromCharCode(65+Math.floor(rnd()*26));
  if (r<0.3) return SCHEMA_WORDS[Math.floor(rnd()*SCHEMA_WORDS.length)]+'-'+pad2(Math.floor(rnd()*99));
  if (r<0.58) return pad2(Math.floor(rnd()*99))+'.'+pad2(Math.floor(rnd()*99));
  if (r<0.82) return L()+L()+'-'+pad2(Math.floor(rnd()*99));
  return SCHEMA_WORDS[Math.floor(rnd()*SCHEMA_WORDS.length)];
}
function drawSchematic(ctx, L, W, H){
  const rnd=rng((L.seed||1)*7+13);
  ctx.save();
  ctx.globalAlpha=L.opacity/100; ctx.strokeStyle=L.color; ctx.fillStyle=L.color; ctx.lineWidth=L.thickness||1;
  ctx.setLineDash([]); ctx.lineJoin='round';
  const fs=Math.max(8,Math.round(Math.min(W,H)/96)); ctx.font=`${fs}px "JetBrains Mono", monospace`; ctx.textBaseline='middle';
  const minWH=Math.min(W,H);
  // large arcs / rings
  const big=2+Math.floor(rnd()*3);
  for(let i=0;i<big;i++){
    const cx=W*(0.2+rnd()*0.6), cy=H*(0.2+rnd()*0.6), r=minWH*(0.08+rnd()*0.26);
    ctx.beginPath();
    if(rnd()<0.45){ const a0=rnd()*6.28, a1=a0+1.2+rnd()*3.8; ctx.arc(cx,cy,r,a0,a1); }
    else ctx.arc(cx,cy,r,0,6.2832);
    ctx.stroke();
    if(rnd()<0.5){ ctx.beginPath(); ctx.arc(cx,cy,r*0.62,0,6.2832); ctx.stroke(); }
    const t=8; ctx.beginPath(); ctx.moveTo(cx-t,cy); ctx.lineTo(cx+t,cy); ctx.moveTo(cx,cy-t); ctx.lineTo(cx,cy+t); ctx.stroke();
  }
  // node network
  const N=9+Math.floor(rnd()*9), nodes=[];
  for(let i=0;i<N;i++) nodes.push({x:W*(0.08+0.84*rnd()), y:H*(0.1+0.8*rnd())});
  ctx.beginPath();
  nodes.forEach((n,i)=>{ if(i===0) ctx.moveTo(n.x,n.y);
    else { const p=nodes[i-1]; if(rnd()<0.6){ ctx.lineTo(n.x,p.y); ctx.lineTo(n.x,n.y); } else ctx.lineTo(n.x,n.y); } });
  ctx.stroke();
  nodes.forEach(n=>{
    ctx.beginPath(); ctx.arc(n.x,n.y,Math.max(2,(L.thickness||1)*1.6),0,6.2832); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(n.x,n.y-5); ctx.lineTo(n.x,n.y-11); ctx.stroke();
    if(rnd()<0.85) ctx.fillText(makeLabel(rnd), n.x+8, n.y-1);
  });
  const extra=3+Math.floor(rnd()*4);
  for(let i=0;i<extra;i++) ctx.fillText(makeLabel(rnd), W*(0.06+0.86*rnd()), H*(0.1+0.8*rnd()));
  ctx.restore();
}

// ============ REFRAME (crop · resize · border) ============
function framePath(ctx, shape, x, y, w, h, radius) {
  ctx.beginPath();
  const r = Math.min(radius, w/2, h/2);
  if (shape==='circle') {
    ctx.ellipse(x+w/2, y+h/2, w/2, h/2, 0, 0, Math.PI*2);
  } else if (shape==='rounded') {
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
  } else if (shape==='diamond') {
    ctx.moveTo(x+w/2,y); ctx.lineTo(x+w,y+h/2); ctx.lineTo(x+w/2,y+h); ctx.lineTo(x,y+h/2); ctx.closePath();
  } else if (shape==='hexagon') {
    const cx=x+w/2, cy=y+h/2, rx=w/2, ry=h/2;
    for (let i=0;i<6;i++){ const a=Math.PI/180*(60*i-30); const px=cx+rx*Math.cos(a), py=cy+ry*Math.sin(a); i?ctx.lineTo(px,py):ctx.moveTo(px,py); }
    ctx.closePath();
  } else if (shape==='arch') {
    const ar = Math.min(w/2, h);
    ctx.moveTo(x, y+h); ctx.lineTo(x, y+ar); ctx.arc(x+w/2, y+ar, w/2, Math.PI, 0, false);
    ctx.lineTo(x+w, y+h); ctx.closePath();
  } else { // rect / fill / square / portrait — plain rectangle
    ctx.rect(x,y,w,h);
  }
}

function frameRegion(shape, W, H, insetPct) {
  const m = insetPct/100 * Math.min(W,H);
  const aw = W - 2*m, ah = H - 2*m;
  const squareLike = ['circle','square','diamond','hexagon'].includes(shape);
  const tall = ['portrait','arch'].includes(shape);
  let w=aw, h=ah;
  if (squareLike) { const s=Math.min(aw,ah); w=s; h=s; }
  else if (tall) { const ratio=4/5; if (aw/ah > ratio){ h=ah; w=ah*ratio; } else { w=aw; h=aw/ratio; } }
  return { x: (W-w)/2, y: (H-h)/2, w, h };
}

function renderFrame(ctx, S, img, W, H, g) {
  if (g.includeBackground) { ctx.fillStyle = g.backgroundColor; ctx.fillRect(0,0,W,H); }
  const reg = frameRegion(S.shape, W, H, S.inset);
  const radius = S.radius/100 * Math.min(reg.w, reg.h);

  // clip to shape, then place the (resized) image
  ctx.save();
  framePath(ctx, S.shape, reg.x, reg.y, reg.w, reg.h, radius);
  ctx.clip();
  if (img) {
    if (S.fit==='contain') {
      const ir=img.width/img.height, rr=reg.w/reg.h;
      let dw,dh; if (ir>rr){ dw=reg.w; dh=dw/ir; } else { dh=reg.h; dw=dh*ir; }
      dw*=S.zoom/100; dh*=S.zoom/100;
      ctx.drawImage(img, reg.x+(reg.w-dw)/2+S.offsetX, reg.y+(reg.h-dh)/2+S.offsetY, dw, dh);
    } else {
      drawCover(ctx, img, reg.x, reg.y, reg.w, reg.h, S.zoom/100, S.offsetX, S.offsetY);
    }
  } else { placeholderBG(ctx, W, H); }
  ctx.restore();

  gradeImage(ctx, W, H, g.grade);

  // border along the shape
  if (S.border.width>0) {
    ctx.save(); ctx.strokeStyle=S.border.color; ctx.lineWidth=S.border.width; dash(ctx, S.border.style, S.border.width);
    framePath(ctx, S.shape, reg.x, reg.y, reg.w, reg.h, radius); ctx.stroke(); ctx.restore();
  }

  // optional schematic crosshair (kept from VLOOB identity)
  if (S.crosshair && S.crosshair.enabled) {
    const ch = S.crosshair;
    const cx=reg.x+reg.w/2, cy=reg.y+reg.h/2, span={x0:reg.x,y0:reg.y,x1:reg.x+reg.w,y1:reg.y+reg.h};
    const r=Math.min(reg.w,reg.h)/2;
    ctx.save(); ctx.globalAlpha=ch.opacity/100; ctx.strokeStyle=ch.color; ctx.lineWidth=ch.thickness; ctx.fillStyle=ch.color;
    const drawCross = () => { ctx.beginPath(); ctx.moveTo(cx,span.y0); ctx.lineTo(cx,span.y1); ctx.moveTo(span.x0,cy); ctx.lineTo(span.x1,cy); ctx.stroke(); };
    if (ch.type==='full') { ctx.setLineDash([]); drawCross(); }
    else if (ch.type==='dotdash') { ctx.setLineDash([10,5,2,5]); drawCross(); ctx.setLineDash([]); }
    else if (ch.type==='segments') {
      const gap=r*0.4; ctx.setLineDash([]); ctx.beginPath();
      ctx.moveTo(cx,span.y0); ctx.lineTo(cx,cy-gap); ctx.moveTo(cx,cy+gap); ctx.lineTo(cx,span.y1);
      ctx.moveTo(span.x0,cy); ctx.lineTo(cx-gap,cy); ctx.moveTo(cx+gap,cy); ctx.lineTo(span.x1,cy); ctx.stroke();
    } else if (ch.type==='corner') {
      const mm=Math.min(reg.w,reg.h)*0.12; ctx.setLineDash([]);
      const corner=(x,y,dx,dy)=>{ ctx.beginPath(); ctx.moveTo(x,y+dy*mm); ctx.lineTo(x,y); ctx.lineTo(x+dx*mm,y); ctx.stroke(); };
      corner(span.x0,span.y0,1,1); corner(span.x1,span.y0,-1,1); corner(span.x0,span.y1,1,-1); corner(span.x1,span.y1,-1,-1);
    }
    if (ch.dot) { ctx.setLineDash([]); ctx.beginPath(); ctx.arc(cx,cy,ch.dotSize,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  }
}

// ============ DRAWING STUDIO ============
function strokePath(ctx, st) {
  ctx.save();
  ctx.globalAlpha = (st.opacity ?? 100)/100;
  ctx.strokeStyle = st.strokeColor; ctx.lineWidth = st.strokeWidth;
  ctx.lineCap = st.lineCap || 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]);
  const fill = st.fillColor && st.fillColor !== 'transparent';
  if (fill) ctx.fillStyle = st.fillColor;
  const pts = st.points || [];
  if (st.tool === 'pen' || st.tool === 'eraser') {
    if (st.tool==='eraser') ctx.globalCompositeOperation = 'destination-out';
    if (pts.length < 2) { if(pts.length===1){ctx.beginPath();ctx.arc(pts[0].x,pts[0].y,st.strokeWidth/2,0,7);ctx.fillStyle=st.strokeColor;ctx.fill();} ctx.restore(); return; }
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    if (st.smooth) for (let i=1;i<pts.length-1;i++){ const xc=(pts[i].x+pts[i+1].x)/2, yc=(pts[i].y+pts[i+1].y)/2; ctx.quadraticCurveTo(pts[i].x,pts[i].y,xc,yc); }
    else for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
    ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y); ctx.stroke();
  } else if (st.tool === 'line') {
    ctx.beginPath(); ctx.moveTo(st.x0,st.y0); ctx.lineTo(st.x1,st.y1); ctx.stroke();
  } else if (st.tool === 'rect') {
    const x=Math.min(st.x0,st.x1), y=Math.min(st.y0,st.y1), w=Math.abs(st.x1-st.x0), h=Math.abs(st.y1-st.y0);
    if (fill) ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h);
  } else if (st.tool === 'circle') {
    const cx=(st.x0+st.x1)/2, cy=(st.y0+st.y1)/2, rx=Math.abs(st.x1-st.x0)/2, ry=Math.abs(st.y1-st.y0)/2;
    ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); if (fill) ctx.fill(); ctx.stroke();
  } else if (st.tool === 'arrow') {
    ctx.beginPath(); ctx.moveTo(st.x0,st.y0); ctx.lineTo(st.x1,st.y1); ctx.stroke();
    const ang=Math.atan2(st.y1-st.y0, st.x1-st.x0), hl=Math.max(12, st.strokeWidth*4);
    ctx.beginPath(); ctx.moveTo(st.x1,st.y1); ctx.lineTo(st.x1-hl*Math.cos(ang-0.4), st.y1-hl*Math.sin(ang-0.4));
    ctx.moveTo(st.x1,st.y1); ctx.lineTo(st.x1-hl*Math.cos(ang+0.4), st.y1-hl*Math.sin(ang+0.4)); ctx.stroke();
  } else if (st.tool === 'text') {
    ctx.fillStyle = st.strokeColor; ctx.textBaseline='top';
    ctx.font = `${st.textSize}px ${CANVAS_FONTS[st.textFont]||CANVAS_FONTS.Mono}`;
    ctx.fillText(st.text || '', st.x0, st.y0);
  }
  ctx.restore();
}

function renderDrawing(ctx, S, img, W, H, g, live) {
  if (g.includeBackground) { ctx.fillStyle = g.backgroundColor; ctx.fillRect(0,0,W,H); }
  if (img) drawCover(ctx, img, 0,0,W,H); else placeholderBG(ctx,W,H);
  gradeImage(ctx, W, H, g.grade);
  ctx.save(); ctx.globalAlpha = S.layerOpacity/100;
  // committed strokes onto a temp layer so layerOpacity applies to whole layer
  const layer = document.createElement('canvas'); layer.width=W; layer.height=H;
  const lctx = layer.getContext('2d');
  (S.strokes||[]).forEach(st => strokePath(lctx, st));
  if (live) strokePath(lctx, live);
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

// ============ GEO GENERATOR ============
function drawPattern(ctx, L, W, H) {
  if (!L.enabled) return;
  if (L.type==='schematic') { drawSchematic(ctx, L, W, H); return; }
  ctx.save();
  ctx.globalAlpha = L.opacity/100;
  ctx.globalCompositeOperation = ({normal:'source-over',multiply:'multiply',screen:'screen',overlay:'overlay',difference:'difference',dodge:'color-dodge'})[L.blend] || 'source-over';
  ctx.strokeStyle = L.color; ctx.fillStyle = L.color; ctx.lineWidth = L.thickness; ctx.setLineDash([]);
  const cx=W/2, cy=H/2;
  ctx.translate(cx + L.offX/100*W, cy + L.offY/100*H);
  ctx.rotate(L.rotation*Math.PI/180);
  ctx.translate(-cx, -cy);
  const cell = Math.max(6, L.cell), R = Math.hypot(W,H);
  const ext = (n)=> n; // range helper
  if (L.type==='grid') {
    for (let x=-R; x<=W+R; x+=cell){ ctx.beginPath(); ctx.moveTo(x,-R); ctx.lineTo(x,H+R); ctx.stroke(); }
    for (let y=-R; y<=H+R; y+=cell){ ctx.beginPath(); ctx.moveTo(-R,y); ctx.lineTo(W+R,y); ctx.stroke(); }
  } else if (L.type==='dots') {
    for (let x=-R; x<=W+R; x+=cell) for (let y=-R; y<=H+R; y+=cell){ ctx.beginPath(); ctx.arc(x,y,L.thickness*1.4,0,Math.PI*2); ctx.fill(); }
  } else if (L.type==='triangle') {
    for (let y=-R; y<=H+R; y+=cell){ let row=Math.round((y+R)/cell);
      for (let x=-R; x<=W+R; x+=cell){ const ox=row%2?cell/2:0;
        ctx.beginPath(); ctx.moveTo(x+ox,y); ctx.lineTo(x+ox+cell,y); ctx.lineTo(x+ox+cell/2,y+cell); ctx.closePath(); ctx.stroke(); } }
  } else if (L.type==='rings') {
    for (let r=cell; r<R; r+=cell){ ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke(); }
  } else if (L.type==='radial') {
    const n=Math.max(6, Math.round(360/(cell/8))); for (let i=0;i<n;i++){ const a=i/n*Math.PI*2; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*R, cy+Math.sin(a)*R); ctx.stroke(); }
  } else if (L.type==='hexagon') {
    const s=cell/2, hh=Math.sqrt(3)*s;
    for (let row=-2, y=-R; y<=H+R; y+=hh, row++){ const ox=row%2?s*1.5:0;
      for (let x=-R; x<=W+R; x+=s*3){ ctx.beginPath();
        for (let k=0;k<6;k++){ const a=Math.PI/180*(60*k); const px=x+ox+s*Math.cos(a), py=y+s*Math.sin(a); k?ctx.lineTo(px,py):ctx.moveTo(px,py); }
        ctx.closePath(); ctx.stroke(); } }
  } else if (L.type==='scatter') {
    const rnd=rng(L.seed||1); const n=Math.round((W*H)/(cell*cell));
    for (let i=0;i<n;i++){ const x=rnd()*W, y=rnd()*H, sz=cell*0.18*(0.5+rnd()), k=Math.floor(rnd()*3);
      ctx.beginPath();
      if (k===0) ctx.arc(x,y,sz,0,Math.PI*2);
      else if (k===1) ctx.rect(x-sz,y-sz,sz*2,sz*2);
      else { ctx.moveTo(x,y-sz); ctx.lineTo(x+sz,y+sz); ctx.lineTo(x-sz,y+sz); ctx.closePath(); }
      ctx.stroke(); }
  } else if (L.type==='diagonal') {
    for (let x=-R; x<=W+R; x+=cell){ ctx.beginPath(); ctx.moveTo(x,-R); ctx.lineTo(x+R, H+R); ctx.stroke(); }
  }
  ctx.restore();
}

function renderGeo(ctx, S, img, W, H, g) {
  if (g.includeBackground) { ctx.fillStyle = g.backgroundColor; ctx.fillRect(0,0,W,H); }
  if (img) drawCover(ctx, img, 0,0,W,H); else placeholderBG(ctx,W,H);
  gradeImage(ctx, W, H, g.grade);
  drawPattern(ctx, S.layerA, W, H);
  drawPattern(ctx, S.layerB, W, H);
}

// ============ HERO COMPOSER ============
function drawText(ctx, b, W, H) {
  if (!b.on) return;
  let txt = b.text || '';
  if (b.transform==='uppercase') txt = txt.toUpperCase();
  else if (b.transform==='lowercase') txt = txt.toLowerCase();
  ctx.save();
  ctx.globalAlpha = b.opacity/100; ctx.fillStyle = b.color;
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  try { ctx.letterSpacing = b.spacing + 'px'; } catch(e){}
  ctx.font = `${WEIGHTS[b.weight]||400} ${b.size}px ${CANVAS_FONTS[b.font]||CANVAS_FONTS.Sans}`;
  ctx.fillText(txt, b.x/100*W, b.y/100*H);
  try { ctx.letterSpacing = '0px'; } catch(e){}
  ctx.restore();
}

function renderHero(ctx, S, img, W, H, g) {
  ctx.fillStyle = g.includeBackground ? g.backgroundColor : '#0c0c0c';
  if (g.includeBackground) ctx.fillRect(0,0,W,H);
  const T = S.template, blk = S.block;
  const drawImg = (x,y,w,h)=> img ? drawCover(ctx,img,x,y,w,h,S.imageZoom/100,S.imageOffX,S.imageOffY) : (ctx.fillStyle='#161616',ctx.fillRect(x,y,w,h));

  if (T==='fullbleed') {
    drawImg(0,0,W,H);
  } else if (T==='split-left') {
    const bw = blk.width/100*W; drawImg(bw,0,W-bw,H);
    ctx.save(); ctx.globalAlpha=blk.opacity/100; ctx.fillStyle=blk.color; ctx.fillRect(0,0,bw,H); ctx.restore();
  } else if (T==='split-right') {
    const bw = blk.width/100*W; drawImg(0,0,W-bw,H);
    ctx.save(); ctx.globalAlpha=blk.opacity/100; ctx.fillStyle=blk.color; ctx.fillRect(W-bw,0,bw,H); ctx.restore();
  } else if (T==='inset-circle') {
    ctx.save(); ctx.globalAlpha=blk.opacity/100; ctx.fillStyle=blk.color; ctx.fillRect(0,0,W,H); ctx.restore();
    const r=Math.min(W,H)*0.32, cx=W/2, cy=H*0.4;
    ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.clip(); drawImg(cx-r,cy-r,r*2,r*2); ctx.restore();
    ctx.strokeStyle='#ffffff'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
  } else if (T==='top-banner') {
    drawImg(0,0,W,H*0.6);
    ctx.save(); ctx.globalAlpha=blk.opacity/100; ctx.fillStyle=blk.color; ctx.fillRect(0,H*0.6,W,H*0.4); ctx.restore();
  } else if (T==='edge-frame') {
    ctx.save(); ctx.globalAlpha=blk.opacity/100; ctx.fillStyle=blk.color; ctx.fillRect(0,0,W,H); ctx.restore();
    const m=W*0.1; drawImg(m,m,W-m*2,H-m*2);
    ctx.strokeStyle='#ffffff'; ctx.lineWidth=W*0.012; ctx.strokeRect(m,m,W-m*2,H-m*2);
  }

  gradeImage(ctx, W, H, g.grade);

  // rule
  if (S.rule.enabled) {
    const r=S.rule; ctx.save(); ctx.strokeStyle=r.color; ctx.lineWidth=r.thickness; dash(ctx,r.style,r.thickness);
    const y=r.y/100*H, w=r.width/100*W, x0=(W-w)/2;
    if (r.style==='double'){ ctx.beginPath(); ctx.moveTo(x0,y-r.thickness*1.5); ctx.lineTo(x0+w,y-r.thickness*1.5); ctx.moveTo(x0,y+r.thickness*1.5); ctx.lineTo(x0+w,y+r.thickness*1.5); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x0+w,y); ctx.stroke(); }
    ctx.restore();
  }
  S.blocks.forEach(b => drawText(ctx, b, W, H));
}

// ---- dispatch ----
function renderModule(canvas, module, state, img, live) {
  const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,W,H);
  const g = state.global;
  if (module==='frame') renderFrame(ctx, state.frame, img, W, H, g);
  else if (module==='drawing') renderDrawing(ctx, state.drawing, img, W, H, g, live);
  else if (module==='geo') renderGeo(ctx, state.geo, img, W, H, g);
  else if (module==='hero') renderHero(ctx, state.hero, img, W, H, g);
  finishCanvas(ctx, W, H, g.grade);
}

window.VLOOBR = { renderModule, renderFrame, renderDrawing, renderGeo, renderHero, rng };
