import 'minigame-api-typings';
import Device from "./Device";
import { WorkerMessage } from "../../worker/ammo.worker";
import { MainMessage } from "../../worker/ammo.worker";


export default class MinigameDevice implements Device {
    private worker?: WechatMinigame.Worker;
    private readonly windowInfo: readonly [number, number, number];
    private readonly canvasGL: WechatMinigame.Canvas
    private readonly divideTimeBy: number;
    private startupTime: number = wx.getPerformance().now();
    constructor() {
        this.canvasGL = wx.createCanvas();
        const info = wx.getWindowInfo();
        (this.canvasGL.width) = info.windowWidth;
        (this.canvasGL.height) = info.windowHeight;
        this.windowInfo = [this.canvasGL.width, this.canvasGL.height, info.pixelRatio];
        const isDevTool = wx.getSystemInfoSync().platform === "devtools";
        this.divideTimeBy = isDevTool ? 1 : 1000;

        GameGlobal.performance = {
            now: () => this.now()
        };
    }
    getCanvasGL(): HTMLCanvasElement {
        return this.canvasGL as unknown as HTMLCanvasElement;
    }
    getWindowInfo(): readonly [number, number, number] {
        return this.windowInfo;
    }
    now(): number {
        return (wx.getPerformance().now() - this.startupTime) / this.divideTimeBy;
    }
    async loadSubpackage() {
        return await new Promise<null>(resolve => {
            const task = wx.loadSubpackage({
                name: "resources",
                success(res: { errMsg: string }) {
                    console.debug("load resources success", res)
                    resolve(null);
                },
                fail(res: { errMsg: string }) {
                    console.error("load resources fail", res)
                },
                complete() {
                    console.debug("load resources complete");
                }
            })

            task.onProgressUpdate((res) => {
                console.debug(`onProgressUpdate: ${res.progress}, ${res.totalBytesExpectedToWrite}, ${res.totalBytesWritten}`)
            })
        });
    }
    getParam(name: string): string {
        return "";
    }
    createWebAudioContext(): AudioContext {
        return wx.createWebAudioContext() as unknown as AudioContext;
    }
    createWorker(url: string) {
        this.worker = wx.createWorker(url);
        if (!this.onmessage) {
            throw new Error("onmessage not set");
        }
        this.worker.onMessage((message) => this.onmessage && this.onmessage(message as unknown as WorkerMessage))
        this.sendmessage = this.worker!.postMessage.bind(this.worker)
    }
    onmessage?: (message: WorkerMessage) => void;
    sendmessage?: (message: MainMessage) => void;
    terminateWorker(): void {
        this.worker?.terminate();
    }
}

