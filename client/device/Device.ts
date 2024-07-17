import { MainMessage, WorkerMessage } from "../../worker/ammo.worker.js"

export default interface Device {
  sendmessage?: (message: MainMessage) => void;
  onmessage?: (message: WorkerMessage) => void;
  createWorker(url: string): void;
  getParam(name: string): string;
  terminateWorker(): void;
  getCanvasGL(): HTMLCanvasElement;
  getWindowInfo(): readonly [number, number, number];
  now(): number;
  loadSubpackage(): Promise<null>;
  createWebAudioContext(): AudioContext;
}