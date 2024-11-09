import Engine from "./core/Engine.js";
import Device from "./device/Device.js";

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

    const engine = new Engine(device);
    let delta = 0;
    let last = 0;
    engine.init();
    await engine.load();
    function update(t: number) {
        requestAnimationFrame((t) => update(t));
        delta = (t - last) / 1000;
        last = t;
        engine.loop(delta);
    }
    requestAnimationFrame((t) => {
        engine.start();
        update(t);
        last = t;
    });
}
export {
    start
};
