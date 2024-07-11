import SoundFontLoader from "./SoundFontLoader.js";
import { WaveEnvelope, WaveSlide, WavePreset, WaveZone, WaveAHDSR } from "./MIDIType.js";


export default class MIDIPlayer {
	private readonly envelopes: WaveEnvelope[] = [];
	readonly loader = new SoundFontLoader();
	private readonly afterTime = 0.05;
	private readonly nearZero = 0.000001;
	queueChord(audioContext: AudioContext, target: AudioNode, instr: string, when: number, pitches: number[], duration: number, volume: number, slides?: WaveSlide[][]): WaveEnvelope[] {
		const envelopes: WaveEnvelope[] = [];
		for (let i = 0; i < pitches.length; i++) {
			let singleSlide: undefined | WaveSlide[] = undefined;
			if (slides) {
				singleSlide = slides[i];
			}
			const envlp: WaveEnvelope | null = this.queueWaveTable(audioContext, target, instr, when, pitches[i], duration, volume - Math.random() * 0.01, singleSlide);
			if (envlp) envelopes.push(envlp);
		}
		return envelopes;
	};
	queueStrumUp(audioContext: AudioContext, target: AudioNode, instr: string, when: number, pitches: number[], duration: number, volume: number, slides?: WaveSlide[][]): WaveEnvelope[] {
		pitches.sort(function (a, b) {
			return b - a;
		});
		return this.queueStrum(audioContext, target, instr, when, pitches, duration, volume, slides);
	};
	queueStrumDown(audioContext: AudioContext, target: AudioNode, instr: string, when: number, pitches: number[], duration: number, volume: number, slides?: WaveSlide[][]): WaveEnvelope[] {
		pitches.sort(function (a, b) {
			return a - b;
		});
		return this.queueStrum(audioContext, target, instr, when, pitches, duration, volume, slides);
	};
	queueStrum(audioContext: AudioContext, target: AudioNode, instr: string, when: number, pitches: number[], duration: number, volume: number, slides?: WaveSlide[][]): WaveEnvelope[] {
		if (when < audioContext.currentTime) {
			when = audioContext.currentTime;
		}
		const envelopes: WaveEnvelope[] = [];
		for (let i = 0; i < pitches.length; i++) {
			let singleSlide: undefined | WaveSlide[] = undefined;
			if (slides) {
				singleSlide = slides[i];
			}
			const envlp: WaveEnvelope = this.queueWaveTable(audioContext, target, instr, when + i * 0.01, pitches[i], duration, volume - Math.random() * 0.01, singleSlide);
			if (envlp) envelopes.push(envlp);
			volume = 0.9 * volume;
		}
		return envelopes;
	};
	queueSnap(audioContext: AudioContext, target: AudioNode, instr: string, when: number, pitches: number[], duration: number, volume: number, slides?: WaveSlide[][]): WaveEnvelope[] {
		volume = 1.5 * (volume || 1.0);
		duration = 0.05;
		return this.queueChord(audioContext, target, instr, when, pitches, duration, volume, slides);
	};
	queueWaveTable(audioContext: AudioContext, target: AudioNode, instr: string | WavePreset, when: number, pitch: number, duration: number, volume: number, slides?: WaveSlide[]): WaveEnvelope {
		const preset = typeof instr === 'string' ? this.loader.getPresetByInstr(instr) : instr;
		const zone: WaveZone = this.findZone(preset, pitch);
		if (zone) {
			if (!(zone.buffer)) {
				throw new Error("empty buffer");
			}
			const baseDetune = zone.originalPitch - 100.0 * zone.coarseTune - zone.fineTune;
			const playbackRate = 1.0 * Math.pow(2, (100.0 * pitch - baseDetune) / 1200.0);
			let startWhen = when;
			if (startWhen < audioContext.currentTime) {
				startWhen = audioContext.currentTime;
			}
			let waveDuration = duration + this.afterTime;
			let loop = true;
			if (zone.loopStart < 1 || zone.loopStart >= zone.loopEnd) {
				loop = false;
			}
			if (!loop) {
				if (waveDuration > zone.buffer.duration / playbackRate) {
					waveDuration = zone.buffer.duration / playbackRate;
				}
			}
			const envelope: WaveEnvelope = this.createEnvelope(audioContext, target);
			this.setupEnvelope(audioContext, envelope, zone, volume, startWhen, waveDuration, duration, playbackRate);
			if (slides) {
				if (slides.length > 0) {
					envelope.audioBufferSourceNode.playbackRate.setValueAtTime(playbackRate, when);
					for (let i = 0; i < slides.length; i++) {
						const nextPitch = pitch + slides[i].delta;
						const newPlaybackRate = 1.0 * Math.pow(2, (100.0 * nextPitch - baseDetune) / 1200.0);
						const newWhen = when + slides[i].when;
						envelope.audioBufferSourceNode.playbackRate.linearRampToValueAtTime(newPlaybackRate, newWhen);
					}
				}
			}
			envelope.audioBufferSourceNode.buffer = zone.buffer;
			if (loop) {
				envelope.audioBufferSourceNode.loop = true;
				envelope.audioBufferSourceNode.loopStart = zone.loopStart / zone.sampleRate + ((zone.delay) ? zone.delay : 0);
				envelope.audioBufferSourceNode.loopEnd = zone.loopEnd / zone.sampleRate + ((zone.delay) ? zone.delay : 0);
			} else {
				envelope.audioBufferSourceNode.loop = false;
			}
			envelope.audioBufferSourceNode.connect(envelope.gainNode);
			envelope.audioBufferSourceNode.start(startWhen, zone.delay);
			envelope.when = startWhen;
			envelope.duration = waveDuration;
			envelope.pitch = pitch;
			envelope.preset = preset;
			return envelope;
		} else {
			throw new Error("cannot find zone for pitch " + pitch);
		}
	};
	noZeroVolume(n: number): number {
		if (n > this.nearZero) {
			return n;
		} else {
			return this.nearZero;
		}
	};
	setupEnvelope(audioContext: AudioContext, envelope: WaveEnvelope, zone: WaveZone, volume: number, when: number, sampleDuration: number, noteDuration: number, playbackRate: number) {

		envelope.audioBufferSourceNode.playbackRate.setValueAtTime(playbackRate, 0);
		envelope.gainNode.gain.setValueAtTime(this.noZeroVolume(0), audioContext.currentTime);
		let lastTime = 0;
		let lastVolume = 0;
		let duration = noteDuration;
		let zoneahdsr = zone.ahdsr;
		if (sampleDuration < duration + this.afterTime) {
			duration = sampleDuration - this.afterTime;
		}
		if (zoneahdsr) {
			if (!((zoneahdsr as WaveAHDSR[]).length > 0)) {
				zoneahdsr = [{
					duration: 0,
					volume: 1
				}, {
					duration: 0.5,
					volume: 1
				}, {
					duration: 1.5,
					volume: 0.5
				}, {
					duration: 3,
					volume: 0
				}
				];
			}
		} else {
			zoneahdsr = [{
				duration: 0,
				volume: 1
			}, {
				duration: duration,
				volume: 1
			}
			];
		}
		const ahdsr: WaveAHDSR[] = zoneahdsr as WaveAHDSR[];
		envelope.gainNode.gain.cancelScheduledValues(when);
		envelope.gainNode.gain.setValueAtTime(this.noZeroVolume(ahdsr[0].volume * volume), when);
		for (let i = 0; i < ahdsr.length; i++) {
			if (ahdsr[i].duration > 0) {
				if (ahdsr[i].duration + lastTime > duration) {
					const r = 1 - (ahdsr[i].duration + lastTime - duration) / ahdsr[i].duration;
					const n = lastVolume - r * (lastVolume - ahdsr[i].volume);
					envelope.gainNode.gain.linearRampToValueAtTime(this.noZeroVolume(volume * n), when + duration);
					break;
				}
				lastTime = lastTime + ahdsr[i].duration;
				lastVolume = ahdsr[i].volume;
				envelope.gainNode.gain.linearRampToValueAtTime(this.noZeroVolume(volume * lastVolume), when + lastTime);
			}
		}
		envelope.gainNode.gain.linearRampToValueAtTime(this.noZeroVolume(0), when + duration + this.afterTime);
	};
	numValue(aValue: any, defValue: number): number {
		if (typeof aValue === "number") {
			return aValue;
		} else {
			return defValue;
		}
	};
	createEnvelope(audioContext: AudioContext, target: AudioNode): WaveEnvelope {
		const gainNode = audioContext.createGain();
		const audioBufferSourceNode = audioContext.createBufferSource();
		const envelope: WaveEnvelope = {
			gainNode,
			audioBufferSourceNode,
			when: 0,
			duration: 0,
			pitch: 0,
			preset: {
				zones: []
			}
		};
		gainNode.connect(target);
		this.envelopes.push(envelope);
		return envelope;
	};
	async adjustPreset(audioContext: AudioContext, preset: WavePreset) {
		for (let i = 0; i < preset.zones.length; i++) {
			await this.adjustZone(audioContext, preset.zones[i]);
		}
	};
	async adjustZone(audioContext: AudioContext, zone: WaveZone) {
		if (zone.buffer) {
			//
		} else {
			zone.delay = 0;
			if (zone.sample) {
				const decoded = atob(zone.sample);
				zone.buffer = audioContext.createBuffer(1, decoded.length / 2, zone.sampleRate);
				const float32Array = zone.buffer.getChannelData(0);
				for (let i = 0; i < decoded.length / 2; i++) {
					let b1 = decoded.charCodeAt(i * 2);
					let b2 = decoded.charCodeAt(i * 2 + 1);
					if (b1 < 0) {
						b1 = 256 + b1;
					}
					if (b2 < 0) {
						b2 = 256 + b2;
					}
					let n = b2 * 256 + b1;
					if (n >= 65536 / 2) {
						n = n - 65536;
					}
					float32Array[i] = n / 65536.0;
				}
			} else {
				if (zone.file) {
					const datalen = zone.file.length;
					const arraybuffer = new ArrayBuffer(datalen);
					const view = new Uint8Array(arraybuffer);
					const decoded = atob(zone.file);
					for (let i = 0; i < decoded.length; i++) {
						const b = decoded.charCodeAt(i);
						view[i] = b;
					}
					await new Promise((resolve) => {
						audioContext.decodeAudioData(arraybuffer, (audioBuffer) => {
							zone.buffer = audioBuffer;
							resolve(null);
						}, error => { throw new Error(error.message) });
					});
				}
			}
			zone.loopStart = this.numValue(zone.loopStart, 0);
			zone.loopEnd = this.numValue(zone.loopEnd, 0);
			zone.coarseTune = this.numValue(zone.coarseTune, 0);
			zone.fineTune = this.numValue(zone.fineTune, 0);
			zone.originalPitch = this.numValue(zone.originalPitch, 6000);
			zone.sampleRate = this.numValue(zone.sampleRate, 44100);
			zone.sustain = this.numValue(zone.originalPitch, 0);
		}
	};
	findZone(preset: WavePreset, pitch: number) {
		let zone: WaveZone | null = null;
		for (let i = preset.zones.length - 1; i >= 0; i--) {
			zone = preset.zones[i];
			if (zone.keyRangeLow <= pitch && zone.keyRangeHigh + 1 >= pitch) {
				break;
			}
		}
		if (!zone) {
			throw new Error("cannot find zone for pitch " + pitch);
		}
		return zone;
	};
	cancelQueue(audioContext: AudioContext) {
		for (let i = 0; i < this.envelopes.length; i++) {
			const e = this.envelopes[i];
			((e as unknown) as GainNode).gain.cancelScheduledValues(0);
			((e as unknown) as GainNode).gain.setValueAtTime(this.nearZero, audioContext.currentTime);
			e.when = -1;
			try {
				if (e.audioBufferSourceNode) e.audioBufferSourceNode.disconnect();
			} catch (ex) {
				console.log(ex);
			}
		}
	};
}

function atobLookup(chr: string) {
	const index = keystr.indexOf(chr);
	// Throw exception if character is not in the lookup string; should not be hit in tests
	if (index === -1) {
		throw new Error("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
	}
	return index;
}
/**
 * A lookup table for atob(), which converts an ASCII character to the
 * corresponding six-bit number.
 */
const keystr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
/**
 * Implementation of atob() according to the HTML and Infra specs, except that
 * instead of throwing INVALID_CHARACTER_ERR we return null.
 */
function atob(data: string) {
	if (arguments.length === 0) {
		throw new TypeError("1 argument required, but only 0 present.");
	}

	// Web IDL requires DOMStrings to just be converted using ECMAScript
	// ToString, which in our case amounts to using a template literal.
	data = `${data}`;
	// "Remove all ASCII whitespace from data."
	data = data.replace(/[ \t\n\f\r]/g, "");
	// "If data's code point length divides by 4 leaving no remainder, then: if data ends
	// with one or two U+003D (=) code points, then remove them from data."
	if (data.length % 4 === 0) {
		data = data.replace(/==?$/, "");
	}
	// "If data's code point length divides by 4 leaving a remainder of 1, then return
	// failure."
	//
	// "If data contains a code point that is not one of
	//
	// U+002B (+)
	// U+002F (/)
	// ASCII alphanumeric
	//
	// then return failure."
	if (data.length % 4 === 1 || /[^+/0-9A-Za-z]/.test(data)) {
		throw new Error("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
	}
	// "Let output be an empty byte sequence."
	let output = "";
	// "Let buffer be an empty buffer that can have bits appended to it."
	//
	// We append bits via left-shift and or.  accumulatedBits is used to track
	// when we've gotten to 24 bits.
	let buffer = 0;
	let accumulatedBits = 0;
	// "Let position be a position variable for data, initially pointing at the
	// start of data."
	//
	// "While position does not point past the end of data:"
	for (let i = 0; i < data.length; i++) {
		// "Find the code point pointed to by position in the second column of
		// Table 1: The Base 64 Alphabet of RFC 4648. Let n be the number given in
		// the first cell of the same row.
		//
		// "Append to buffer the six bits corresponding to n, most significant bit
		// first."
		//
		// atobLookup() implements the table from RFC 4648.
		buffer <<= 6;
		buffer |= atobLookup(data[i]);
		accumulatedBits += 6;
		// "If buffer has accumulated 24 bits, interpret them as three 8-bit
		// big-endian numbers. Append three bytes with values equal to those
		// numbers to output, in the same order, and then empty buffer."
		if (accumulatedBits === 24) {
			output += String.fromCharCode((buffer & 16711680) >> 16);
			output += String.fromCharCode((buffer & 65280) >> 8);
			output += String.fromCharCode(buffer & 255);
			buffer = accumulatedBits = 0;
		}
		// "Advance position by 1."
	}
	// "If buffer is not empty, it contains either 12 or 18 bits. If it contains
	// 12 bits, then discard the last four and interpret the remaining eight as
	// an 8-bit big-endian number. If it contains 18 bits, then discard the last
	// two and interpret the remaining 16 as two 8-bit big-endian numbers. Append
	// the one or two bytes with values equal to those one or two numbers to
	// output, in the same order."
	if (accumulatedBits === 12) {
		buffer >>= 4;
		output += String.fromCharCode(buffer);
	} else if (accumulatedBits === 18) {
		buffer >>= 2;
		output += String.fromCharCode((buffer & 65280) >> 8);
		output += String.fromCharCode(buffer & 255);
	}
	// "Return output."
	return output;
}
