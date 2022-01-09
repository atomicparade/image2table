/* eslint max-classes-per-file: 0 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { createScheduler, createWorker } from 'tesseract.js';
var NUM_WORKERS = 3; // This many images can be processed simultneously
var SCALE = 3; // Higher scale leads to better accuracy, but longer processing time
var THRESHOLD = 10; // Maximum number of pixels distance to form a continuous column
var MessageContainer = /** @class */ (function () {
    function MessageContainer(initialMessage, initialMessageType) {
        this.setMessage = this.setMessage.bind(this);
        this.el = document.createElement('p');
        this.el.className = 'message';
        if (initialMessage !== undefined) {
            this.setMessage(initialMessage, initialMessageType);
        }
    }
    MessageContainer.prototype.setMessage = function (message, messageType) {
        if (messageType === void 0) { messageType = 'info'; }
        while (this.el.firstChild) {
            this.el.removeChild(this.el.firstChild);
        }
        this.el.classList.remove('info');
        this.el.classList.remove('error');
        this.el.classList.add(messageType);
        this.el.appendChild(document.createTextNode(message));
    };
    return MessageContainer;
}());
function readFileAsDataURL(file) {
    var fileReader = new FileReader();
    var promise = new Promise(function (resolve, reject) {
        fileReader.onload = function (event) {
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
function scaleImage(image, scale) {
    return __awaiter(this, void 0, void 0, function () {
        var img, newWidth, newHeight, canvas, context;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    img = document.createElement('img');
                    return [4 /*yield*/, new Promise(function (resolve) {
                            img.onload = function () {
                                resolve();
                            };
                            img.src = image;
                        })];
                case 1:
                    _a.sent();
                    newWidth = img.width * scale;
                    newHeight = img.height * scale;
                    canvas = document.createElement('canvas');
                    context = canvas.getContext('2d');
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    if (!context) {
                        throw new Error('Unable to retrieve canvas context');
                    }
                    context.drawImage(img, 0, 0, newWidth, newHeight);
                    return [2 /*return*/, canvas.toDataURL()];
            }
        });
    });
}
var AppRequest = /** @class */ (function () {
    function AppRequest(appRequestContainer) {
        this.el = document.createElement('section');
        appRequestContainer.insertBefore(this.el, appRequestContainer.firstChild);
        this.messageContainer = new MessageContainer('Loading...please wait.');
        this.el.appendChild(this.messageContainer.el);
        this.elTextarea = document.createElement('textarea');
        this.el.appendChild(this.elTextarea);
        this.elTextarea.classList.add('hidden');
        var pImg = document.createElement('p');
        pImg.className = 'image';
        this.elImg = document.createElement('img');
        pImg.appendChild(this.elImg);
        this.el.appendChild(pImg);
    }
    AppRequest.prototype.start = function (scheduler, image, scale, threshold) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, scaledImage, data, endTime, jobDurationSeconds, jobDurationSecondsStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.elImg.src = image;
                        this.elTextarea.classList.add('hidden');
                        startTime = new Date();
                        this.messageContainer.setMessage('Resizing image to improve accuracy...please wait.');
                        return [4 /*yield*/, scaleImage(image, scale)];
                    case 1:
                        scaledImage = _a.sent();
                        this.messageContainer.setMessage('Converting image to text...please wait.');
                        return [4 /*yield*/, scheduler.addJob('recognize', scaledImage)];
                    case 2:
                        data = (_a.sent()).data;
                        this.messageContainer.setMessage('Processing data in image...please wait.');
                        endTime = new Date();
                        jobDurationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
                        jobDurationSecondsStr = jobDurationSeconds.toLocaleString(undefined, // Use default locale
                        { maximumFractionDigits: 2, minimumFractionDigits: 2 });
                        this.messageContainer.setMessage("Image processing completed in " + jobDurationSecondsStr + " seconds.");
                        this.elTextarea.classList.remove('hidden');
                        this.elTextarea.value = data.text;
                        return [2 /*return*/];
                }
            });
        });
    };
    return AppRequest;
}());
function createAppRequest(scheduler, file, scale, threshold) {
    return __awaiter(this, void 0, void 0, function () {
        var appRequestContainer, image, appRequest;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    appRequestContainer = document.getElementById('appRequestContainer');
                    if (!appRequestContainer) {
                        throw new Error('Unable to obtain #appRequestContainer');
                    }
                    return [4 /*yield*/, readFileAsDataURL(file)];
                case 1:
                    image = _a.sent();
                    appRequest = new AppRequest(appRequestContainer);
                    return [4 /*yield*/, appRequest.start(scheduler, image, scale, threshold)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handlePaste(event, scheduler) {
    return __awaiter(this, void 0, void 0, function () {
        var items, promises, i, item, file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (event.clipboardData === null) {
                        return [2 /*return*/];
                    }
                    items = event.clipboardData.items;
                    promises = [];
                    for (i = 0; i < items.length; i += 1) {
                        item = items[i];
                        if (item.kind === 'file') {
                            file = item.getAsFile();
                            if (file instanceof File) {
                                promises.push(createAppRequest(scheduler, file, SCALE, THRESHOLD));
                            }
                        }
                    }
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function addWorker(scheduler) {
    return __awaiter(this, void 0, void 0, function () {
        var worker;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    worker = createWorker();
                    return [4 /*yield*/, worker.load()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, worker.loadLanguage('eng')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, worker.initialize('eng')];
                case 3:
                    _a.sent();
                    scheduler.addWorker(worker);
                    return [2 /*return*/];
            }
        });
    });
}
function init() {
    return __awaiter(this, void 0, void 0, function () {
        var appMessageContainer, appRequestContainer, scheduler, workerPromises, i;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    appMessageContainer = new MessageContainer('Loading...please wait.');
                    appRequestContainer = document.createElement('main');
                    appRequestContainer.id = 'appRequestContainer';
                    document.body.appendChild(appMessageContainer.el);
                    document.body.appendChild(appRequestContainer);
                    scheduler = createScheduler();
                    workerPromises = [];
                    for (i = 0; i < NUM_WORKERS; i += 1) {
                        workerPromises.push((function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, addWorker(scheduler)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })());
                    }
                    return [4 /*yield*/, Promise.all(workerPromises)];
                case 1:
                    _a.sent();
                    document.addEventListener('paste', function (event) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, handlePaste(event, scheduler)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    appMessageContainer.setMessage('Please paste an image.');
                    return [2 /*return*/];
            }
        });
    });
}
window.addEventListener('load', init);
//# sourceMappingURL=index.js.map