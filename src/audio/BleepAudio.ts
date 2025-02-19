import AudioClip from "./AudioClip.js";
export default class BleepAudio implements AudioClip {
    private context?: AudioContext;
    private buffer?: ArrayBuffer;
    private source?: AudioBufferSourceNode;
    private gain?: GainNode;
    setContext(context: AudioContext) {
        this.context = context;
    }
    getContext() {
        if (this.context === undefined) {
            throw new Error("audiocontext not exist")
        }
        return this.context;
    }
    setBuffer(buffer: ArrayBuffer) {
        this.buffer = buffer;
    }
    getBuffer() {
        if (this.buffer === undefined) {
            throw new Error("buffer not exist")
        }
        return this.buffer.slice(0);
    }
    connect(gain: GainNode): void {
        if (this.gain === undefined) {
            throw new Error("gain is undefined");
        }
        this.gain?.connect(gain);
    }
    init() {
        this.gain = this.context?.createGain();
        // this.playOnce();
    }

    update(): void {

    }

    playOnce() {
        const gain = this.gain;
        if (gain === undefined) {
            throw new Error("gain is undefined");
        }
        const source = this.getContext().createBufferSource();
        this.getContext().decodeAudioData(this.getBuffer(), buffer => {
            source.buffer = buffer;
            this.source = source;
            source.connect(gain);
            source.start();
        }, console.error);
    }
}