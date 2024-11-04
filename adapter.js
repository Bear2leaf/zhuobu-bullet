
const context = wx.createWebAudioContext();
const startupTime = wx.getPerformance().now();
const { platform } = wx.getDeviceInfo()
const navigator = {
    platform,
    getGamepads() {
        return [];
    },
}

class AudioContext {
    constructor() {
        this.destination = context.destination;
    }
    async decodeAudioData(data, resolvecb, rejectcb) {
        if (resolvecb) {
            context.decodeAudioData(data, buffer => {
                resolvecb(buffer)
            }, err => {
                console.error('decodeAudioData fail', err)
                rejectcb()
            })
        } else {
            return new Promise(((resolve, reject) => {
                context.decodeAudioData(data, buffer => {
                    resolve(buffer)
                }, err => {
                    console.error('decodeAudioData fail', err)
                    reject()
                })
            }))
        }
    }
    createGain() { return context.createGain(...arguments); }
    createBuffer() { return context.createBuffer(...arguments); }
    createBufferSource() { return context.createBufferSource(...arguments); }
    suspend() { return context.suspend(...arguments); }
    createDelay() { return context.createDelay(...arguments); }
}

const windowInfo = wx.getWindowInfo();
const events = {}
const document = {
    ontouchstart: null,
    ontouchmove: null,
    ontouchend: null,
    documentElement: null,
    readyState: 'complete',
    visibilityState: 'visible',
    hidden: false,
    style: {},
    fonts: {
        check() {
            // tempFuncWrapper("document.font.check", [...arguments])
            return true;
        },
        add() {
        }
    },
    hasFocus() {
        return true
    },
    createElement(tag) {
        if (tag !== 'canvas') {
            throw new Error("unsupport tag: " + tag);
        }
        const canvas = wx.createCanvas()

        if (platform !== 'devtools') {
            canvas.parentElement = {
                offsetWidth: windowInfo.windowWidth,
                offsetHeight: windowInfo.windowHeight
            };
            const tempFuncWrapper = function (name, args) {
                console.warn(`${name} with ${args} is called in weapp!`)
            }
            canvas.removeEventListener = function () { tempFuncWrapper('HTMLElement.removeEventListener', [...arguments]); }
            canvas.addEventListener = function () {
                tempFuncWrapper('HTMLElement.addEventListener', [...arguments]);
                document.addEventListener(...arguments);
            }
            canvas.focus = function () {
                tempFuncWrapper('HTMLElement.focus', [...arguments]);
            }
            const getCtx = canvas.getContext;
            canvas.getContext = function () {
                const ctx = getCtx.apply(canvas, arguments);
                const measureText = ctx.measureText;
                ctx.measureText = function () {
                    const res = measureText.apply(ctx, arguments);
                    res.fontBoundingBoxAscent = res.actualBoundingBoxAscent;
                    res.fontBoundingBoxDescent = res.actualBoundingBoxDescent;
                    return res;
                }
                return ctx;
            }
            canvas.getBoundingClientRect = function () {
                return {
                    x: 0,
                    y: 0,
                    top: 0,
                    left: 0,
                    width: windowInfo.windowWidth,
                    height: windowInfo.windowHeight
                }
            }
        }

        return canvas
    },
    body: {
        clientWidth: windowInfo.windowWidth,
        clientHeight: windowInfo.windowHeight,
        style: {
            cssText: ""
        },
        appendChild() {
            console.log(...arguments)
        }
    },
    addEventListener(type, listener) {
        if (!events[type]) {
            events[type] = []
        }
        events[type].push(listener)
    },

    removeEventListener(type, listener) {
        const listeners = events[type]

        if (listeners && listeners.length > 0) {
            for (let i = listeners.length; i--; i > 0) {
                if (listeners[i] === listener) {
                    listeners.splice(i, 1)
                    break
                }
            }
        }
    },

    dispatchEvent(event) {
        const listeners = events[event.type]

        if (listeners) {
            for (let i = 0; i < listeners.length; i++) {
                listeners[i](event)
            }
        }
    },
}

class Blob {
    constructor([arrayBuffer]) {
        this.buffer = arrayBuffer
    }
}
function URL() {
    throw new Error("Not implemented");
}

URL.createObjectURL = function (blob) {
    return wx.createBufferURL(blob.buffer);
}
class TextDecoder {
    decode(data) {
        return wx.decode({ data, format: 'utf-8' });
    }
}

function Image() {
    return wx.createImage();
}
function noop() { }
function touchEventHandlerFactory(type) {
    return (event) => {
        event.type = type;
        event.preventDefault = noop;
        event.stopPropagation = noop;
        document.dispatchEvent(event)
    }
}

function wheelEventHandlerFactory(type) {
    return (event) => {
        event.type = type;
        event.preventDefault = noop;
        event.stopPropagation = noop;
        document.dispatchEvent(event)
    }
}


function pointerEventHandlerFactory(type) {
    return (event) => {
        const touches = [];
        touches.push(...event.changedTouches)
        for (const change of touches) {
            document.dispatchEvent({
                pageX: change.pageX,
                pageY: change.pageY,
                offsetX: change.offsetX,
                offsetY: change.offsetY,
                pointerId: change.identifier,
                target: document,
                type,
                pointerType: "touch"
            })
        }
    }
}
wx.onTouchStart(pointerEventHandlerFactory('pointerdown'))
wx.onTouchMove(pointerEventHandlerFactory('pointermove'))
wx.onTouchEnd(pointerEventHandlerFactory('pointerup'))
wx.onTouchCancel(pointerEventHandlerFactory('pointercancel'))

wx.onWheel(wheelEventHandlerFactory('wheel'))


class ResizeObserver {
    observe() {
    }
}
class ImageData {
    constructor(data, w, h) {
        if (!window.canvas2d) {
            const canvas2d = document.createElement("canvas");
            window.canvas2d = canvas2d;
            const canvas2dCtx = canvas2d.getContext("2d");
            window.canvas2dCtx = canvas2dCtx;
        }
        const imageData = window.canvas2dCtx.createImageData(w, h);
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i + 0] = data[i + 0];
            imageData.data[i + 1] = data[i + 1];
            imageData.data[i + 2] = data[i + 2];
            imageData.data[i + 3] = data[i + 3];
        }
        window.canvas2dCtx.putImageData(imageData, w, h)
        return imageData;
    }
}

const _window = {
    Image,
    AudioContext,
    TextDecoder,
    ResizeObserver,
    ImageData,
    URL,
    navigator,
    Blob,
    style: {
        width: windowInfo.windowWidth,
        height: windowInfo.windowHeight
    },
    localStorage: {},
    console: {
        log: console.log,
        assert(e, t) {
            if (!e) {
                throw new Error(t)
            }
        },
        debug: console.log,
        warn: console.log,
        error: console.log
    },
    document,
    WebAssembly: {
        Instance: WXWebAssembly.Instance,
        instantiate(url, imports) {
            // console.log(...arguments)
            if (typeof url === 'string') {
                return WXWebAssembly.instantiate(url, imports)
            } else if (url instanceof ArrayBuffer) {
                if (url.byteLength === 192593) {
                    return WXWebAssembly.instantiate("resources/wasm/draco_decoder_gltf.wasm", imports)
                } else if (url.byteLength === 76163) {
                    return WXWebAssembly.instantiate(`resources/wasm/yoga-wasm-base64-esm.wasm`, imports)
                } else {
                    throw new Error('instantiate Arraybuffer error')
                }
            } else if (url instanceof Uint8Array) {
                if (url.byteLength === 343490) {
                    return WXWebAssembly.instantiate("resources/wasm/recast-navigation.wasm.wasm", imports)
                } else {
                    throw new Error('instantiate Uint8array error')
                }
            } else {
                throw new Error('instantiate error')
            }
        },
        RuntimeError: Error
    },
    innerWidth: windowInfo.windowWidth,
    innerHeight: windowInfo.windowHeight,
    devicePixelRatio: windowInfo.pixelRatio,
    self: null,
    fetch: async function (url) {
        return {
            ok: true,
            async json() {
                return JSON.parse(wx.getFileSystemManager().readFileSync(url, "utf-8"))
            },
            async arrayBuffer() {
                return wx.getFileSystemManager().readFileSync(url);
            },
            async text() {
                return wx.getFileSystemManager().readFileSync(url, "utf-8")
            }
        }
    }
}
const global = GameGlobal

function inject() {
    _window.addEventListener = (type, listener) => {
        _window.document.addEventListener(type, listener)
    }
    _window.removeEventListener = (type, listener) => {
        _window.document.removeEventListener(type, listener)
    }

    _window.document.documentElement = _window;
    _window.self = GameGlobal
    // 开发者工具无法重定义 window
    if (platform === 'devtools') {
        for (const key in _window) {
            const descriptor = Object.getOwnPropertyDescriptor(global, key)

            if (!descriptor || descriptor.configurable === true) {
                Object.defineProperty(window, key, {
                    value: _window[key]
                })
            }
        }

        for (const key in _window.document) {
            const descriptor = Object.getOwnPropertyDescriptor(global.document, key)

            if (!descriptor || descriptor.configurable === true) {
                Object.defineProperty(global.document, key, {
                    value: _window.document[key]
                })
            }
        }
        window.parent = window
    } else {
        for (const key in _window) {
            global[key] = _window[key]
        }
        global.window = _window
        window = global
        window.top = window.parent = window
    }
}

if (!GameGlobal.__isAdapterInjected) {
    GameGlobal.__isAdapterInjected = true
    inject()
}