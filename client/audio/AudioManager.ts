import Device from "../device/Device.js";
import BgmAudio from "./BgmAudio.js";
import BleepAudio from "./BleepAudio.js";
import DemoAudio from "./DemoAudio.js";
// import MidiAudio from "./MidiAudio.js";
export default class AudioManager {
    private mute = false;
    private readonly demoAudio = new DemoAudio;
    private readonly bgmAudio = new BgmAudio;
    private readonly bleepAudio = new BleepAudio;
    // private readonly midiAudio = new MidiAudio;
    private readonly context: AudioContext = this.device.createWebAudioContext();
    private readonly gain = this.context.createGain();
    constructor(private readonly device: Device) { }
    async load(): Promise<void> {
        const device = this.device;
        // await this.getCacheManager().loadWavCache("bleep");
        this.bleepAudio.setBuffer((await (await fetch("/resources/audio/bleep.wav")).arrayBuffer()));
        this.bgmAudio.setBuffer((await (await fetch("/resources/audio/happy_adveture.mp3")).arrayBuffer()));
        // await this.midiAudio.load(device);
    }
    initAudioContext() {
        const context = this.context;
        [
            this.demoAudio,
            this.bgmAudio,
            this.bleepAudio,
            // this.midiAudio
        ].forEach(clip => {
            clip.setContext(context);
        });
    }
    initAudio() {
        [
            this.demoAudio,
            this.bgmAudio,
            this.bleepAudio,
            // this.midiAudio
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
            // this.midiAudio
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


