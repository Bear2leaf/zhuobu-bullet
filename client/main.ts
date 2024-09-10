import Device from "./device/Device.js";
import Engine from "./core/Engine.js";
import AudioSystem from "./system/AudioSystem.js";

export async function mainH5() {
    const BrowserDevice = (await import("./device/BrowserDevice.js")).default;
    const device = new BrowserDevice();
    new EventSource('/esbuild').addEventListener('change', () => location.reload());
    return device;
}
export async function mainMinigame() {
    const MinigameDevice = (await import("./device/MinigameDevice.js")).default;
    const device = new MinigameDevice();
    await device.loadSubpackage();
    return device;
}
async function start(device: Device) {
    const {
        windowHeight: height,
        windowWidth: width,
        pixelRatio: dpr
    }= device.getWindowInfo();
    const audio = new AudioSystem(device);

    const engine = new Engine(width, height, dpr, device.getCanvasGL(), audio);
    device.onmessage = engine.eventSystem.onmessage.bind(engine.eventSystem);
    let delta = 0;
    let last = 0;
    await engine.load();
    device.createWorker("dist/worker/main.js");
    engine.eventSystem.sendmessage = device.sendmessage.bind(device);
    function update(t: number) {
        requestAnimationFrame((t) => update(t));
        delta = (t - last) / 1000;
        last = t;
        engine.loop(delta);
    }
    requestAnimationFrame((t) => {
        last = t;
        engine.start();
        update(t);
    });
}
export {
    start,
}
