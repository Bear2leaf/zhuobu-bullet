import Device from "./device/Device.js";
import Stage from "./Stage.js";
import AudioManager from "./audio/AudioManager.js";
import { mat4, quat, vec3 } from "gl-matrix";

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
    stage.onaddmesh = (vertices, indices) => {
        device.sendmessage && device.sendmessage({
            type: "addMesh",
            data: { vertices: [...vertices], indices: [...indices] }
        })
    }
    const gravity = vec3.create();
    const rotation = quat.create();
    const acc = vec3.create();
    device.onmessage = (message) => {
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
        vec3.transformQuat(gravity, acc, quat.invert(rotation, rotation));
        vec3.scale(gravity, vec3.normalize(gravity, gravity), 10);
        device.sendmessage && device.sendmessage({ type: "updateGravity", data: `${gravity[0]},${gravity[1]},${gravity[2]}` })
        requestAnimationFrame(update);
    }
}

export {
    start,
}
