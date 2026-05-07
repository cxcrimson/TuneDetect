// background.js for TuneDetect Pro
chrome.sidePanel
  .setPanelOptions({
    enabled: true
  })
  .catch((error) => console.error(error));

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Keep track of active capture tabs to avoid multiple captures
let activeCaptures = new Set();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TAB_CAPTURE') {
    // This could be used for more complex background processing 
    // if we wanted to offload the analyzer to the service worker.
  }
});
