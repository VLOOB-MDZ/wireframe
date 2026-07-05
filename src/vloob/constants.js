// ---- VLOOB global defaults & module state shapes ----

export const CANVAS_FONTS = {
  Mono:      '"JetBrains Mono", monospace',
  Sans:      '"Space Grotesk", sans-serif',
  Serif:     '"Spectral", serif',
  Display:   '"Bebas Neue", sans-serif',
  Condensed: '"Oswald", sans-serif',
  Wide:      '"Archivo", sans-serif',
  Heavy:     '"Archivo", sans-serif',     // weight 900
  Grotesk:   '"Space Grotesk", sans-serif',
};
export const FONT_LIST = Object.keys(CANVAS_FONTS);

export const WEIGHTS = { Light: 300, Regular: 400, Medium: 500, Bold: 700, Black: 900 };

export const COLOR_PRESETS = ['#ffffff','#000000','#f5c518','#ff4d2e','#2ee6a8','#3b82f6','#a855f7','#ff7ab8',
                       '#0c0c0c','#1b1b1b','#666666','#e5e5e5','#ffd400','#00e0ff','#ff006a','#7cff00'];

// Reframe shape presets: each sets shape + inset + radius + border width
export const FRAME_PRESETS = {
  'Full Bleed':   { shape:'fill',     inset:0,  radius:0,  borderWidth:0 },
  'Circle Badge': { shape:'circle',   inset:7,  radius:0,  borderWidth:3 },
  'Rounded Card': { shape:'rounded',  inset:6,  radius:14, borderWidth:0 },
  'Square Inset': { shape:'square',   inset:10, radius:0,  borderWidth:4 },
  'Portrait':     { shape:'portrait', inset:6,  radius:0,  borderWidth:0 },
  'Arch':         { shape:'arch',     inset:6,  radius:0,  borderWidth:3 },
};

export function makeDefaults() {
  return {
    frame: {
      shape:'fill', fit:'cover', zoom:100, offsetX:0, offsetY:0, inset:0, radius:14,
      border: { width:0, color:'#ffffff', style:'solid' },
      crosshair: { enabled:false, type:'full', color:'#ffffff', opacity:60, thickness:1, dot:true, dotSize:6 },
    },
    drawing: {
      tool: 'pen',
      strokeColor: '#ffffff', fillColor: 'transparent', strokeWidth: 3, opacity: 100,
      lineCap: 'round', smooth: true, filled: false,
      textFont: 'Mono', textSize: 48,
      layerOpacity: 100,
      strokes: [],
    },
    geo: {
      layerA: { enabled:true, type:'grid', cell:60, thickness:1, color:'#ffffff', opacity:30, blend:'normal', rotation:0, offX:0, offY:0, seed:1 },
      layerB: { enabled:false, type:'dots', cell:40, thickness:2, color:'#f5c518', opacity:40, blend:'normal', rotation:0, offX:0, offY:0, seed:7 },
    },
    hero: {
      template: 'fullbleed',
      blocks: [
        { on:true, text:'VLOOB', font:'Display', size:150, weight:'Black', spacing:2, color:'#ffffff', x:6, y:78, transform:'uppercase', opacity:100 },
        { on:true, text:'Genesis System .01', font:'Mono', size:30, weight:'Regular', spacing:1, color:'#f5c518', x:6, y:90, transform:'uppercase', opacity:100 },
        { on:false, text:'Brand asset / 2026', font:'Mono', size:18, weight:'Regular', spacing:1, color:'#ffffff', x:6, y:95, transform:'uppercase', opacity:80 },
      ],
      block: { color:'#0c0c0c', opacity:100, width:50 },
      rule: { enabled:false, y:90, color:'#ffffff', thickness:1, width:100, style:'solid' },
      imageZoom:100, imageOffX:0, imageOffY:0,
    },
    global: { backgroundColor:'#0c0c0c', includeBackground:true,
      grade: { enabled:false, duotone:true, shadowColor:'#0c3a47', highlightColor:'#ff5a2e',
               intensity:100, grain:32, fade:12, vignette:34, frame:true, frameColor:'#e8e8e8', frameInset:6.5, frameLabels:true } },
  };
}

// curated duotone palettes [shadow, highlight] for the Style Lab randomizer
export const PALETTES = [
  ['#0c3a47','#ff5a2e'], // teal / ember  (reference)
  ['#10233f','#f5c518'], // cobalt / gold
  ['#2a1240','#2ee6a8'], // plum / mint
  ['#0a0a0a','#f0f0f0'], // carbon / chalk
  ['#3a0d33','#00e0ff'], // magenta / cyan
  ['#3a1a0d','#7fb2ff'], // rust / sky
  ['#08291c','#9cff57'], // forest / lime
  ['#241024','#ff7ab8'], // aubergine / rose
];
export const PALETTE_NAMES = ['Teal / Ember','Cobalt / Gold','Plum / Mint','Carbon / Chalk','Magenta / Cyan','Rust / Sky','Forest / Lime','Aubergine / Rose'];
