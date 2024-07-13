import Device from "./Device";
import { WorkerMessage } from "../../worker/ammo.worker";
import { MainMessage } from "../../worker/ammo.worker";
export default class BrowserDevice implements Device {
    private worker?: Worker;
    private isMouseDown: boolean;
    private readonly windowInfo: [number, number, number];
    private readonly canvasGL: HTMLCanvasElement
    constructor() {
        this.canvasGL = document.createElement("canvas");
        document.body.appendChild(this.canvasGL);
        this.canvasGL.width = window.innerWidth
        this.canvasGL.height = window.innerHeight
        this.windowInfo = [this.canvasGL.width, this.canvasGL.height, window.devicePixelRatio];
        this.isMouseDown = false;
        setInterval(() => {
            this.onaccelerometerchange && this.onaccelerometerchange(0, -10, 0);
        }, 1000)
    }
    getCanvasGL(): HTMLCanvasElement {
        return this.canvasGL;
    }
    getWindowInfo(): readonly [number, number, number] {
        return this.windowInfo
    }
    now(): number {
        return performance.now();
    }
    async loadSubpackage() {
        return null;
    }
    createWebAudioContext(): AudioContext {
        return new AudioContext();
    }
    createWorker(url: string): void {
        if (this.worker) {
            this.worker.terminate();
        }
        if (!this.onmessage) {
            throw new Error("onmessage not set");
        }
        this.worker = new Worker(url);
        this.worker.onmessage = (e: MessageEvent) => this.onmessage && this.onmessage(e.data);
        this.sendmessage = this.worker!.postMessage.bind(this.worker)
    }
    onaccelerometerchange?: ((x: number, y: number, z: number) => void) | undefined;
    onmessage?: (message: WorkerMessage) => void;
    sendmessage?: (message: MainMessage) => void;
    terminateWorker(): void {
        this.worker?.terminate();
    }
}
