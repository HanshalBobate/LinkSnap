/**
 * Export Utilities for LinkSnap using html-to-image (Global Namespace)
 */

window.linksnapExport = {
  async downloadPng(node, filename = "linksnap.png") {
    try {
      if (!window.htmlToImage) {
        throw new Error("htmlToImage library is not loaded.");
      }
      
      // Ensure all images inside the node are loaded before capture
      await this.preventRenderGlitch(node);
      
      const dataUrl = await window.htmlToImage.toPng(node, {
        pixelRatio: 3,
        skipFonts: true,
        useCORS: true,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left"
        }
      });
      
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("LinkSnap: Download failed:", error);
      throw error;
    }
  },

  async copyPngToClipboard(node) {
    try {
      if (!window.htmlToImage) {
        throw new Error("htmlToImage library is not loaded.");
      }
      
      await this.preventRenderGlitch(node);
      
      const blob = await window.htmlToImage.toBlob(node, {
        pixelRatio: 3,
        skipFonts: true,
        useCORS: true,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left"
        }
      });
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
    } catch (error) {
      console.error("LinkSnap: Copy to clipboard failed:", error);
      throw error;
    }
  },

  // Small helper to ensure the DOM is flushed and images are fully rendered
  preventRenderGlitch(node) {
    return new Promise((resolve) => {
      // Trigger layout force
      node.offsetHeight;
      // Brief delay to ensure canvas paints and images settle
      setTimeout(resolve, 150);
    });
  }
};
