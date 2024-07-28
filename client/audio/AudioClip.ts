export default interface AudioClip {
    playOnce(audioCtx: AudioContext): void;
    setContext(context: AudioContext): void;
    getContext(): AudioContext;
    connect(gain: GainNode): void;
    init(): void;
    update(): void;
}