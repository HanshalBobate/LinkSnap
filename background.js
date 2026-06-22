chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetch_image") {
    fetchImageAsBase64(message.url)
      .then(dataUrl => {
        sendResponse({ success: true, dataUrl: dataUrl });
      })
      .catch(error => {
        console.error("Failed to fetch image in background:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for asynchronous response
  }
});

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  
  // Convert ArrayBuffer to Base64 in service worker (where btoa is available, but FileReader is not)
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const len = bytes.byteLength;
  
  // Use chunked conversion if image is large to avoid stack overflow
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  
  const base64 = btoa(binary);
  return `data:${contentType};base64,${base64}`;
}