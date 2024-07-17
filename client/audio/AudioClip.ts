import Device from "../device/Device.js";

export default interface AudioClip {
    playOnce(audioCtx: AudioContext): void;
    setContext(context: AudioContext): void;
    getContext(): AudioContext;
    load(device: Device): Promise<void>;
    init(): void;
    update(delta: number, elapsed: number): void;
}