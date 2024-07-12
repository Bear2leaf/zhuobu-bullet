import { MainMessage, WorkerMessage } from "../../worker/ammo.worker.js"

export enum BodyId {
  Level,
  WallTop,
  WallBottom,
  WallLeft,
  WallRight,
  WallBack,
  WallFront,
  Ball,
}
export default interface Device {
  sendmessage?: (message: MainMessage) => void;
  onaccelerometerchange?: (x: number, y: number, z: number) => void;
  onmessage?: (message: WorkerMessage) => void;
  createWorker(url: string): void;
  terminateWorker(): void;
  getCanvasGL(): HTMLCanvasElement;
  getWindowInfo(): readonly [number, number, number];
  now(): number;
  loadSubpackage(): Promise<null>;
  createWebAudioContext(): AudioContext;
}