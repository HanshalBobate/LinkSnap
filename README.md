<div align="center">
  <img src="icons/icon128.png" width="128" height="128" alt="LinkSnap Logo">
  
  # LinkSnap

  **Turn any LinkedIn post into a beautiful, shareable screenshot — in one click.**
</div>

LinkSnap is a Chrome extension inspired by [CodeSnap](https://marketplace.visualstudio.com/items?itemName=adpyke.codesnap) and [Ray.so](https://ray.so). It lets you capture LinkedIn posts as stunning, customizable PNG images with macOS-style window chrome, gradient backgrounds, and one-click export.

---

## ✨ Features

| Feature | Details |
|---|---|
| 📸 **One-click Snap** | A Snap button appears inline on every LinkedIn feed post |
| 🎨 **6 Themes** | macOS Light/Dark, Carbon, Ray.so, Vercel, GitHub Dark |
| 🌈 **7 Gradient Backgrounds** | Sunset, Cosmic, Aurora, Carbon, Ocean, Neon, Minimal |
| 🔧 **Live Customization** | Adjust padding, card width, text length limit, and element visibility in real time |
| 📥 **PNG Download** | Export at 3× pixel ratio for crisp, high-resolution images |
| 📋 **Copy to Clipboard** | Paste directly into Notion, Figma, Slack, or anywhere |
| 🔒 **Privacy-First** | No data leaves your browser — everything runs locally |

---

## 🖥️ Preview

The extension injects a **📸 Snap** button alongside the native Like / Comment / Share row on every post:

```
[👍 Like]  [💬 Comment]  [↗ Share]  [📸 Snap]
```

Clicking **Snap** opens a full customization dashboard:

```
┌────────────────────────────────────────────────────────┐
│  📸 LinkSnap                                    v1.0   │
├─────────────────┬──────────────────────────────────────┤
│  Theme          │                                      │
│  ┌────────────┐ │   ┌──────────────────────────────┐   │
│  │ macOS Dark │ │   │  ● ● ●  linkedin.com         │   │
│  └────────────┘ │   ├──────────────────────────────┤   │
│                 │   │  👤 Jane Doe                 │   │
│  Background     │   │     Senior Engineer @ Meta   │   │
│  ○ ○ ○ ○ ○ ○ ○  │   │                              │   │
│                 │   │  Excited to share that I...  │   │
│  Padding    48  │   │                              │   │
│  ──────────●──  │   │  👍 1.2K  💬 84  🔁 32      │   │
│                 │   └──────────────────────────────┘   │
│  Card Width 580 │                                      │
│  ────────●────  │                                      │
│                 │                                      │
│  Text Length 300│                                      │
│  ─────●───────  │                                      │
│  Show / Hide    │                                      │
│  Avatar    ●    │                                      │
│  Post Text ●    │                                      │
│  Metrics   ●    │                                      │
│                 │                                      │
│  [📥 Download]  │                                      │
│  [📋 Copy]      │                                      │
│  [✕ Close]      │                                      │
└─────────────────┴──────────────────────────────────────┘
```

---

## 📁 Project Structure

```
LinkSnap/
│
├── manifest.json               # Chrome Extension Manifest V3
├── background.js               # Service worker — CORS image proxy
│
├── content/
│   ├── content.js              # Content script entry point
│   ├── injector.js             # Injects 📸 Snap button on feed posts
│   ├── extractor.js            # Scrapes post data & converts images to Base64
│   └── content.css             # Styles for the injected Snap button
│
├── modal/
│   ├── modal.js                # Customization dashboard logic
│   └── modal.css               # Dashboard & snap card styles
│
├── popup/
│   ├── popup.html              # Extension popup UI
│   ├── popup.css               # Popup styles
│   └── popup.js                # Popup settings controller
│
├── themes/
│   ├── macos-light.css         # macOS Light card theme
│   ├── macos-dark.css          # macOS Dark card theme
│   ├── carbon.css              # IBM Carbon card theme
│   ├── rayso.css               # Ray.so card theme
│   ├── vercel.css              # Vercel card theme
│   └── github-dark.css         # GitHub Dark card theme
│
├── utils/
│   ├── export.js               # PNG download & clipboard copy helpers
│   ├── storage.js              # chrome.storage.local promise wrappers
│   └── constants.js            # Default settings & gradient definitions
│
├── assets/
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── logo.png
│
└── libs/
    └── html-to-image.min.js    # Vendor: DOM-to-PNG renderer
```

---

## 🚀 Installation (Developer Mode)

> LinkSnap is not yet published on the Chrome Web Store. Load it as an unpacked extension.

1. **Clone or download** this repository:
   ```bash
   git clone https://github.com/HanshalBobate/LinkSnap.git
   ```

2. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```

3. Enable **Developer mode** (toggle in the top-right corner).

4. Click **Load unpacked** and select the `LinkSnap/` folder.

5. The extension icon (📸) will appear in your Chrome toolbar.

---

## 🎯 How to Use

1. **Go to [LinkedIn](https://www.linkedin.com)** and scroll through your feed.
2. Find any post — a **📸 Snap** button will appear next to Like / Comment / Share.
3. Click **Snap**. The customization dashboard opens.
4. Adjust the **Theme**, **Background**, **Padding**, **Card Width**, and **Text Length** to your liking.
5. Toggle visibility of **Avatar**, **Post Text**, **Post Image**, and **Metrics**.
6. Click **📥 Download PNG** or **📋 Copy to Clipboard**.

---

## ⚙️ Default Settings (Popup)

Click the extension icon in the Chrome toolbar to configure default presets that will be applied every time you open a Snap dashboard:

- Default Theme
- Default Background Gradient
- Default Padding
- Default Card Width
- Default Text Length

Settings are synced via `chrome.storage.local` and persist across browser sessions.

---

## 🔑 Permissions

| Permission | Reason |
|---|---|
| `storage` | Save and restore your default settings |
| `host_permissions: linkedin.com` | Inject the Snap button on LinkedIn pages |
| `host_permissions: licdn.com` | Fetch profile/post images via the background service worker (CORS bypass) |

> **No personal data is collected. No external servers are contacted.**

---

## 🏗️ Architecture Notes

### CORS Image Handling
LinkedIn serves images from `*.licdn.com` with restrictive CORS headers. Rendering them on a `<canvas>` via `html-to-image` would result in a tainted (blank) canvas. LinkSnap uses a **background service worker** (`background.js`) to:
1. Fetch the image URL server-side (extensions bypass CORS)
2. Convert the binary response to a Base64 data URL
3. Return it to the content script for use in the preview

### Script Loading Strategy
LinkedIn enforces a strict Content Security Policy (CSP) that blocks dynamic `import()` of `chrome-extension://` URLs at runtime. All scripts are therefore declared as sequential `content_scripts` in `manifest.json`, communicating via global `window.linksnap*` objects.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Extension Platform | Chrome Manifest V3 |
| UI Rendering | Vanilla JS + CSS (no frameworks) |
| Image Export | [`html-to-image`](https://github.com/bubkoo/html-to-image) |
| Storage | `chrome.storage.local` |
| Fonts | System UI stack (-apple-system, Segoe UI, Roboto) |

---

## 📄 License

MIT © 2025 LinkSnap Contributors
