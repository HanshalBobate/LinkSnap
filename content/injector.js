/**
 * LinkSnap Button Injector
 *
 * LinkedIn serves two different DOMs depending on the post type:
 *   1. Ember.js  → action bar has class "feed-shared-social-action-bar"
 *   2. React/new → action bar found via aria-label "Reaction button state"
 *
 * We handle both. Dedup is via dataset.linksnapInjected on the action bar element.
 */

(function () {
  console.log("LinkSnap: Injector loaded.");

  // ── Shared: build the Snap button ─────────────────────────────────────────
  function buildSnapButton(post) {
    const btn = document.createElement("button");
    btn.className = [
      "artdeco-button",
      "artdeco-button--muted",
      "artdeco-button--3",
      "artdeco-button--tertiary",
      "social-actions-button",
      "linksnap-btn",
      "flex-wrap",
    ].join(" ");
    btn.type = "button";
    btn.setAttribute("aria-label", "Snap this post");
    btn.innerHTML = `
      <svg aria-hidden="true" class="artdeco-button__icon" xmlns="http://www.w3.org/2000/svg"
           width="16" height="16" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 15.2A3.2 3.2 0 1 1 15.2 12 3.2 3.2 0 0 1 12 15.2M20.94 12.99c.04-.33.06-.66.06-.99s-.02-.67-.06-1l2.16-1.68a.5.5 0 0 0 .12-.64l-2.05-3.54a.5.5 0 0 0-.61-.22l-2.55 1.02a7.4 7.4 0 0 0-1.71-.99l-.39-2.71A.49.49 0 0 0 15.35 2h-4.1a.49.49 0 0 0-.49.42l-.38 2.71a7.8 7.8 0 0 0-1.71.99L6.12 5.1a.49.49 0 0 0-.61.22L3.46 8.86a.48.48 0 0 0 .12.64L5.74 11.01c-.04.33-.07.67-.07 1s.03.67.07 1L3.58 14.69a.48.48 0 0 0-.12.64l2.05 3.54a.5.5 0 0 0 .61.22l2.55-1.02a7.4 7.4 0 0 0 1.71.99l.38 2.71c.07.24.29.42.54.42h4.1a.49.49 0 0 0 .49-.42l.39-2.71a7.8 7.8 0 0 0 1.71-.99l2.55 1.02a.49.49 0 0 0 .61-.22l2.05-3.54a.48.48 0 0 0-.12-.64z"/>
      </svg>
      <span class="artdeco-button__text social-action-button__text">Snap</span>
    `;

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const textEl = btn.querySelector(".social-action-button__text");
      const origText = textEl.innerText;
      textEl.innerText = "Snapping…";
      btn.disabled = true;

      try {
        if (window.linksnapExtractor) {
          await window.linksnapExtractor.extractPost(post);
        } else {
          alert("LinkSnap: Not ready — please hard-refresh (Ctrl+Shift+R).");
        }
      } catch (err) {
        console.error("LinkSnap:", err);
      } finally {
        textEl.innerText = origText;
        btn.disabled = false;
      }
    });

    return btn;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STRATEGY 1 — Ember.js DOM
  // Action bar: div.feed-shared-social-action-bar
  // Post:       closest [data-urn], .feed-shared-update-v2, .occludable-update
  // ══════════════════════════════════════════════════════════════════════════
  function injectEmber() {
    const bars = document.querySelectorAll(
      ".feed-shared-social-action-bar:not([data-linksnap-injected])"
    );

    bars.forEach(bar => {
      bar.dataset.linksnapInjected = "true";

      // Confirmed from diagnostic: post container is div.feed-shared-update-v2
      // with data-urn attribute, sitting 4 levels above the action bar.
      const post =
        bar.closest(".feed-shared-update-v2") ||
        bar.closest("[data-urn]") ||
        bar.closest(".occludable-update") ||
        bar.parentElement;

      const wrapper = document.createElement("span");
      wrapper.className = [
        "feed-shared-social-action-bar__action-button",
        "feed-shared-social-action-bar--new-padding",
        "linksnap-wrap",
      ].join(" ");

      wrapper.appendChild(buildSnapButton(post));
      bar.appendChild(wrapper);

      console.log("LinkSnap: Injected (Ember)", post?.dataset?.urn || post?.className?.slice(0, 40));
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STRATEGY 2 — New React/obfuscated DOM
  // Post:       ancestor of "Open control menu for post by" button that
  //             contains exactly one "Reaction button state" button
  // Action bar: ancestor of "Reaction button state" button with ≥ 3 buttons
  // ══════════════════════════════════════════════════════════════════════════
  function findPostContainer(controlBtn) {
    let el = controlBtn.parentElement;
    let candidate = null;
    for (let i = 0; i < 25 && el; i++) {
      const count = el.querySelectorAll('button[aria-label*="Reaction button state"]').length;
      if (count === 1) candidate = el;
      else if (count > 1) break;
      el = el.parentElement;
    }
    return candidate;
  }

  function findActionBar(post) {
    const reactionBtn = post.querySelector('button[aria-label*="Reaction button state"]');
    if (!reactionBtn) return null;
    let el = reactionBtn.parentElement;
    for (let i = 0; i < 10 && el && el !== post; i++) {
      if (el.querySelectorAll("button").length >= 3) return el;
      el = el.parentElement;
    }
    return reactionBtn.parentElement;
  }

  function injectReact() {
    const controlBtns = document.querySelectorAll(
      'button[aria-label^="Open control menu for post by"]'
    );

    controlBtns.forEach(controlBtn => {
      const post = findPostContainer(controlBtn);
      if (!post) return;

      const actionBar = findActionBar(post);
      if (!actionBar) return;

      // Dedup on the action bar element
      if (actionBar.dataset.linksnapInjected) return;
      actionBar.dataset.linksnapInjected = "true";

      // Place button as a sibling AFTER the action bar (React DOM is sensitive
      // to new children inside its managed container)
      const wrapper = document.createElement("div");
      wrapper.className = "linksnap-react-row";
      wrapper.appendChild(buildSnapButton(post));
      actionBar.insertAdjacentElement("afterend", wrapper);

      const name = controlBtn.getAttribute("aria-label")
        .replace("Open control menu for post by ", "");
      console.log("LinkSnap: Injected (React)", name);
    });
  }

  // ── Run both strategies ────────────────────────────────────────────────────
  function injectAll() {
    injectEmber();
    injectReact();
  }

  injectAll();
  setInterval(injectAll, 2500);
})();
