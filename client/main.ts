import Device from "./device/Device.js";
import Stage from "./core/Stage.js";
import AudioManager from "./audio/AudioManager.js";
import { WorkerMessage } from "../worker/ammo.worker.js";
import { Quat, Vec3 } from "ogl";

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
    stage.onaddmesh = (total, vertices, indices, propertities) => {
        device.sendmessage && device.sendmessage({
            type: "addMesh",
            data: { total, vertices: [...vertices], indices: [...indices], propertities }
        })
    }
    const gravity = new Vec3;
    const rotation = new Quat;
    const acc = new Vec3;
    const messageQueue: WorkerMessage[] = [];
    device.onmessage = (message) => messageQueue.push(message);
    let paused = true;
    function messageHandler(message: WorkerMessage) {
        // console.log("message from worker", message);
        if (message.type === "update") {
            stage.updateBody(message);
        } else if (message.type === "addBody") {
            stage.addBody(message);
        } else if (message.type === "requestLevel") {
            stage.requestLevel();
        } else if (message.type === "ready") {
            device.onaccelerometerchange = (x, y, z) => {
                acc[0] = x;
                acc[1] = y;
                acc[2] = z;
            }
            stage.onorientationchange = (quat) => {
                rotation[0] = quat.x;
                rotation[1] = quat.y;
                rotation[2] = quat.z;
                rotation[3] = quat.w;
            }
            stage.setBorder(message.halfWidth, message.halfHeight, message.halfDepth);
            device.sendmessage && device.sendmessage({
                type: "resetWorld",
            })
            paused = false;
        } else if (message.type === "removeBody") {
            stage.removeBody(message.data);
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
        device.sendmessage && device.sendmessage({
            type: "release"
        })
    }
    function update(t: number) {
        requestAnimationFrame(update);
        let message = messageQueue.shift();
        while (message) {
            messageHandler(message);
            message = messageQueue.shift();
        }
        if (paused) {
            return;
        }
        delta = (t - last) / 1000;
        last = t;
        now += delta;
        stage.loop(delta);
        audio.process();
        gravity.copy(acc.applyQuaternion(rotation.inverse())).normalize().scale(10);
        
        device.sendmessage && device.sendmessage({ type: "updateGravity", data: `${gravity[0]},${gravity[1]},${gravity[2]}` })
    }
    requestAnimationFrame((t) => {
        last = startTime = t;
        audio.initAudio();
        stage.start();
        update(t);
    });
}

export {
    start,
}
