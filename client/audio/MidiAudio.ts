import Device from "../device/Device.js";
import MidiInstance from "../midi/MIDIInstance.js";
import AudioClip from "./AudioClip.js";
export default class MidiAudio implements AudioClip {
    private context?: AudioContext;
    private instance?: MidiInstance;
    private readonly midiName = "Project_6";
    private readonly soundfontNames =
        [
            "0000_GeneralUserGS",
            "0460_GeneralUserGS",
            "0730_GeneralUserGS"
        ];
    setContext(context: AudioContext) {
        this.context = context;
    }
    getContext() {
        if (this.context === undefined) {
            throw new Error("audiocontext not exist")
        }
        return this.context;
    }
    setInstance(instance: MidiInstance) {
        this.instance = instance;
    }
    getInstance() {
        if (this.instance === undefined) {
            this.instance = new MidiInstance(this.getContext());
        }
        return this.instance;
    }
    async load(device: Device) {
        const midiData = await (await fetch(`resources/midi/${this.midiName}.bin`)).arrayBuffer();
        const soundfonts = await Promise.all<any>(this.soundfontNames.map(async (name) => (await fetch(`resources/soundfont/${name}.json`)).json()));
        const soundCache: Record<string, any> = soundfonts.reduce((prev, current, index) => {
            prev[`_tone_${this.soundfontNames[index]}_sf2_file`] = current;
            return prev;
        }, {});
        this.getInstance().setSoundCache(soundCache);
        await this.getInstance().loadBuffer(midiData);

    }
    init() {
        this.playOnce();
    }

    update(): void {
        this.getInstance().loop();
        this.getInstance().tick();
    }

    playOnce() {
        this.getInstance().startPlay();
    }
}