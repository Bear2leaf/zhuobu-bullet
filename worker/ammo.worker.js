const Module = { TOTAL_MEMORY: 256 * 1024 * 1024 };

const isBrowser = typeof worker === "undefined"
const config = {
    wasmBinary: null,
    locateFile: null
};
const handler = {
    onmessage: null,
    postMessage: null,
    messageQueue: []
}
if (isBrowser) {
    config.locateFile = () => "/wasm/ammo.wasm.wasm";
    onmessage = (event) => handler.onmessage(event.data);
    handler.postMessage = (data) => postMessage(data);
    importScripts("/worker/ammo.wasm.js")
} else {
    globalThis.WebAssembly = {
        instantiate(path, imports) {
            return WXWebAssembly.instantiate("/wasm/ammo.wasm.wasm", imports)
        },
        RuntimeError: Error
    }
    config.wasmBinary = new Uint8Array(0)

    worker.onMessage((event) => handler.onmessage(event));
    handler.postMessage = (data) => worker.postMessage(data);
    var Ammo = require('./ammo.wasm.js');
}
export { handler, config, Module };
export default Ammo;