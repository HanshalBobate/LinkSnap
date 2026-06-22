/**
 * LinkSnap Popup Settings Controller
 */

document.addEventListener("DOMContentLoaded", () => {
  const themeSelect = document.getElementById("popup-theme");
  const gradSelect = document.getElementById("popup-gradient");
  const paddingSlider = document.getElementById("popup-padding");
  const paddingValLabel = document.getElementById("val-padding");
  const widthSlider = document.getElementById("popup-width");
  const widthValLabel = document.getElementById("val-width");

  // 1. Load initial settings
  chrome.storage.local.get(
    ["theme", "gradient", "padding", "width"],
    (settings) => {
      // Theme
      const activeTheme = settings.theme || "macos-dark";
      themeSelect.value = activeTheme;

      // Gradient
      const activeGrad = settings.gradient || "sunset";
      gradSelect.value = activeGrad;

      // Padding
      const activePadding = settings.padding || "48";
      paddingSlider.value = activePadding;
      paddingValLabel.innerText = `${activePadding}px`;

      // Width
      const activeWidth = settings.width || "650";
      widthSlider.value = activeWidth;
      widthValLabel.innerText = `${activeWidth}px`;
    }
  );

  // 2. Event Listeners for Changes
  
  // Theme Select
  themeSelect.addEventListener("change", (e) => {
    chrome.storage.local.set({ theme: e.target.value });
  });

  // Gradient Select
  gradSelect.addEventListener("change", (e) => {
    chrome.storage.local.set({ gradient: e.target.value });
  });

  // Padding Slider
  paddingSlider.addEventListener("input", (e) => {
    const val = e.target.value;
    paddingValLabel.innerText = `${val}px`;
    chrome.storage.local.set({ padding: val });
  });

  // Width Slider
  widthSlider.addEventListener("input", (e) => {
    const val = e.target.value;
    widthValLabel.innerText = `${val}px`;
    chrome.storage.local.set({ width: val });
  });
});
