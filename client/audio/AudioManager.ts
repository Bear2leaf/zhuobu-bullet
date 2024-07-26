import Device from "../device/Device.js";
import BgmAudio from "./BgmAudio.js";
import BleepAudio from "./BleepAudio.js";
import DemoAudio from "./DemoAudio.js";
import MidiAudio from "./MidiAudio.js";
export default class AudioManager {
    private readonly demoAudio = new DemoAudio;
    private readonly bgmAudio = new BgmAudio;
    private readonly bleepAudio = new BleepAudio;
    private readonly midiAudio = new MidiAudio;
    constructor(private readonly device: Device) {}
    async load(): Promise<void> {
        const device = this.device;
        // await this.getCacheManager().loadWavCache("bleep");
        this.bleepAudio.setBuffer((await (await fetch("/resources/audio/bleep.wav")).arrayBuffer()));
        this.bgmAudio.setBuffer((await (await fetch("/resources/audio/happy_adveture.mp3")).arrayBuffer()));
        await this.midiAudio.load(device);
    }
    initAudioContext() {
        const context = this.device.createWebAudioContext();
        [
            this.demoAudio,
            this.bgmAudio,
            this.bleepAudio,
            this.midiAudio
        ].forEach(clip => {
            clip.setContext(context)
        });
    }
    initAudio() {
        [
            this.demoAudio,
            this.bgmAudio,
            this.bleepAudio,
            this.midiAudio
        ].forEach(clip => {
            clip.init();
        });
    }
    play(tag?: string) {
        this.bleepAudio.playOnce();
    }
    process() {
        [
            this.demoAudio,
            this.bleepAudio,
            this.midiAudio
        ].forEach(clip => {
            clip.update();
        });
    }

}


