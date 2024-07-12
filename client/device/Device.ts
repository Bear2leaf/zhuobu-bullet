
export type MainMessage = {
  type: "init"
  data: number
} | {
  type: "updateGravity",
  data: string
}
export type WorkerMessage = {
  type: "worker"
  data: number[]
} | {
  type: "update",
  objects: number[][], allFPS: number, currFPS: number
} | {
  type: "ready",
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