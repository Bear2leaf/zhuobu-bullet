import Device from "../device/Device.js";
import BleepAudio from "./BleepAudio.js";
export default class AudioManager {
    private readonly bleepAudio = new BleepAudio;
    constructor(private readonly device: Device) {}
    async load(): Promise<void> {
        await this.bleepAudio.load(this.device);
    }
    initAudioContext() {
        const context = this.device.createWebAudioContext();
        [
            this.bleepAudio,
        ].forEach(clip => {
            clip.setContext(context)
        });
    }
    initAudio() {
        [
            this.bleepAudio,
        ].forEach(clip => {
            clip.init();
        });
    }
    play(tag?: string) {
        this.bleepAudio.playOnce();
    }
    process(delta: number, elapsed: number) {
        [
            this.bleepAudio,
        ].forEach(clip => {
            clip.update(delta, elapsed);
        });
    }

}


