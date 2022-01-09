/* eslint max-classes-per-file: 0 */

import {
  createScheduler, createWorker, Page, RecognizeResult, Scheduler,
} from 'tesseract.js';

import IntRange from './intrange';
import IntRangeSet from './intrangeset';

const NUM_WORKERS = 3; // This many images can be processed simultneously
const SCALE = 3; // Higher scale leads to better accuracy, but longer processing time
const THRESHOLD = 5; // Maximum number of pixels distance to form a continuous column
const DELIMITER = '\t';
const CONFIDENCE_THRESHOLD = 90;
const LOW_CONFIDENCE_MARKER = ' (?)';

type MessageType =
  | 'info'
  | 'error'
;

type Row = string[];

type Table = Row[];

function isType<T>(value: any): value is T {
  return (value as T) !== undefined;
}

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

function readFileAsDataURL(file: File): Promise<string> {
  const fileReader = new FileReader();

  const promise = new Promise<string>((resolve, reject) => {
    fileReader.onload = (event) => {
      if (event.target === null || typeof (event.target.result) !== 'string') {
        reject(Error('Unable to load file as data URL'));
        return;
      }

      resolve(event.target.result);
    };
  });

  fileReader.readAsDataURL(file);

  return promise;
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

function processOcrData(page: Page, threshold: number): Table {
  const table: Table = [];

  const columnRanges: IntRange[] = [];

  // Determine column positions based on threshold
  for (let i = 0, iN = page.symbols.length; i < iN; i += 1) {
    const symbol = page.symbols[i];
    columnRanges.push({ start: symbol.bbox.x0, end: symbol.bbox.x1 });
  }

  const columnRangeSet = new IntRangeSet(columnRanges, threshold);

  // Determine cell contents based on column positions
  for (let i = 0, iN = page.lines.length; i < iN; i += 1) {
    const line = page.lines[i];

    const row: Row = [];
    let cellContents: string | null = null;
    let cellConfidence = 100;
    let currentColumn: number | null = null;

    for (let j = 0, jN = line.words.length; j < jN; j += 1) {
      const word = line.words[j];

      cellConfidence = Math.min(cellConfidence, word.confidence);

      const thisWordColumn = columnRangeSet.getIndex(word.bbox.x0);

      if (thisWordColumn === currentColumn) {
        if (cellContents === null) {
          cellContents = word.text;
        } else {
          cellContents = `${cellContents} ${word.text}`;
        }
      } else {
        if (cellContents !== null) {
          if (cellConfidence < CONFIDENCE_THRESHOLD) {
            cellContents = `${cellContents}${LOW_CONFIDENCE_MARKER}`;
          }

          row.push(cellContents);
        }

        if (currentColumn === null) {
          currentColumn = 0;
        }

        // thisWordColumn should never be null, because all symbols' bbox.x0s
        // are added to columnRangeSet
        if (thisWordColumn !== null) {
          // Add blank cells for skipped columns
          for (let k = (thisWordColumn - currentColumn) - 1; k > 0; k -= 1) {
            row.push('');
          }
        }

        // Begin a new cell
        cellContents = word.text;
        cellConfidence = 100;
        currentColumn = thisWordColumn;
      }
    }

    // Add the contents of the last cell to the row
    if (cellContents !== null) {
      if (cellConfidence < CONFIDENCE_THRESHOLD) {
        cellContents = `${cellContents}${LOW_CONFIDENCE_MARKER}`;
      }

      row.push(cellContents);
    }

    table.push(row);
  }

  return table;
}

class AppRequest {
  readonly el: HTMLElement;

  readonly elImg: HTMLImageElement;

  readonly elTextarea: HTMLTextAreaElement;

  readonly messageContainer: MessageContainer;

  constructor(appRequestContainer: HTMLElement) {
    this.el = document.createElement('section');
    appRequestContainer.insertBefore(this.el, appRequestContainer.firstChild);

    this.messageContainer = new MessageContainer('Loading...please wait.');
    this.el.appendChild(this.messageContainer.el);

    this.elTextarea = document.createElement('textarea');
    this.el.appendChild(this.elTextarea);
    this.elTextarea.classList.add('hidden');

    const pImg = document.createElement('p');
    pImg.className = 'image';

    this.elImg = document.createElement('img');

    pImg.appendChild(this.elImg);
    this.el.appendChild(pImg);
  }

  async start(
    scheduler: Scheduler,
    image: string,
    scale: number,
    threshold: number,
    delimiter: string,
  ): Promise<void> {
    this.elImg.src = image;

    this.elTextarea.classList.add('hidden');

    const startTime = new Date();

    this.messageContainer.setMessage('Resizing image to improve accuracy...please wait.');
    const scaledImage = await scaleImage(image, scale);

    this.messageContainer.setMessage('Converting image to text...please wait.');
    const result = await scheduler.addJob('recognize', scaledImage);
    if (!isType<RecognizeResult>(result)) {
      throw new Error('Tesseract did not return a RecognizeResult');
    }
    const { data } = result;

    this.messageContainer.setMessage('Processing data in image...please wait.');
    const table = processOcrData(data, threshold);

    const endTime = new Date();
    const jobDurationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
    const jobDurationSecondsStr = jobDurationSeconds.toLocaleString(
      undefined, // Use default locale
      { maximumFractionDigits: 2, minimumFractionDigits: 2 },
    );

    this.messageContainer.setMessage(`Image processing completed in ${jobDurationSecondsStr} seconds.`);

    this.elTextarea.classList.remove('hidden');

    let text = '';

    let lengthOfLongestWord = 1;

    for (let i = 0, iN = table.length; i < iN; i += 1) {
      const row = table[i];

      for (let j = 0, jN = row.length; j < jN; j += 1) {
        const cell = row[j];

        lengthOfLongestWord = Math.max(cell.length, lengthOfLongestWord);

        text = `${text}${cell}${delimiter}`;
      }

      // Remove the last delimiter
      if (row.length >= 1) {
        text = text.slice(0, -1);
      }

      text = `${text}\n`;
    }

    this.elTextarea.setAttribute('style', `tab-size: ${lengthOfLongestWord + 2}`);
    this.elTextarea.value = text;
  }
}

async function createAppRequest(
  scheduler: Scheduler,
  file: File,
  scale: number,
  threshold: number,
  delimiter: string,
): Promise<void> {
  const appRequestContainer = document.getElementById('appRequestContainer');

  if (!appRequestContainer) {
    throw new Error('Unable to obtain #appRequestContainer');
  }

  const image = await readFileAsDataURL(file);

  const appRequest = new AppRequest(appRequestContainer);
  await appRequest.start(scheduler, image, scale, threshold, delimiter);
}

async function handlePaste(event: ClipboardEvent, scheduler: Scheduler): Promise<void> {
  if (event.clipboardData === null) {
    return;
  }

  const { items } = event.clipboardData;

  const promises: Promise<void>[] = [];

  for (let i = 0, iN = items.length; i < iN; i += 1) {
    const item = items[i];

    if (item.kind === 'file') {
      const file = item.getAsFile();

      if (file instanceof File) {
        promises.push(createAppRequest(scheduler, file, SCALE, SCALE * THRESHOLD, DELIMITER));
      }
    }
  }

  await Promise.all(promises);
}

async function addWorker(scheduler: Scheduler): Promise<void> {
  const worker = createWorker();

  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');

  scheduler.addWorker(worker);
}

async function init(): Promise<void> {
  const appMessageContainer = new MessageContainer('Loading...please wait.');
  const appRequestContainer = document.createElement('main');
  appRequestContainer.id = 'appRequestContainer';

  document.body.appendChild(appMessageContainer.el);
  document.body.appendChild(appRequestContainer);

  const scheduler = createScheduler();

  const workerPromises: Promise<void>[] = [];

  for (let i = 0; i < NUM_WORKERS; i += 1) {
    workerPromises.push((async (): Promise<void> => {
      await addWorker(scheduler);
    })());
  }

  await Promise.all(workerPromises);

  document.addEventListener('paste', async (event: ClipboardEvent): Promise<void> => {
    await handlePaste(event, scheduler);
  });

  appMessageContainer.setMessage('Please paste an image.');
}

window.addEventListener('load', init);
