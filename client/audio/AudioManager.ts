import Device from "../device/Device.js";
import BgmAudio from "./BgmAudio.js";
import BleepAudio from "./BleepAudio.js";
import DemoAudio from "./DemoAudio.js";
export default class AudioManager {
    private mute = false;
    private readonly demoAudio = new DemoAudio;
    private readonly bgmAudio = new BgmAudio;
    private readonly bleepAudio = new BleepAudio;
    private readonly context: AudioContext = this.device.createWebAudioContext();
    private readonly gain = this.context.createGain();
    constructor(private readonly device: Device) { }
    async load(): Promise<void> {
        const device = this.device;
        this.bleepAudio.setBuffer((await (await fetch("/resources/audio/bleep.wav")).arrayBuffer()));
        this.bgmAudio.setBuffer((await (await fetch("/resources/audio/happy_adveture.mp3")).arrayBuffer()));
    }
    isOn(): boolean {
        return !!this.gain.gain.value;
    }
    initAudioContext() {
        const context = this.context;
        [
            this.demoAudio,
            this.bgmAudio,
            this.bleepAudio,
        ].forEach(clip => {
            clip.setContext(context);
        });
    }
    initAudio() {
        [
            this.demoAudio,
            this.bgmAudio,
            this.bleepAudio,
        ].forEach(clip => {
            clip.init();
            clip.connect(this.gain);
        });
        this.gain.connect(this.context.destination);
    }
    play(tag?: string) {
        this.bleepAudio.playOnce();
    }
    process() {
        [
            this.demoAudio,
            this.bleepAudio,
        ].forEach(clip => {
            clip.update();
        });
    }

    toggle() {
        this.mute = !this.mute;
        if (this.mute) {
            this.gain.gain.value = 0.0;
        } else {
            this.gain.gain.value = 1.0;
        }
    }
}


