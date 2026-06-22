/**
 * LinkSnap Post Extractor
 *
 * Handles two LinkedIn DOM types:
 *  - Ember.js (detail pages, some feeds): semantic class names available
 *  - React/new feed: fully obfuscated, content in <p> elements
 */

window.linksnapExtractor = {

  // ── Image → Base64 via background service worker ───────────────────────────
  toBase64Image(url) {
    return new Promise((resolve) => {
      if (!url || url.startsWith("data:") || url.startsWith("blob:")) {
        resolve(url); return;
      }
      chrome.runtime.sendMessage({ action: "fetch_image", url }, response => {
        if (chrome.runtime.lastError || !response?.success) resolve(url);
        else resolve(response.dataUrl);
      });
    });
  },

  // ── Extract number: "17 reactions" → "17", "1.2K comments" → "1.2K" ─
  cleanMetric(text) {
    if (!text) return "0";
    const m = text.trim().match(/([\d,.]+[KMBkmb]?)/);
    return m ? m[1] : "0";
  },

  // ── First selector with non-empty innerText ────────────────────────────────
  queryText(root, selectors) {
    for (const sel of selectors) {
      try {
        const el = root.querySelector(sel);
        if (el) { const t = el.innerText.trim(); if (t) return t; }
      } catch (_) {}
    }
    return "";
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EMBER.JS DOM — semantic class names available
  // ══════════════════════════════════════════════════════════════════════════
  async extractEmberPost(post) {
    // Author name
    const authorName = this.queryText(post, [
      ".feed-shared-actor__title",
      ".update-components-actor__title .visually-hidden",
      ".update-components-actor__title span[aria-hidden='true']",
      ".update-components-actor__title",
    ]) || "LinkedIn User";

    // Headline
    const authorHeadline = this.queryText(post, [
      ".feed-shared-actor__description",
      ".feed-shared-actor__sub-description",
      ".update-components-actor__description",
      ".update-components-actor__headline",
    ]);

    // Avatar image
    const avatarImg = post.querySelector(
      ".feed-shared-actor__avatar-image, " +
      ".feed-shared-actor__avatar img, " +
      ".update-components-actor__avatar img, " +
      "[class*='actor__avatar'] img"
    );
    const profileImageSrc = avatarImg?.src || "";

    // Post text (confirmed: .feed-shared-update-v2__description works)
    const textEl = post.querySelector(
      ".feed-shared-update-v2__description, " +
      ".feed-shared-update-v2__commentary, " +
      ".feed-shared-text-view, " +
      ".update-components-text, " +
      "[data-view-name='update-components-text']"
    );
    let postText = "";
    if (textEl) {
      const clone = textEl.cloneNode(true);
      clone.querySelectorAll("button, .see-more, .feed-shared-inline-show-more-text__see-more-less-toggle")
        .forEach(el => el.remove());
      postText = clone.innerText?.trim() || "";
    }

    // Media image
    let postImageSrc = "";
    const mediaImgs = post.querySelectorAll(
      ".update-components-image__image, " +
      ".feed-shared-image__container img, " +
      ".feed-shared-article__image-container img, " +
      ".ivm-image-view-model img"
    );
    for (const img of mediaImgs) {
      if (!img.src || img.src.includes("static.licdn")) continue;
      if (img.src === profileImageSrc) continue;
      if (img.closest("[class*='actor__avatar'], .update-components-actor__avatar, a[href*='/in/'], a[href*='/company/']")) continue;
      
      const w = parseInt(img.getAttribute("width") || "0", 10);
      const h = parseInt(img.getAttribute("height") || "0", 10);
      if ((w > 0 && w <= 100) || (h > 0 && h <= 100)) continue;
      if (img.width > 0 && img.width <= 100) continue;

      postImageSrc = img.src;
      break;
    }

    return { authorName, authorHeadline, profileImageSrc, postText, postImageSrc };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // REACT / NEW DOM — all content in <p> elements (confirmed by diagnostic)
  //
  // Confirmed <p> order inside a feed post:
  //   0: "Taher Sanawadwala"            ← author name
  //   1: "• 1st"                        ← degree badge  (SKIP)
  //   2: "Game Developer | Frontend..." ← headline (contains |)
  //   3: "1w •"                         ← timestamp      (SKIP)
  //   4: "CodeChef Milestone..."        ← POST TEXT (longest)
  //   5: "Ishika Sahare and 30 others..." ← reactions    (SKIP)
  // ══════════════════════════════════════════════════════════════════════════
  async extractReactPost(post) {
    const allP = [...post.querySelectorAll("p")]
      .map(p => p.innerText.trim())
      .filter(Boolean);

    // Author name — most reliable: from control menu button
    const controlBtn = post.querySelector(
      'button[aria-label^="Open control menu for post by"]'
    );
    const authorName = controlBtn
      ? controlBtn.getAttribute("aria-label").replace("Open control menu for post by ", "")
      : (allP.find(t => t.length < 60 && !t.startsWith("•") && !t.match(/^\d/)) || "LinkedIn User");

    // Headline — <p> with job separators (|, ·, @) and no "reacted"
    const authorHeadline = allP.find(t =>
      t.length > 15 &&
      (t.includes(" | ") || t.includes(" · ") || t.includes("|") || t.includes("@")) &&
      !t.toLowerCase().includes("reacted") &&
      !t.startsWith("•")
    ) || "";

    // Post text — longest <p> that is NOT a badge, timestamp, reactions summary, or headline
    const isJunk = t =>
      t.length < 20 ||
      t === authorHeadline ||
      t.toLowerCase().includes("reacted") ||
      t.toLowerCase().includes("and others") ||
      t.match(/^\d+[wdhmsy]\s*[•·]/) ||   // "1w •" timestamp
      t.match(/^[•·]\s*(1st|2nd|3rd|\d)/); // "• 1st" degree badge

    const postText = allP
      .filter(t => !isJunk(t))
      .sort((a, b) => b.length - a.length)[0] || "";

    // Avatar image — first <img> in a profile or company link
    let profileImageSrc = "";
    for (const link of post.querySelectorAll("a[href*='/in/'], a[href*='/company/']")) {
      const img = link.querySelector("img");
      if (img?.src && !img.src.includes("static.licdn")) {
        profileImageSrc = img.src;
        break;
      }
    }

    // Media image — first non-avatar img that isn't a tiny icon
    let postImageSrc = "";
    for (const img of post.querySelectorAll("img")) {
      // Exclude generic LinkedIn icons
      if (!img.src || img.src.includes("static.licdn")) continue;
      // Exclude the profile image we already found
      if (img.src === profileImageSrc) continue;
      // Exclude ANY image inside a profile/company link (these are always avatars)
      if (img.closest("a[href*='/in/'], a[href*='/company/']")) continue;
      
      // Exclude small reaction icons / avatars by checking HTML width/height attributes
      const w = parseInt(img.getAttribute("width") || "0", 10);
      const h = parseInt(img.getAttribute("height") || "0", 10);
      if ((w > 0 && w <= 100) || (h > 0 && h <= 100)) continue;

      // Check rendered width if available
      if (img.width > 0 && img.width <= 100) continue;

      postImageSrc = img.src;
      break;
    }

    return { authorName, authorHeadline, profileImageSrc, postText, postImageSrc };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SHARED METRIC EXTRACTION (works for both DOM types)
  // Confirmed patterns:
  //   button[aria-label="17 reactions"]
  //   button[aria-label="1 comment on X's post"]
  //   button[aria-label="4 reposts of X's post"]
  //   .social-details-social-counts__reactions-count  → "17"
  //   .social-details-social-counts__comments         → "1 comment"
  // ══════════════════════════════════════════════════════════════════════════
  extractMetrics(post) {
    let likes = "0", comments = "0", reposts = "0";

    // PRIMARY: dedicated count elements (Ember DOM)
    const rcEl = post.querySelector(".social-details-social-counts__reactions-count");
    if (rcEl) likes = this.cleanMetric(rcEl.innerText);

    const cmEl = post.querySelector(".social-details-social-counts__comments");
    if (cmEl) comments = this.cleanMetric(cmEl.innerText);

    // SECONDARY: button aria-labels (works in both DOMs)
    if (likes === "0") {
      const btns = post.querySelectorAll('button[aria-label*=" reaction"], button[aria-label*=" Like"], button[aria-label*=" like"]');
      for (const btn of btns) {
        const label = btn.getAttribute("aria-label").toLowerCase();
        if (label === "like" || label.startsWith("like ")) continue;
        const m = this.cleanMetric(label);
        if (m !== "0") { likes = m; break; }
      }
    }
    if (comments === "0") {
      const btns = post.querySelectorAll('button[aria-label*=" comment"], button[aria-label*=" Comment"]');
      for (const btn of btns) {
        const label = btn.getAttribute("aria-label").toLowerCase();
        if (label === "comment" || label.startsWith("comment ")) continue;
        const m = this.cleanMetric(label);
        if (m !== "0") { comments = m; break; }
      }
    }
    if (reposts === "0") {
      const btns = post.querySelectorAll('button[aria-label*=" repost"], button[aria-label*=" Repost"]');
      for (const btn of btns) {
        const label = btn.getAttribute("aria-label").toLowerCase();
        if (label === "repost" || label.startsWith("repost ")) continue;
        const m = this.cleanMetric(label);
        if (m !== "0") { reposts = m; break; }
      }
    }

    // TERTIARY: React DOM text fallback (scan text elements)
    if (likes === "0" || comments === "0" || reposts === "0") {
      const candidates = [...post.querySelectorAll("p, button, span.visually-hidden, span.t-normal, span[aria-hidden='true']")]
        .map(el => el.innerText.trim())
        .filter(t => t.length > 0 && t.length < 80);

      for (const rawText of candidates) {
        const segments = rawText.split(/[•·]/).map(s => s.trim());
        for (const t of segments) {
          const lower = t.toLowerCase();
          
          if (likes === "0" && (lower.includes(" others") || lower.includes(" reaction") || lower.includes(" like"))) {
             if (lower === "like" || lower === "likes") continue;
             let m = this.cleanMetric(t);
             if (m !== "0") {
               // Handle "Jane and 30 others" -> 31
               if (lower.includes(" others") && !isNaN(m.replace(/,/g, ""))) {
                 m = (parseInt(m.replace(/,/g, ""), 10) + 1).toString();
               }
               likes = m;
             }
          }
          if (comments === "0" && lower.includes(" comment")) {
             if (lower === "comment" || lower === "comments") continue;
             const m = this.cleanMetric(t);
             if (m !== "0") comments = m;
          }
          if (reposts === "0" && lower.includes(" repost")) {
             if (lower === "repost" || lower === "reposts") continue;
             const m = this.cleanMetric(t);
             if (m !== "0") reposts = m;
          }
        }
      }
    }

    return { likes, comments, reposts };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN ENTRY POINT
  // ══════════════════════════════════════════════════════════════════════════
  async extractPost(post) {
    try {
      // Detect DOM type: Ember has semantic class names
      const isEmber = !!(
        post.querySelector(".feed-shared-actor__title") ||
        post.querySelector(".feed-shared-update-v2__description") ||
        post.querySelector(".update-components-actor__title")
      );

      const fields = isEmber
        ? await this.extractEmberPost(post)
        : await this.extractReactPost(post);

      const { authorName, authorHeadline, profileImageSrc, postText, postImageSrc } = fields;
      const { likes, comments, reposts } = this.extractMetrics(post);

      console.log(
        `LinkSnap [${isEmber ? "Ember" : "React"}] — ` +
        `Author: "${authorName}" | ` +
        `Text: "${postText.slice(0, 40)}..." | ` +
        `Likes: ${likes} | Comments: ${comments} | Reposts: ${reposts}`
      );

      // Convert images to Base64 to bypass CORS
      const [profileImage, postImage] = await Promise.all([
        this.toBase64Image(profileImageSrc),
        this.toBase64Image(postImageSrc),
      ]);

      const data = {
        authorName,
        authorHeadline,
        profileImage,
        postText,
        postImage,
        likes,
        comments,
        reposts,
      };

      window.linksnapLastData = data;

      if (window.linksnapModal) {
        window.linksnapModal.openModal(data);
      } else {
        throw new Error("LinkSnap: Modal not loaded.");
      }

    } catch (err) {
      console.error("LinkSnap extraction failed:", err);
      throw err;
    }
  }
};
