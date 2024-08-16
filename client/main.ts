import Device from "./device/Device.js";
import Stage from "./core/Stage.js";
import AudioManager from "./audio/AudioManager.js";
import { WorkerMessage } from "../worker/ammo.worker.js";

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
    const [width, height, dpr] = device.getWindowInfo();

    const stage = new Stage(width, height, dpr, device.getCanvasGL());
    device.onmessage = (message: WorkerMessage) => {
        // console.log("message from worker", message);
        if (message.type === "addBody") {
            stage.addBody(message);
        } else if (message.type === "requestLevel") {
            audio.play();
            stage.requestLevel();
        } else if (message.type === "ready") {
            device.sendmessage({
                type: "resetWorld",
            });
        } else if (message.type === "removeBody") {
            stage.removeBody(message.data);
        } else if (message.type === "update") {
            stage.updateBody(message);
        }
    };
    stage.onpause = () => device.sendmessage({
        type: "pause"
    })
    stage.onrelease = () => device.sendmessage({
        type: "release"
    })
    stage.onaddmesh = (name, transform, vertices, indices, propertities) => device.sendmessage({
        type: "addMesh",
        data: { vertices: [...vertices], indices: [...indices], propertities, name, transform }
    })
    stage.onaddball = (transform) => device.sendmessage({
        type: "addBall",
        data: { transform }
    })
    stage.ontoggleaudio = () => {
        audio.toggle();
        stage.updateSwitch("audio", audio.isOn())
    }
    stage.onresetworld = () => device.sendmessage({
        type: "resetWorld",
    })
    let delta = 0;
    let last = 0;
    await stage.load();
    await audio.load();
    device.createWorker("dist/worker/main.js");
    stage.setInitLevel(parseInt(device.getParam("level")) || 0);
    function update(t: number) {
        requestAnimationFrame((t) => update(t));
        delta = (t - last) / 1000;
        last = t;
        stage.loop(delta);
        audio.process();
        const gravity = stage.gravity;
        device.sendmessage({ type: "updateGravity", data: `${gravity[0]},${gravity[1]},${gravity[2]}` })
    }
    requestAnimationFrame((t) => {
        last = t;
        audio.initAudio();
        stage.start();
        update(t);
    });
}
export {
    start,
}
