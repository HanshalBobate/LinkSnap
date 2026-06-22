# LinkSnap Developer Guide & Architecture

LinkSnap is a Manifest V3 Chrome Extension that allows users to capture LinkedIn posts and export them as beautiful, high-resolution PNG images. It injects a "Snap" button directly into the LinkedIn feed and provides a live customization dashboard.

## 📁 Directory Structure

```text
LinkSnap/
├── manifest.json               # Chrome Extension Manifest V3 configuration
├── background.js               # Service worker for CORS image proxying
├── content/
│   ├── content.js              # Entry point for the content script
│   ├── injector.js             # Logic for finding LinkedIn action bars and injecting the "Snap" button
│   ├── extractor.js            # Scrapes post data (text, author, metrics) and handles DOM obfuscation
│   └── content.css             # Styles for the injected "Snap" button
├── modal/
│   ├── modal.js                # UI logic for the customization dashboard (sliders, toggles, events)
│   └── modal.css               # Styling for the modal overlay and the preview card
├── popup/
│   ├── popup.html              # Extension popup for setting default preferences
│   ├── popup.js                # Logic to sync popup settings to chrome.storage.local
│   └── popup.css               # Styling for the popup
├── themes/                     # Dynamically injected CSS files for card themes
│   ├── macos-light.css
│   ├── macos-dark.css
│   ├── carbon.css
│   ├── rayso.css
│   ├── vercel.css
│   └── github-dark.css
├── utils/
│   ├── export.js               # Handles PNG generation via html-to-image and clipboard APIs
│   ├── storage.js              # Promise wrappers for chrome.storage.local
│   └── constants.js            # Configuration for default settings and background gradients
├── icons/                      # Extension icons (16x16, 32x32, 48x48, 128x128)
├── libs/
│   └── html-to-image.min.js    # Vendor library for rendering DOM to canvas/PNG
└── docs/
    └── index.html              # Neobrutalist landing page for GitHub Pages
```

---

## 🏗️ Core Architecture & Data Flow

1. **Injection Phase (`content/injector.js`)**
   - A `MutationObserver` watches the LinkedIn feed for new posts.
   - It targets the social action bar (Like, Comment, Share).
   - Handles two distinct LinkedIn DOM structures:
     - **Ember.js (Legacy)**: Found via `.feed-shared-social-action-bar` classes.
     - **React (Modern)**: Classes are obfuscated. Found via scanning for buttons with specific `aria-label` attributes.
   - Injects the `📸 Snap` button alongside native buttons.

2. **Extraction Phase (`content/extractor.js`)**
   - When "Snap" is clicked, it scrapes the post container.
   - **Metrics Extraction**: Employs a three-tier fallback system due to LinkedIn A/B testing:
     1. Tries strict Ember class names.
     2. Scans button `aria-label`s via RegEx.
     3. Scans raw text `innerText` inside `<p>`, `<span>`, and `<button>` tags, splitting by bullet points (`•`) and auto-correcting classic formats (e.g., "Jane Doe and 30 others" -> 31).
   - **Image Handling**: LinkedIn CDN (`licdn.com`) blocks canvas rendering via CORS. The extractor sends image URLs to `background.js`.

3. **Background Proxy (`background.js`)**
   - Extension service workers bypass CORS.
   - Fetches the raw image buffer from LinkedIn's CDN and converts it to a Base64 Data URL.
   - Returns the Base64 string to the content script, sanitizing it for canvas rendering.

4. **Rendering Phase (`modal/modal.js` & `utils/export.js`)**
   - Generates the HTML preview card inside an isolated shadow-like overlay.
   - `html-to-image.min.js` converts the DOM node to a PNG.

---

## 🐛 Known Quirks & Technical Decisions

### 1. The `html-to-image` Crashes
**Issue**: LinkedIn has an enormous, complex CSS object model. By default, `html-to-image` attempts to parse every single external stylesheet on the page to find and embed `@font-face` rules. This causes the library to hang, trigger CORS errors, and silently fail.
**Solution**: `export.js` explicitly passes `skipFonts: true` and `useCORS: true` to bypass font parsing entirely.

### 2. The `onerror` Event Rejection
**Issue**: If a post is missing a profile picture or media attachment, an empty `<img src="">` would be rendered. Browsers immediately fire an `onerror` event on empty `src` attributes, which caused `html-to-image` to fatally reject the Promise with an `Event` object instead of an `Error` (showing as `undefined` to the user).
**Solution**: `modal.js` strictly enforces that missing images are replaced with a 1x1 transparent Base64 GIF (`data:image/gif...`).

### 3. Extension Icon Caching
**Issue**: Chrome aggressively caches extension icons and requires strict pixel dimensions (16x16, 48x48, 128x128).
**Solution**: If icons are updated, they must be hard-scaled to exact pixel dimensions. A PowerShell/Node script should be used rather than relying on Chrome's internal scaling.

### 4. CSP Limitations
**Issue**: LinkedIn's Content Security Policy blocks dynamic script imports (`import()`) and inline `eval()`.
**Solution**: All extension modules are loaded synchronously via the `content_scripts.js` array in `manifest.json`. State is shared via a global `window.linksnap*` namespace.

---

## 🎨 Adding New Themes or Gradients

**To add a new Card Theme:**
1. Create a new CSS file in `themes/new-theme.css`.
2. Add the filename to `web_accessible_resources` in `manifest.json`.
3. Add the theme to the `THEMES` array in `utils/constants.js`.
4. Update the dashboard dropdown inside `modal/modal.js`.

**To add a new Background Gradient:**
1. Add the CSS background rule to the `GRADIENTS` array in `utils/constants.js`.
2. The UI will automatically generate a swatch and bind it to the preview.

## 📦 Build & Release
- No build step (Webpack/Vite) is currently required since it uses vanilla JS.
- To release: Update version in `manifest.json`, zip the root folder (excluding `.git`), and upload to the Chrome Web Store Developer Dashboard.
