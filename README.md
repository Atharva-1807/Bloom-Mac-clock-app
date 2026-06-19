# Bloom

A skeuomorphic macOS desktop clock widget that lives on your desktop and shifts through four living states — **sunrise**, **day**, **sunset**, and **night** — in sync with the actual time. Designed in Figma, built with Electron + React.

---

## Features

- Frameless, transparent, always-on-top floating pill widget (369 × 145 px)
- Real-time clock with date and weekday
- Four time-of-day states with smooth 2 s animated transitions
- Skeuomorphic design: sun, moon, stars, and clouds rendered in pure CSS + SVG
- Built-in countdown timer — swipe up with two fingers to reveal it
- Segment-based timer input (click HH, MM, or SS to edit each independently)
- Satoshi Variable typeface for a clean, modern feel

---

## Time-of-Day States

| State   | Hours              | Background                        |
|---------|--------------------|-----------------------------------|
| Sunrise | 5:00 AM – 8:00 AM  | Warm amber → orange gradient      |
| Day     | 8:00 AM – 6:00 PM  | Sky blue gradient, sun + clouds   |
| Sunset  | 6:00 PM – 8:00 PM  | Amber → orange gradient           |
| Night   | 8:00 PM – 5:00 AM  | Deep navy, moon + stars           |

---

## Timer

| Gesture / Action          | Result                              |
|---------------------------|-------------------------------------|
| Two-finger swipe **up**   | Reveal timer panel                  |
| Two-finger swipe **down** | Return to clock                     |
| Click `00:00:00`          | Enter edit mode (hours selected)    |
| Click HH / MM / SS        | Jump to that segment                |
| Type digits               | Fill selected segment, auto-advance |
| Tab / Arrow keys          | Navigate between segments           |
| Enter                     | Confirm and start countdown         |
| Escape                    | Cancel edit                         |
| ▶ (Play)                  | Start / resume timer                |
| ⏸ (Pause)                | Pause running timer                 |
| ↺ (Restart)               | Reset to the last set time          |
| 🔄 (Reset to zero)        | Clear timer back to 00:00:00        |

---

## Controls

| Action              | How                              |
|---------------------|----------------------------------|
| Move widget         | Drag anywhere on the pill        |
| Quit                | Double-click anywhere on the pill|

---

## Development Setup

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- **macOS** (Electron transparent windows require macOS for full fidelity)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/bloom.git
cd bloom

# 2. Install dependencies
npm install

# 3. Download font assets
npm run download-assets

# 4. Start development server + Electron
npm run dev
```

> Hot Module Replacement (HMR) is active — renderer changes reflect instantly without restarting Electron.

---

## Building a Distributable App

```bash
# Step 1: Compile TypeScript + bundle with Vite
npm run build

# Step 2: Package into a signed .dmg and .zip
npm run dist
```

Output files land in the `release/` directory:

```
release/
  mac-arm64/
    Bloom.app                    ← drag-to-Applications bundle
    Bloom-1.0.0-arm64.dmg        ← installer disk image
    Bloom-1.0.0-arm64-mac.zip    ← direct download archive
```

---

## First-launch note (unsigned builds)

Until the app is code-signed with an Apple Developer ID, macOS will show a security prompt on first launch. To open it:

1. Right-click `Bloom.app` → **Open**
2. Click **Open** in the dialog

Or go to **System Settings → Privacy & Security → Open Anyway** after the first blocked attempt.

---

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Shell     | Electron (latest stable)      |
| UI        | React 18 + TypeScript         |
| Build     | Vite 5 via electron-vite      |
| Styling   | Plain CSS + inline SVG        |
| Font      | Satoshi Variable (Fontshare)  |
| Packaging | electron-builder              |

---

## License

See [TERMS_OF_USE.md](./TERMS_OF_USE.md) for usage terms.
