export default interface AudioClip {
    playOnce(audioCtx: AudioContext): void;
    setContext(context: AudioContext): void;
    getContext(): AudioContext;
    init(): void;
    update(): void;
}