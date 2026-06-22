/**
 * LinkSnap Preview Modal & Customization Dashboard
 */

let themeLinkElement = null;

function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function pillToggle(id, label, checked = true, disabled = false) {
  return `
    <label class="ls-toggle-row" for="${id}">
      <span class="ls-toggle-label">${label}</span>
      <span class="ls-switch">
        <input type="checkbox" id="${id}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
        <span class="ls-switch-track"></span>
        <span class="ls-switch-thumb"></span>
      </span>
    </label>
  `;
}

window.linksnapModal = {
  async openModal(data) {
    const existing = document.getElementById("linksnap-modal");
    if (existing) existing.remove();

    const linkedinSvg = `<svg class="linkedin-logo-watermark" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>`;

    const hasText  = !!data.postText;
    const hasMedia = !!data.postImage;

    const modal = document.createElement("div");
    modal.id = "linksnap-modal";

    let displayText = data.postText || "";
    if (displayText.length > 300) {
      displayText = displayText.slice(0, 295) + "... more";
    }

    modal.innerHTML = `
      <div class="linksnap-dashboard">

        <!-- ── LEFT SIDEBAR ────────────────────────────────── -->
        <div class="linksnap-controls">

          <div class="ls-sidebar-header">
            <span style="font-size:18px;">📸</span>
            <span class="ls-sidebar-title">LinkSnap</span>
            <span class="ls-sidebar-version">v1.0</span>
          </div>

          <div class="ls-controls-body">

            <!-- Theme -->
            <div>
              <div class="ls-section-label">Theme</div>
              <select id="ls-theme-select" class="ls-select">
                <option value="macos-dark">macOS Dark</option>
                <option value="macos-light">macOS Light</option>
                <option value="carbon">Carbon</option>
                <option value="rayso">Ray.so</option>
                <option value="vercel">Vercel</option>
                <option value="github-dark">GitHub Dark</option>
              </select>
            </div>

            <!-- Background -->
            <div>
              <div class="ls-section-label">Background</div>
              <div class="ls-grad-grid">
                <button class="ls-grad-btn" data-grad="sunset" title="Sunset"  style="background:linear-gradient(135deg,#f7971e,#ffd200);"></button>
                <button class="ls-grad-btn" data-grad="cosmic" title="Cosmic"  style="background:linear-gradient(135deg,#8a2387,#e94057,#f27121);"></button>
                <button class="ls-grad-btn" data-grad="aurora" title="Aurora"  style="background:linear-gradient(135deg,#0f9b58,#00bf8f);"></button>
                <button class="ls-grad-btn" data-grad="carbon" title="Carbon"  style="background:linear-gradient(135deg,#1c1c1e,#2c2c2e);"></button>
                <button class="ls-grad-btn" data-grad="ocean"  title="Ocean"   style="background:linear-gradient(135deg,#1a6dff,#00cfde);"></button>
                <button class="ls-grad-btn" data-grad="neon"   title="Neon"    style="background:linear-gradient(135deg,#f857a6,#ff5858);"></button>
                <button class="ls-grad-btn" data-grad="glass"  title="Minimal" style="background:linear-gradient(135deg,#c9d6df,#f2f7fb);"></button>
              </div>
            </div>

            <!-- Padding -->
            <div>
              <div class="ls-section-label">Padding</div>
              <div class="ls-range-row">
                <input type="range" id="ls-padding-slider" min="16" max="96" value="48">
                <span class="ls-range-val" id="ls-padding-val">48</span>
              </div>
            </div>

            <!-- Card Width -->
            <div>
              <div class="ls-section-label">Card Width</div>
              <div class="ls-range-row">
                <input type="range" id="ls-width-slider" min="420" max="780" value="580">
                <span class="ls-range-val" id="ls-width-val">580</span>
              </div>
            </div>

            <!-- Text Length -->
            <div>
              <div class="ls-section-label">Text Length</div>
              <div class="ls-range-row">
                <input type="range" id="ls-text-length-slider" min="50" max="${Math.max(50, (data.postText || '').length)}" value="300">
                <span class="ls-range-val" id="ls-text-length-val">300</span>
              </div>
            </div>

            <!-- Visibility -->
            <div>
              <div class="ls-section-label">Show / Hide</div>
              <div class="ls-toggle-list">
                ${pillToggle("ls-t-avatar",  "Avatar & Name", true)}
                ${pillToggle("ls-t-text",    "Post Text",     true, !hasText)}
                ${pillToggle("ls-t-media",   "Post Image",    true, !hasMedia)}
                ${pillToggle("ls-t-metrics", "Metrics",       true)}
              </div>
            </div>

          </div><!-- /ls-controls-body -->

          <!-- Action buttons pinned at bottom -->
          <div class="ls-actions">
            <button id="ls-btn-download" class="ls-btn-primary">📥 Download PNG</button>
            <button id="ls-btn-copy"     class="ls-btn-primary" style="background:#2d2d35;border:1px solid rgba(255,255,255,0.1);">📋 Copy to Clipboard</button>
            <button id="ls-btn-close"    class="ls-btn-secondary">✕ Close</button>
          </div>

        </div><!-- /linksnap-controls -->

        <!-- ── RIGHT PREVIEW ───────────────────────────────── -->
        <div class="linksnap-preview-area">
          <div id="linksnap-canvas" class="ls-bg-sunset">

            <div class="linksnap-window">
              <div class="titlebar">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
                <span class="titlebar-text">linkedin.com</span>
              </div>

              <div id="snap-card">
                <div class="snap-card-header" id="snap-header">
                  <img id="snap-avatar" src="${data.profileImage || 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='}" class="profile-image" alt="">
                  <div class="snap-author-info">
                    <h2 id="snap-author-name">${escapeHTML(data.authorName)}</h2>
                    <p  id="snap-author-headline">${escapeHTML(data.authorHeadline)}</p>
                  </div>
                  ${linkedinSvg}
                </div>

                <div class="post-text" id="snap-text">${escapeHTML(displayText)}</div>

                <div class="post-media" id="snap-media-container" style="display:none;">
                  <img id="snap-media" src="${data.postImage || 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='}" alt="">
                </div>

                <div class="metrics" id="snap-metrics">
                  <span class="metric-item">👍 ${data.likes}</span>
                  <span class="metric-item">💬 ${data.comments}</span>
                  <span class="metric-item">🔁 ${data.reposts}</span>
                </div>
              </div>
            </div>

            <div class="linksnap-canvas-watermark" id="snap-watermark">
              Made using github.com/HanshalBobate/LinkSnap
            </div>

          </div><!-- /linksnap-canvas -->
        </div><!-- /linksnap-preview-area -->

      </div><!-- /linksnap-dashboard -->
    `;

    document.body.appendChild(modal);

    // ── Element refs ────────────────────────────────────────
    const canvas    = document.getElementById("linksnap-canvas");
    const windowEl  = modal.querySelector(".linksnap-window");

    const themeSelect    = document.getElementById("ls-theme-select");
    const paddingSlider  = document.getElementById("ls-padding-slider");
    const paddingVal     = document.getElementById("ls-padding-val");
    const widthSlider    = document.getElementById("ls-width-slider");
    const widthVal       = document.getElementById("ls-width-val");
    const textLengthSlider = document.getElementById("ls-text-length-slider");
    const textLengthVal    = document.getElementById("ls-text-length-val");

    const tAvatar  = document.getElementById("ls-t-avatar");
    const tText    = document.getElementById("ls-t-text");
    const tMedia   = document.getElementById("ls-t-media");
    const tMetrics = document.getElementById("ls-t-metrics");

    const cardHeader  = document.getElementById("snap-header");
    const cardText    = document.getElementById("snap-text");
    const cardMedia   = document.getElementById("snap-media-container");
    const cardMetrics = document.getElementById("snap-metrics");

    const btnDownload = document.getElementById("ls-btn-download");
    const btnCopy     = document.getElementById("ls-btn-copy");
    const btnClose    = document.getElementById("ls-btn-close");

    // ── Initial visibility ───────────────────────────────────
    if (hasMedia) cardMedia.style.display = "block";
    if (!hasText)  cardText.style.display  = "none";

    // ── Helper: apply theme CSS ──────────────────────────────
    const applyTheme = (name) => {
      if (themeLinkElement) themeLinkElement.remove();
      themeLinkElement = document.createElement("link");
      themeLinkElement.rel  = "stylesheet";
      themeLinkElement.href = chrome.runtime.getURL(`themes/${name}.css`);
      document.head.appendChild(themeLinkElement);
    };

    // ── Helper: apply gradient ───────────────────────────────
    const applyGrad = (name) => {
      canvas.className = canvas.className
        .split(" ").filter(c => !c.startsWith("ls-bg-")).join(" ");
      canvas.classList.add(`ls-bg-${name}`);
      modal.querySelectorAll(".ls-grad-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.grad === name)
      );
    };

    // ── Helper: apply text limit ─────────────────────────────
    const applyTextLimit = (limitStr) => {
      const limit = parseInt(limitStr, 10);
      let text = data.postText || "";
      if (text.length > limit) {
        text = text.slice(0, Math.max(0, limit - 5)) + "... more";
      }
      cardText.innerHTML = escapeHTML(text);
    };

    // ── Load saved settings ──────────────────────────────────
    chrome.storage.local.get(
      ["theme","gradient","padding","width","textLength","showAvatar","showText","showMedia","showMetrics","showWatermark"],
      (s) => {
        const theme      = s.theme      || "macos-dark";
        const grad       = s.gradient   || "sunset";
        const padding    = s.padding    || "48";
        const width      = s.width      || "580";
        const textLength = s.textLength || "300";

        themeSelect.value       = theme;
        paddingSlider.value     = padding;
        paddingVal.innerText    = padding;
        widthSlider.value       = width;
        widthVal.innerText      = width;
        textLengthSlider.value  = textLength;
        textLengthVal.innerText = textLength;

        applyTheme(theme);
        applyGrad(grad);
        applyTextLimit(textLength);

        canvas.style.padding    = `${padding}px`;
        windowEl.style.width    = `${width}px`;

        // Toggles — default true unless stored false
        const show = (key, def = true) => s[key] !== undefined ? s[key] : def;

        tAvatar.checked  = show("showAvatar");
        tText.checked    = show("showText");
        tMedia.checked   = show("showMedia");
        tMetrics.checked = show("showMetrics");

        cardHeader.classList.toggle("ls-hide",  !tAvatar.checked);
        if (hasText)  cardText.classList.toggle("ls-hide",  !tText.checked);
        if (hasMedia) cardMedia.classList.toggle("ls-hide", !tMedia.checked);
        cardMetrics.classList.toggle("ls-hide", !tMetrics.checked);
      }
    );

    // ── Event listeners ──────────────────────────────────────

    themeSelect.addEventListener("change", (e) => {
      applyTheme(e.target.value);
      chrome.storage.local.set({ theme: e.target.value });
    });

    modal.querySelectorAll(".ls-grad-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        applyGrad(btn.dataset.grad);
        chrome.storage.local.set({ gradient: btn.dataset.grad });
      });
    });

    paddingSlider.addEventListener("input", (e) => {
      paddingVal.innerText    = e.target.value;
      canvas.style.padding    = `${e.target.value}px`;
      chrome.storage.local.set({ padding: e.target.value });
    });

    widthSlider.addEventListener("input", (e) => {
      widthVal.innerText   = e.target.value;
      windowEl.style.width = `${e.target.value}px`;
      chrome.storage.local.set({ width: e.target.value });
    });

    textLengthSlider.addEventListener("input", (e) => {
      textLengthVal.innerText = e.target.value;
      applyTextLimit(e.target.value);
      chrome.storage.local.set({ textLength: e.target.value });
    });

    tAvatar.addEventListener("change", (e) => {
      cardHeader.classList.toggle("ls-hide", !e.target.checked);
      chrome.storage.local.set({ showAvatar: e.target.checked });
    });

    tText.addEventListener("change", (e) => {
      cardText.classList.toggle("ls-hide", !e.target.checked);
      chrome.storage.local.set({ showText: e.target.checked });
    });

    tMedia.addEventListener("change", (e) => {
      cardMedia.classList.toggle("ls-hide", !e.target.checked);
      chrome.storage.local.set({ showMedia: e.target.checked });
    });

    tMetrics.addEventListener("change", (e) => {
      cardMetrics.classList.toggle("ls-hide", !e.target.checked);
      chrome.storage.local.set({ showMetrics: e.target.checked });
    });

    // Close
    const closeModal = () => {
      modal.remove();
      if (themeLinkElement) { themeLinkElement.remove(); themeLinkElement = null; }
    };
    btnClose.addEventListener("click", closeModal);

    // Dismiss on overlay click (outside dashboard)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // ── Export helpers ───────────────────────────────────────
    const runExport = async (fn, btn, label) => {
      btn.disabled = true;
      const orig = btn.innerHTML;
      btn.innerHTML = "⏳ Working...";
      try {
        await fn(canvas);
        if (label) {
          btn.innerHTML = "✅ Copied!";
          setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 2000);
          return;
        }
      } catch (e) {
        const msg = e instanceof Event ? "An image failed to load (CORS or empty src)" : (e.message || e);
        alert("LinkSnap export failed: " + msg);
      }
      btn.innerHTML = orig;
      btn.disabled = false;
    };

    btnDownload.addEventListener("click", () => {
      const name = data.authorName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      runExport(
        (node) => window.linksnapExport.downloadPng(node, `linksnap-${name}.png`),
        btnDownload,
        false
      );
    });

    btnCopy.addEventListener("click", () => {
      runExport(
        (node) => window.linksnapExport.copyPngToClipboard(node),
        btnCopy,
        true
      );
    });
  }
};
