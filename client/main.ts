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

function initStageTouchEvents(stage: Stage) {

    let xDown: number | null = null;
    let yDown: number | null = null;


    function handleTouchStart(x: number, y: number) {
        xDown = x;
        yDown = y;
    };

    function handleTouchMove(x: number, y: number) {
        if (!xDown || !yDown) {
            return;
        }

        const xUp = x;
        const yUp = y;

        const xDiff = xUp - xDown;
        const yDiff = yDown - yUp
        if (Math.abs(xDiff) > Math.abs(yDiff)) {/*most significant*/
            if (xDiff > 0) {
                /* right swipe */
                stage.rollCamera("right")
            } else {
                /* left swipe */
                stage.rollCamera("left")
            }
        } else {
            if (yDiff > 0) {
                /* up swipe */
                stage.rollCamera("up")
            } else {
                /* down swipe */
                stage.rollCamera("down")
            }
        }
        /* reset values */
        xDown = null;
        yDown = null;
    };
    document.addEventListener("touchstart", (ev) => handleTouchStart(ev.touches[0].clientX, ev.touches[0].clientY));
    document.addEventListener("touchmove", (ev) => handleTouchMove(ev.touches[0].clientX, ev.touches[0].clientY));
    document.addEventListener("keydown", (ev) => {
        switch (ev.key) {
            case "ArrowUp":
                stage.rollCamera("up");
                break;
            case "ArrowDown":
                stage.rollCamera("down");
                break;
            case "ArrowLeft":
                stage.rollCamera("left");
                break;
            case "ArrowRight":
                stage.rollCamera("right");
                break;

            default:
                break;
        }
    })
}

async function start(device: Device) {
    const audio = new AudioManager(device);
    audio.initAudioContext();
    const stage = new Stage(device);
    stage.onaddmesh = (transform, vertices, indices, propertities) => {
        device.sendmessage && device.sendmessage({
            type: "addMesh",
            data: { vertices: [...vertices], indices: [...indices], propertities, transform }
        })
    }
    const gravity = new Vec3;
    const rotation = new Quat;
    const acc = new Vec3(0, -10, 0);
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
            audio.play();
            stage.requestLevel();
            stage.showReleaseBtn()
        } else if (message.type === "ready") {
            stage.onorientationchange = (quat) => {
                rotation[0] = quat.x;
                rotation[1] = quat.y;
                rotation[2] = quat.z;
                rotation[3] = quat.w;
            }
            device.sendmessage && device.sendmessage({
                type: "resetWorld",
            })
            paused = false;
        } else if (message.type === "removeBody") {
            stage.removeBody(message.data);
        }
    };
    let delta = 0;
    let now = 0;
    let last = 0;
    await stage.load();
    stage.setInitLevel(parseInt(device.getParam("level")) || 0);
    await audio.load();
    device.createWorker("dist/worker/main.js");
    stage.onclick = (tag?: string) => {
        if (tag === "release") {
            stage.hideReleaseBtn()
            device.sendmessage && device.sendmessage({
                type: "release"
            })
        }
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
        audio.process(delta, now);
        gravity.copy(acc).applyQuaternion(rotation.inverse()).normalize().scale(10);

        device.sendmessage && device.sendmessage({ type: "updateGravity", data: `${gravity[0]},${gravity[1]},${gravity[2]}` })
    }
    requestAnimationFrame((t) => {
        last = t;
        audio.initAudio();
        stage.start();
        initStageTouchEvents(stage);
        update(t);
    });
}

export {
    start,
}
