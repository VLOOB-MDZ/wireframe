# WIREFRAME by VLOOB — Project Context

> Isi file ini di awal setiap project baru.
> Gunakan sebagai referensi bagi Claude agar langsung paham konteks tanpa penjelasan ulang.
>
> **Aturan penting:** Selalu perbarui file ini setiap kali ada perubahan pada project —
> fitur baru, perubahan tech stack, schema data berubah, keputusan teknis baru, dsb.

---

## Gambaran Project

**Deskripsi singkat:** Brand Image Generator — mengubah foto apa pun menjadi aset brand bergaya "schematic": duotone grade, overlay line-art teknikal, frame shapes, dan komposisi hero dengan teks. Semua berjalan di browser (canvas 2D), tanpa backend.

**Pemilik / Klien:** Deo (deozulhasi00@gmail.com)

**Status:** In progress — production build siap deploy ke Vercel

---

## Struktur File

```
/
├── index.html                      # Entry HTML (fonts, meta, favicon)
├── package.json / vite.config.js   # Vite + React setup
├── public/sample.jpeg              # Gambar sample untuk landing preview
├── src/
│   ├── main.jsx                    # React root
│   ├── App.jsx                     # Main app: topbar, stage, sidebar, history, export
│   ├── styles.css                  # Seluruh styling (theme via CSS variables)
│   ├── vloob/
│   │   ├── constants.js            # Fonts, palettes, presets, makeDefaults()
│   │   └── renderers.js            # Canvas renderers murni (frame/drawing/geo/hero + grade)
│   └── components/
│       ├── icons.jsx               # SVG icon set
│       ├── controls.jsx            # Slider, Toggle, Dropdown, ColorField, dll.
│       ├── panels.jsx              # Panel kontrol per modul
│       ├── Landing.jsx             # Landing page dengan live preview
│       └── MobileStudio.jsx        # Quick Edit mode untuk layar kecil
└── WIREFRAME by VLOOB-handoff/     # Bundle asli dari Claude Design (referensi, jangan diedit)
```

---

## Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | React 18 + Vite 5 | Port dari prototype React; Vite auto-detect di Vercel |
| Rendering | Canvas 2D API | Semua komposisi image dirender ke canvas, export PNG/JPG |
| Backend / DB | — (tidak ada) | Sepenuhnya client-side; gambar user tidak pernah diupload |
| Hosting | Vercel (static) | Target handoff; `npm run build` → `dist/` |
| Fonts | Google Fonts | JetBrains Mono, Space Grotesk, Archivo, Oswald, Spectral, Bebas Neue |

---

## Fitur Utama

### 4 Modul editor (tab di topbar)
- **Reframe** — crop shape (circle/rounded/arch/dll), fit, zoom/offset, border, crosshair
- **Drawing Studio** — pen/line/rect/circle/arrow/text/eraser di atas gambar
- **Geo Generator** — 2 layer pattern prosedural (schematic, grid, dots, rings, dll.)
- **Hero Composer** — template layout + 3 text block + rule line

### Style Lab (randomizer)
- Shuffle look schematic+duotone satu klik; auto-shuffle dengan speed slider; palette lock
- Logic di `buildRandomStyle()` dalam [App.jsx](src/App.jsx)

### Sistem layer "bake"
- Pindah modul = render saat ini di-bake jadi working image (permanen), history undo/redo global (max 40 langkah, ⌘Z / ⌘⇧Z)

### Export
- PNG/JPG di ukuran canvas asli (5 preset ukuran sosial media), copy-to-clipboard

### Appearance (pengganti TweaksPanel prototype)
- Theme (carbon/ink/slate/paper), UI font, accent, density, backdrop, topbar layout
- Tersimpan ke localStorage (`wireframe-settings-v1`)

---

## Design System

**Font:** JetBrains Mono (UI) + Bebas Neue (display)

**Warna utama (theme carbon, default):**
```
bg      : #0c0c0c
surface : #141414
border  : #2a2a2a
text    : #f0f0f0
accent  : #ffffff
```

**Pola desain / catatan:**
- Semua theming via CSS custom properties di `html[data-theme=...]`
- Density mengubah --pad/--gap/--ctl-h
- Mobile ≤760px otomatis masuk Quick Edit mode (bisa force desktop)

---

## Development Workflow

```bash
# Jalankan lokal
npm run dev

# Build produksi
npm run build

# Preview build
npm run preview
```

**Deploy ke Vercel:** push repo ke GitHub → import di Vercel → framework auto-detect (Vite), build `npm run build`, output `dist/`. Tidak perlu env vars.

---

## Keputusan Teknis

| Keputusan | Alasan |
|---|---|
| Port prototype ke Vite + ES modules (bukan Babel-in-browser) | Prototype pakai CDN React + @babel/standalone — tidak layak produksi (lambat, tergantung unpkg) |
| TweaksPanel prototype diganti section "Appearance" di sidebar | TweaksPanel adalah alat design-time Claude Design; setting-nya tetap dipertahankan + dipersist ke localStorage |
| Tanpa backend | Privasi (gambar tidak diupload) & deploy gratis sebagai static site |
| Sample image di `public/` | Dirujuk sebagai `/sample.jpeg` agar path aman di produksi |

---

## Catatan Tambahan

- Folder `WIREFRAME by VLOOB-handoff/` adalah bundle desain asli — dipertahankan sebagai referensi visual, tidak dipakai runtime.
- Duotone grade pakai `getImageData` per-pixel — di canvas 1920×1080 masih oke, tapi hindari menambah ukuran canvas jauh lebih besar tanpa optimasi.
- Undo history menyimpan dataURL PNG penuh per langkah (max 40) — memory-heavy tapi sederhana; kalau jadi masalah, kompres atau simpan blob.
