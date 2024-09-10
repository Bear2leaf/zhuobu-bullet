import Device from "./Device";
import { WorkerMessage } from "../../worker/ammo.worker";
import { MainMessage } from "../../worker/ammo.worker";
export default class BrowserDevice implements Device {
    private worker?: Worker;
    private readonly windowInfo: WechatMinigame.WindowInfo;
    private readonly canvasGL: HTMLCanvasElement
    constructor() {
        this.canvasGL = document.createElement("canvas");
        document.body.appendChild(this.canvasGL);
        this.canvasGL.width = window.innerWidth
        this.canvasGL.height = window.innerHeight
        this.windowInfo = {
            windowWidth: this.canvasGL.width,
            windowHeight: this.canvasGL.height,
            pixelRatio: window.devicePixelRatio,
            statusBarHeight: 10,
            screenWidth: this.canvasGL.width,
            screenHeight: this.canvasGL.height,
            safeArea: {
                bottom: this.canvasGL.height - 20,
                height: this.canvasGL.height,
                left: 0,
                right: this.canvasGL.width,
                top: 20,
                width: this.canvasGL.width
            },
            screenTop: 0
        };;
    }
    getParam(name: string): string {
        const query = window.location.search.substring(1);
        const vars = query.split("&");
        for (let i = 0; i < vars.length; i++) {
            const pair = vars[i].split("=");
            if (pair[0] === name) {
                return pair[1];
            }
        }
        return "";
    }
    getCanvasGL(): HTMLCanvasElement {
        return this.canvasGL;
    }
    getWindowInfo(){
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
    onmessage: (message: WorkerMessage) => void = () => { throw new Error("Worker not inited") };
    sendmessage: (message: MainMessage) => void = () => { throw new Error("Worker not inited") };
    terminateWorker(): void {
        this.worker?.terminate();
    }
}
