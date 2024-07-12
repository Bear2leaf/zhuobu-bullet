
export type MainMessage = any;
export type WorkerMessage = any;
export default interface Device {
  sendmessage?: (data: MainMessage) => void;
  onaccelerometerchange?: (x: number, y: number, z: number) => void;
  onmessage?: (data: WorkerMessage) => void;
  createWorker(url: string): void;
  terminateWorker(): void;
  getCanvasGL(): HTMLCanvasElement;
  getWindowInfo(): readonly [number, number, number];
  now(): number;
  loadSubpackage(): Promise<null>;
  createWebAudioContext(): AudioContext;
}