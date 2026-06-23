/// <reference types="chrome"/>

const w = window as Window & { __dzPanelInit?: boolean };
if (!w.__dzPanelInit) {
  w.__dzPanelInit = true;

  const host = document.createElement('div');
  host.id = 'dz-panel-host';
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .dz-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 650px;
      height: 100vh;
      transform: translateX(100%);
      transition: transform 0.28s cubic-bezier(.4, 0, .2, 1);
      z-index: 2147483647;
      box-shadow: -4px 0 32px rgba(0, 0, 0, 0.18);
    }
    .dz-panel.open {
      transform: translateX(0);
    }
    .dz-panel iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
  `;

  const panel = document.createElement('div');
  panel.className = 'dz-panel';

  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('index.html');

  panel.appendChild(iframe);
  shadow.appendChild(style);
  shadow.appendChild(panel);
  document.documentElement.appendChild(host);

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.command === 'TOGGLE_PANEL') {
      const isOpening = !panel.classList.contains('open');
      panel.classList.toggle('open');
      if (isOpening) {
        // Notify Angular to refresh the active tab URL without reloading the iframe
        iframe.contentWindow?.postMessage({ command: 'PANEL_OPENED' }, '*');
      }
    }
  });

  window.addEventListener('message', event => {
    if (event.source === iframe.contentWindow && event.data?.command === 'CLOSE_PANEL') {
      panel.classList.remove('open');
    }
  });
}
