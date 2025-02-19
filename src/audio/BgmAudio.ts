import AudioClip from "./AudioClip.js";
export default class BgmAudio implements AudioClip {
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
    connect(gain: GainNode): void {
        if (this.gain === undefined) {
            throw new Error("gain is undefined");
        }
        this.gain?.connect(gain);
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
    init() {
        this.gain = this.context?.createGain();
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
            source.loop = true;
            this.source = source;
            source.connect(gain);
            source.start();
        }, console.error);
    }
}