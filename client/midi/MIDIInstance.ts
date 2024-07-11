import MIDIFile from "./MIDIFile.js";
import MIDIPlayer from "./MIDIPlayer.js";


export default class MidiInstance {

    private readonly audioContext: AudioContext;
    private readonly player: MIDIPlayer = new MIDIPlayer();
    private readonly output: GainNode;
    private readonly stepDuration = 48 / 1000;
    private songStart = 0;
    private currentSongTime = 0;
    private nextStepTime = 0;
    private nextPositionTime = 0;
    private song?: Record<string, any> ;
    private stop = false;
    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext;
        this.output = audioContext.createGain();
        this.output.connect(this.audioContext.destination);
        this.output.gain.value = 0.5;
    }
    startPlay() {
        this.stop = false;
        this.reset();
        this.tick();
    }
    reset() {
        this.currentSongTime = 0;
        this.songStart = this.audioContext.currentTime;
        this.nextStepTime = this.audioContext.currentTime;
    }
    loop() {
        if (this.currentSongTime > this.song?.duration) {
            this.reset();
        }
    }
    tick() {
        if (this.stop || this.song === undefined) {
            return;
        }
        if (this.audioContext.currentTime > this.nextStepTime - this.stepDuration) {
            this.sendNotes(this.currentSongTime, this.currentSongTime + this.stepDuration);
            this.currentSongTime = this.currentSongTime + this.stepDuration;
            this.nextStepTime = this.nextStepTime + this.stepDuration;
        }
        if (this.nextPositionTime < this.audioContext.currentTime) {
            console.log("playing...", this.currentSongTime / this.song.duration);
            this.nextPositionTime = this.audioContext.currentTime + 3;
        }
    }
    getSong() {
        if (this.song === undefined) {
            throw new Error("loadedsong not exist")
        }
        return this.song;
    }
    sendNotes(start: number, end: number) {
        for (let t = 0; t < this.getSong().tracks.length; t++) {
            const track = this.getSong().tracks[t];
            for (let i = 0; i < track.notes.length; i++) {
                if (track.notes[i].when >= start && track.notes[i].when < end) {
                    const when = this.songStart + track.notes[i].when;
                    let duration = track.notes[i].duration;
                    const instr: string = track.info.variable;
                    const v = track.notes[i].velocity;
                    this.player.queueWaveTable(this.audioContext, this.output, instr, when, track.notes[i].pitch, duration, v, track.notes[i].slides);
                }
            }
        }
        for (let b = 0; b < this.getSong().beats.length; b++) {
            const beat = this.getSong().beats[b];
            for (let i = 0; i < beat.notes.length; i++) {
                if (beat.notes[i].when >= start && beat.notes[i].when < end) {
                    const when = this.songStart + beat.notes[i].when;
                    const duration = 1.5;
                    const instr = beat.info.variable;
                    const v = beat.volume / 2;
                    this.player.queueWaveTable(this.audioContext, this.output, instr, when, beat.n, duration, v);
                }
            }
        }
    }
    setSoundCache(soundCache: Record<string, any>) {
        this.player.loader.setSoundCache(soundCache);
    }
    async startLoad() {


        for (let i = 0; i < this.getSong().tracks.length; i++) {
            const nn = this.player.loader.findInstrument(this.getSong().tracks[i].program);
            const info = this.player.loader.instrumentInfo(nn);
            this.getSong().tracks[i].info = info;
            this.getSong().tracks[i].id = nn;
            await this.player.adjustPreset(this.audioContext, this.player.loader.getPresetByInstr(info.variable));
        }
        for (let i = 0; i < this.getSong().beats.length; i++) {
            const nn = this.player.loader.findDrum(this.getSong().beats[i].n);
            const info = this.player.loader.drumInfo(nn);
            this.getSong().beats[i].info = info;
            this.getSong().beats[i].id = nn;
            await this.player.adjustPreset(this.audioContext, this.player.loader.getPresetByInstr(info.variable));
        }
    }

    async loadBuffer(buffer: ArrayBuffer) {
        this.stop = true;
        const midiFile = new MIDIFile(buffer);
        this.song = midiFile.parseSong();
        await this.startLoad();
    }
    stopPlay() {
        this.stop = true;
    }
}
