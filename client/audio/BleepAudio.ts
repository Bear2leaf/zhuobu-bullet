import Device from "../device/Device.js";
import AudioClip from "./AudioClip.js";
export default class BleepAudio implements AudioClip {
    private context?: AudioContext;
    private buffer?: ArrayBuffer;
    private audiobuffer?: AudioBuffer;
    setContext(context: AudioContext) {
        this.context = context;
    }
    getContext() {
        if (this.context === undefined) {
            throw new Error("audiocontext not exist")
        }
        return this.context;
    }
    async load(device: Device): Promise<void> {
        this.buffer = await (await fetch("/resources/audio/bleep.wav")).arrayBuffer();
        this.getContext().decodeAudioData(this.buffer!, buffer => this.audiobuffer = buffer, console.error);
    }
    init() {

    }

    update(delta: number, elapsed: number): void {
    }

    playOnce() {
        if (this.audiobuffer) {
            const source = this.getContext().createBufferSource();
            source.buffer = this.audiobuffer;
            source.connect(this.getContext().destination);
            source.start();
            setTimeout(() => {
                source.disconnect(this.getContext().destination);
            }, this.audiobuffer.duration * 1000);
        }

    }
}