import Engine from "./engine/Engine.js";
import BrowserDevice from "./device/BrowserDevice.js";
import Device from "./device/Device.js";
import MinigameDevice from "./device/MinigameDevice.js";

async function mainH5() {
    const device = new BrowserDevice();
    new EventSource('/esbuild').addEventListener('change', () => location.reload());
    return device;
}
async function mainMinigame() {
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
typeof wx === "undefined" ? mainH5().then(start) : mainMinigame().then(start);
