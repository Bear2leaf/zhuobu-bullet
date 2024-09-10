import { MainMessage, WorkerMessage } from "../../worker/ammo.worker.js"

export default interface Device {
  sendmessage: (message: MainMessage) => void;
  onmessage: (message: WorkerMessage) => void;
  createWorker(url: string): void;
  terminateWorker(): void;
  getCanvasGL(): HTMLCanvasElement;
  getWindowInfo(): WechatMinigame.WindowInfo;
  now(): number;
  loadSubpackage(): Promise<null>;
  createWebAudioContext(): AudioContext;
}