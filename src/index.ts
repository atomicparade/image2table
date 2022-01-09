import { createScheduler, createWorker } from 'tesseract.js';

import IntRange from './intrange';
import IntRangeSet from './intrangeset';

function setAppMessage(message: string, messageType: 'info' | 'error' = 'info'): void {
  const pAppMessage = document.getElementById('appMessage');

  if (!pAppMessage) {
    throw new Error(`Unable to obtain <p id="appMessage"> to display ${messageType} message: ${message}`);
  }

  while (pAppMessage.firstChild !== null) {
    pAppMessage.removeChild(pAppMessage.firstChild);
  }

  pAppMessage.classList.remove('info');
  pAppMessage.classList.remove('error');
  pAppMessage.classList.add(messageType);
  pAppMessage.appendChild(document.createTextNode(message));
}

async function handlePaste(event: ClipboardEvent): Promise<void> {
  console.log(event);
}

async function init(): Promise<void> {
  document.addEventListener('paste', handlePaste);

  setAppMessage('Please paste an image.');
}

window.addEventListener('load', init);
