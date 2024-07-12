import Device from "./device/Device.js";
import Stage from "./Stage.js";
import AudioManager from "./audio/AudioManager.js";

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

    const audio = new AudioManager(device);
    audio.initAudioContext();
    const stage = new Stage(device);
    device.onmessage = (message) => {
        // console.log("message from worker", message);
        if (message.type === "update") {
            stage.onUpdate(message);
        } else if (message.type === "ready") {
            device.onaccelerometerchange = (x, y, z) => {
                device.sendmessage && device.sendmessage({ type: "updateGravity", data: `${x * 10},${y * 10},${z * 10}` });
            }
            stage.setBorder(message.halfWidth, message.halfHeight, message.halfDepth)
            requestAnimationFrame((t) => {
                last = startTime = t;
                audio.initAudio();
                stage.start();
                update(t);
            });
        }
    };
    let startTime = 0;
    let delta = 0;
    let now = 0;
    let last = 0;
    await stage.load();
    await audio.load();
    device.createWorker("dist/worker/main.js");
    stage.onclick = (tag?: string) => {
        audio.play(tag);
    }
    function update(t: number) {
        delta = (t - last) / 1000;
        last = t;
        now += delta;
        stage.loop(delta);
        audio.process();
        requestAnimationFrame(update);
    }
}

export {
    start,
}
