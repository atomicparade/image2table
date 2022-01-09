/* eslint max-classes-per-file: 0 */

import { createScheduler, createWorker } from 'tesseract.js';

import IntRange from './intrange';
import IntRangeSet from './intrangeset';

const NUM_WORKERS = 3; // This many images can be processed simultneously
const SCALE = 2; // Higher scale leads to better accuracy, but longer processing time
const THRESHOLD = 10; // Maximum number of pixels distance to form a continuous column

type MessageType =
  | 'info'
  | 'error'
;

class MessageContainer {
  readonly el: HTMLElement;

  constructor(initialMessage?: string, initialMessageType?: MessageType) {
    this.setMessage = this.setMessage.bind(this);

    this.el = document.createElement('p');
    this.el.className = 'message';

    if (initialMessage !== undefined) {
      this.setMessage(initialMessage, initialMessageType);
    }
  }

  setMessage(message: string, messageType: MessageType = 'info') {
    while (this.el.firstChild) {
      this.el.removeChild(this.el.firstChild);
    }

    this.el.classList.remove('info');
    this.el.classList.remove('error');
    this.el.classList.add(messageType);
    this.el.appendChild(document.createTextNode(message));
  }
}

async function scaleImage(image: string, scale: number): Promise<string> {
  const img = document.createElement('img');

  await new Promise<void>((resolve) => {
    img.onload = () => {
      resolve();
    };

    img.src = image;
  });

  const newWidth = img.width * scale;
  const newHeight = img.height * scale;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = newWidth;
  canvas.height = newHeight;

  if (!context) {
    throw new Error('Unable to retrieve canvas context');
  }

  context.drawImage(img, 0, 0, newWidth, newHeight);

  return canvas.toDataURL();
}

class AppRequest {
  readonly el: HTMLElement;

  readonly messageContainer: MessageContainer;

  constructor(image: string, scale: number, threshold: number) {
    this.messageContainer = new MessageContainer('Loading...please wait.');

    this.el = document.createElement('section');

    this.el.appendChild(this.messageContainer.el);

    const pImg = document.createElement('p');
    pImg.className = 'image';

    const img = document.createElement('img');
    img.src = image;

    pImg.appendChild(img);
    this.el.appendChild(pImg);

    const scaledImage = scaleImage(image, scale);

    // TODO: Operate on scaledImage
  }
}

function createAppRequest(image: string, scale: number, threshold: number): void {
  const appRequestContainer = document.getElementById('appRequestContainer');

  if (!appRequestContainer) {
    throw new Error('Unable to obtain #appRequestContainer');
  }

  const appRequest = new AppRequest(image, scale, threshold);

  appRequestContainer.insertBefore(appRequest.el, appRequestContainer.firstChild);
}

async function handlePaste(event: ClipboardEvent): Promise<void> {
  console.log(event);

  createAppRequest('123', SCALE, THRESHOLD);
}

async function init(): Promise<void> {
  const appMessageContainer = new MessageContainer('Loading...please wait.');
  const appRequestContainer = document.createElement('main');
  appRequestContainer.id = 'appRequestContainer';

  document.body.appendChild(appMessageContainer.el);
  document.body.appendChild(appRequestContainer);

  // TODO: createScheduler(), createWorker()

  document.addEventListener('paste', handlePaste);

  appMessageContainer.setMessage('Please paste an image.');
}

window.addEventListener('load', init);
