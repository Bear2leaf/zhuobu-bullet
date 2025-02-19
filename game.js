

const windowInfo = wx.getWindowInfo();

const events = {}
const document = {
    ontouchstart: null,
    ontouchmove: null,
    ontouchend: null,
    body: {
        clientWidth: windowInfo.windowWidth,
        clientHeight: windowInfo.windowHeight
    },
    createElement() {
        console.log("createElement: ", ...arguments)
        return {}
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

class TextDecoder {
    decode(data) {
        return wx.decode({data, format: 'utf-8'});
    }
}

function Image() {
    return wx.createImage();
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


const _window = {
    Image,
    TextDecoder,
    WebAssembly: {
        Instance: WXWebAssembly.Instance,
        instantiate(url, imports) {
            console.log(...arguments)
            if (typeof url === 'string') {
                return WXWebAssembly.instantiate(url, imports)
            } else if (url instanceof ArrayBuffer) {
                if (url.byteLength === 285948) {
                    return WXWebAssembly.instantiate("/resources/wasm/draco_decoder.wasm", imports)
                } else {
                    throw new Error('instantiate Arraybuffer error')
                }
            } else {
                throw new Error('instantiate error')
            }
        },
        RuntimeError: Error
    },
    self: null,
    document,
    devicePixelRatio: windowInfo.pixelRatio,
    fetch: async function (url) {
        return {
            async json() {
                return JSON.parse(wx.getFileSystemManager().readFileSync(url, "utf-8"))
            },
            async arrayBuffer() {
                return wx.getFileSystemManager().readFileSync(url);
            },
            async text() {
                return wx.getFileSystemManager().readFileSync(url, "utf-8")
            },
            ok: true
        }
    }
}
const global = GameGlobal

function inject() {
    _window.self = GameGlobal
    _window.addEventListener = (type, listener) => {
        _window.document.addEventListener(type, listener)
    }
    _window.removeEventListener = (type, listener) => {
        _window.document.removeEventListener(type, listener)
    }

    if (_window.canvas) {
        _window.canvas.addEventListener = _window.addEventListener
        _window.canvas.removeEventListener = _window.removeEventListener
    }

    const { platform } = wx.getSystemInfoSync()

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
require("./dist/main");