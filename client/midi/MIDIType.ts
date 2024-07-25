export type WaveEnvelope = {
	audioBufferSourceNode: AudioBufferSourceNode
	, gainNode: GainNode
	, when: number
	, duration: number
	, pitch: number
	, preset: WavePreset
};
export type WaveZone = {
	keyRangeLow: number
	, keyRangeHigh: number
	, originalPitch: number
	, coarseTune: number
	, fineTune: number
	, loopStart: number
	, loopEnd: number
	, buffer?: AudioBuffer
	, sampleRate: number
	, delay?: number
	, ahdsr?: boolean | WaveAHDSR[]
	, sample?: string
	, file?: string
	, sustain?: number
};
export type WavePreset = {
	zones: WaveZone[];
};
export type WaveSlide = {
	when: number
	, delta: number
};
export type WaveAHDSR = {
	duration: number
	, volume: number
};
export type CachedPreset = {
	variableName: string
	, filePath: string
};
export type NumPair = number[];
export type PresetInfo = {
	variable: string
	, url: string
	, title: string
	, pitch: number
};
export type ChordQueue = {
	when: number
	, destination: AudioNode
	, preset: WavePreset
	, pitch: number
	, duration: number
	, volume: number
	, slides?: WaveSlide[]
};
///..................................................................
export type EventType = {
    track: number;
    type: number;
    subtype: number;
    length: number;
    msb: number;
    lsb: number;
    data: number[];
    prefix: number;
    tempo: number;
    tempoBPM: number;
    hour: number;
    minutes: number;
    seconds: number;
    frames: number;
    subframes: number;
    key: number;
    scale: number;
    param1: number;
    param2: number;
    param3: number;
    param4: number;
    badsubtype: number;
    channel: number;
    playTime: number;
    index: string;
    delta: number;
};
