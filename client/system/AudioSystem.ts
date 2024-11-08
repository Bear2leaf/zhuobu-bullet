import Device from "../device/Device.js";
import { System } from "./System.js";
import BgmAudio from "../audio/BgmAudio.js";
import BleepAudio from "../audio/BleepAudio.js";
import DemoAudio from "../audio/DemoAudio.js";
export default class AudioSystem implements System {
    private mute = false;
    private readonly demoAudio = new DemoAudio;
    private readonly bgmAudio = new BgmAudio;
    private readonly bleepAudio = new BleepAudio;
    private _context?: AudioContext;
    private _master?: GainNode;
    private get context() {
        if (!this._context) {
            throw new Error("audio context not initialized");
        }
        return this._context;
    }
    private get master() {
        if (!this._master) {
            throw new Error("audio master not initialized");
        }
        return this._master;
    }

    async load(): Promise<void> {
        this.bleepAudio.setBuffer((await (await fetch("/resources/audio/bleep.wav")).arrayBuffer()));
        this.bgmAudio.setBuffer((await (await fetch("/resources/audio/happy_adveture.mp3")).arrayBuffer()));
    }
    init() {
        this._master = this.context.createGain();
        this.master.gain.value = 1.0;
        [
            this.demoAudio,
            this.bgmAudio,
            this.bleepAudio,
        ].forEach(clip => {
            clip.init();
            clip.connect(this.master);
        });
        this.master.connect(this.context.destination);
    }
    start(): void {
    }
    update() {
        [
            this.demoAudio,
            this.bleepAudio,
        ].forEach(clip => {
            clip.update();
        });
    }
    initAudioContext(context: AudioContext) {
        [
            this.demoAudio,
            this.bgmAudio,
            this.bleepAudio,
        ].forEach(clip => {
            clip.setContext(context);
        });
        this._context = context;
    }
    isOn(): boolean {
        return !!this.master.gain.value;
    }
    play(tag?: string) {
        this.bleepAudio.playOnce();
    }

    toggle() {
        this.mute = !this.mute;
        if (this.mute) {
            this.master.gain.value = 0.0;
        } else {
            this.master.gain.value = 1.0;
        }
    }
}


