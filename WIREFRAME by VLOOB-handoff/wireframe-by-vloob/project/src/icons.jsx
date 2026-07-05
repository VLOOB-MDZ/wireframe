// Inline SVG icon set — stroke-based, inherits currentColor.
const I = (paths, opts={}) => (p) => (
  <svg viewBox="0 0 24 24" fill={opts.fill || "none"} stroke={opts.fill ? "none" : "currentColor"}
       strokeWidth={opts.sw || 1.6} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {paths}
  </svg>
);

const Icon = {
  upload: I(<><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M5 20h14"/></>),
  download: I(<><path d="M12 4v12M12 16l-4-4M12 16l4-4"/><path d="M5 20h14"/></>),
  copy: I(<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h8"/></>),
  sliders: I(<><path d="M4 8h10M18 8h2M4 16h2M10 16h10"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/></>),
  close: I(<><path d="M6 6l12 12M18 6L6 18"/></>),
  image: I(<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></>),
  // tools
  pen: I(<><path d="M16.5 4.5l3 3L8 19l-4 1 1-4z"/></>),
  line: I(<><path d="M5 19L19 5"/></>),
  rect: I(<><rect x="4" y="6" width="16" height="12" rx="1"/></>),
  circle: I(<><circle cx="12" cy="12" r="8"/></>),
  arrow: I(<><path d="M5 19L19 5M19 5h-7M19 5v7"/></>),
  text: I(<><path d="M5 5h14M12 5v14M9 19h6"/></>),
  eraser: I(<><path d="M4 15l7-7 6 6-4 4H8z"/><path d="M3 21h18"/></>),
  hand: I(<><path d="M8 13V6a1.5 1.5 0 013 0v5m0-1V4.5a1.5 1.5 0 013 0V11m0-1.5a1.5 1.5 0 013 0V14a6 6 0 01-6 6h-1a5 5 0 01-3.6-1.5L5 15.5a1.5 1.5 0 012.2-2L9 15"/></>),
  dice: I(<><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none"/></>),
  undo: I(<><path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 015 5v0"/></>),
  redo: I(<><path d="M15 7l5 5-5 5"/><path d="M20 12H9a5 5 0 00-5 5v0"/></>),
  layers: I(<><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></>),
  revert: I(<><path d="M5 9h11a4.5 4.5 0 010 9h-4"/><path d="M5 9l4-4M5 9l4 4"/></>),
};
window.Icon = Icon;
