import Device from "./Device";
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
    onmessage?: (data: any) => void;
    sendmessage?: (data: any) => void;
    terminateWorker(): void {
        this.worker?.terminate();
    }
}
