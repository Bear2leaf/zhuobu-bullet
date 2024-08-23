import Device from "./device/Device.js";
import Engine from "./core/Engine.js";
import AudioSystem from "./system/AudioSystem.js";
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
    const audio = new AudioSystem(device);
    audio.initAudioContext();
    const [width, height, dpr] = device.getWindowInfo();

    const engine = new Engine(width, height, dpr, device.getCanvasGL());
    device.onmessage = (message: WorkerMessage) => {
        // console.log("message from worker", message);
        if (message.type === "requestLevel") {
            audio.play();
            engine.requestLevel();
        } else if (message.type === "ready") {
            device.sendmessage({
                type: "resetWorld",
            });
        } else if (message.type === "removeBody") {
            engine.hideMesh(message.data);
        } else if (message.type === "update") {
            engine.updateMesh(message);
        } else if (message.type === "collision") {
            engine.handleCollision(message.data);
        }
    };
    engine.ongetpickaxe = () => device.sendmessage({
        type: "getPickaxe"
    })
    engine.onpause = () => device.sendmessage({
        type: "pause"
    })
    engine.onrelease = () => device.sendmessage({
        type: "release"
    })
    engine.onaddmesh = (name, transform, vertices, indices, propertities) => device.sendmessage({
        type: "addMesh",
        data: { vertices: [...vertices], indices: [...indices], propertities, name, transform }
    })
    engine.onremovemesh = (name) => {
        device.sendmessage({
            type: "removeMesh",
            data: name
        })
    }
    engine.onupdatevelocity = (name, x, y, z) => {
        device.sendmessage({
            type: "updateVelocity",
            data: {
                name,
                x,
                y,
                z
            }
        })
    }
    engine.onaddball = (transform) => device.sendmessage({
        type: "addBall",
        data: { transform }
    })
    engine.ontoggleaudio = () => {
        audio.toggle();
        engine.updateSwitch("audio", audio.isOn())
    }
    engine.onresetworld = () => device.sendmessage({
        type: "resetWorld",
    })
    let delta = 0;
    let last = 0;
    await engine.load();
    await audio.load();
    device.createWorker("dist/worker/main.js");
    function update(t: number) {
        requestAnimationFrame((t) => update(t));
        delta = (t - last) / 1000;
        last = t;
        engine.loop(delta);
        audio.update();
        const gravity = engine.gravity;
        device.sendmessage({ type: "updateGravity", data: `${gravity[0]},${gravity[1]},${gravity[2]}` })
    }
    requestAnimationFrame((t) => {
        last = t;
        audio.init();
        engine.start();
        update(t);
    });
}
export {
    start,
}
