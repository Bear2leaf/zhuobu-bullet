import { EventType } from "./MIDIType.js";
import { MIDIEvents } from "./MIDIEvents.js";
import { MIDIFileHeader } from "./MIDIFileHeader.js";
import { MIDIFileTrack } from "./MIDIFileTrack.js";
///...........................................


// MIDIFile : Read (and soon edit) a MIDI file in a given ArrayBuffer


function ensureArrayBuffer(buf: ArrayBuffer | Uint8Array) {
    if (buf) {
        if (buf instanceof ArrayBuffer) {
            return buf;
        }
        if (buf instanceof Uint8Array) {
            // Copy/convert to standard Uint8Array, because derived classes like
            // node.js Buffers might have unexpected data in the .buffer property.
            return new Uint8Array(buf).buffer;
        }
    }
    throw new Error('Unsupported buffer type, need ArrayBuffer or Uint8Array');
}

// Constructor
export default class MIDIFile {
    private readonly header: MIDIFileHeader;
    private readonly tracks: MIDIFileTrack[];
    constructor(buffer?: ArrayBuffer, strictMode: boolean = false) {
        let track;
        let curIndex;

        // If not buffer given, creating a new MIDI file
        if (!buffer) {
            // Creating the content
            this.header = new MIDIFileHeader();
            this.tracks = [new MIDIFileTrack()];
            // if a buffer is provided, parsing him
        } else {
            buffer = ensureArrayBuffer(buffer);
            // Minimum MIDI file size is a headerChunk size (14bytes)
            // and an empty track (8+3bytes)
            if (25 > buffer.byteLength) {
                throw new Error('A buffer of a valid MIDI file must have, at least, a' +
                    ' size of 25bytes.');
            }
            // Reading header
            this.header = new MIDIFileHeader(buffer, strictMode);
            this.tracks = [];
            curIndex = MIDIFileHeader.HEADER_LENGTH;
            // Reading tracks
            for (let i = 0, j = this.header.getTracksCount(); i < j; i++) {
                // Testing the buffer length
                if (strictMode && curIndex >= buffer.byteLength - 1) {
                    throw new Error('Couldn\'t find datas corresponding to the track #' + i + '.');
                }
                // Creating the track object
                track = new MIDIFileTrack(buffer, curIndex, strictMode);
                this.tracks.push(track);
                // Updating index to the track end
                curIndex += track.getTrackLength() + 8;
            }
            // Testing integrity : curIndex should be at the end of the buffer
            if (strictMode && curIndex !== buffer.byteLength) {
                throw new Error('It seems that the buffer contains too much datas.');
            }
        }
    }
    startNote(event: EventType, song: Record<string, any>) {
        const track = this.takeTrack(event.channel, song);
        track.notes.push({
            when: event.playTime / 1000,
            pitch: event.param1,
            velocity: Math.pow(event.param2 / 127, 2),
            duration: 0.0000001,
            slides: []
        });
    }
    closeNote(event: EventType, song: Record<string, any>) {
        const track = this.takeTrack(event.channel, song);
        for (let i = 0; i < track.notes.length; i++) {
            if (track.notes[i].duration === 0.0000001 //
                && track.notes[i].pitch === event.param1 //
                && track.notes[i].when < event.playTime / 1000) {
                track.notes[i].duration = event.playTime / 1000 - track.notes[i].when;
                break;
            }
        }
    }
    addSlide(event: EventType, song: Record<string, any>, pitchBendRange: number) {
        const track = this.takeTrack(event.channel, song);
        for (let i = 0; i < track.notes.length; i++) {
            if (track.notes[i].duration === 0.0000001 //
                && track.notes[i].when < event.playTime / 1000) {
                track.notes[i].slides.push({
                    delta: (event.param2 - 64) / 64 * pitchBendRange,
                    when: event.playTime / 1000 - track.notes[i].when
                });
            }
        }
    }
    startDrum(event: EventType, song: Record<string, any>) {
        const beat = this.takeBeat(event.param1, song);
        beat.notes.push({
            when: event.playTime / 1000
        });
    }
    takeTrack(n: number, song: Record<string, any>) {
        for (let i = 0; i < song.tracks.length; i++) {
            if (song.tracks[i].n === n) {
                return song.tracks[i];
            }
        }
        const track = {
            n: n,
            notes: [],
            volume: 1,
            program: 0
        };
        song.tracks.push(track);
        return track;
    }
    takeBeat(n: number, song: Record<string, any>) {
        for (let i = 0; i < song.beats.length; i++) {
            if (song.beats[i].n === n) {
                return song.beats[i];
            }
        }
        const beat = {
            n: n,
            notes: [],
            volume: 1
        };
        song.beats.push(beat);
        return beat;
    }
    parseSong() {
        const song = {
            duration: 0,
            tracks: [],
            beats: []
        };
        const events = this.getMidiEvents();
        // console.debug(events);
        // To set the pitch-bend range, three to four consecutive EVENT_MIDI_CONTROLLER messages must have consistent contents.
        let expectedPitchBendRangeMessageNumber = 1; // counts which pitch-bend range message can be expected next: number 1 (can be sent any time, except after pitch-bend range messages number 1 or 2), number 2 (required after number 1), number 3 (required after number 2), or number 4 (optional)
        let expectedPitchBendRangeChannel = null;
        const pitchBendRange = Array(16).fill(2); // Default pitch-bend range is 2 semitones.
        for (let i = 0; i < events.length; i++) {
            const expectedPitchBendRangeMessageNumberOld = expectedPitchBendRangeMessageNumber;
            // console.debug('		next',events[i]);
            if (song.duration < events[i].playTime / 1000) {
                song.duration = events[i].playTime / 1000;
            }
            if (events[i].subtype === MIDIEvents.EVENT_MIDI_NOTE_ON) {
                if (events[i].channel === 9) {
                    if (events[i].param1 >= 35 && events[i].param1 <= 81) {
                        this.startDrum(events[i], song);
                    } else {
                        // console.debug('wrong drum', events[i]);
                    }
                } else {
                    if (events[i].param1 >= 0 && events[i].param1 <= 127) {
                        // console.debug('start', events[i].param1);
                        this.startNote(events[i], song);
                    } else {
                        // console.debug('wrong tone', events[i]);
                    }
                }
            } else {
                if (events[i].subtype === MIDIEvents.EVENT_MIDI_NOTE_OFF) {
                    if (events[i].channel !== 9) {
                        this.closeNote(events[i], song);
                        // console.debug('close', events[i].param1);
                    }
                } else {
                    if (events[i].subtype === MIDIEvents.EVENT_MIDI_PROGRAM_CHANGE) {
                        if (events[i].channel !== 9) {
                            const track = this.takeTrack(events[i].channel, song);
                            track.program = events[i].param1;
                        } else {
                            // console.debug('skip program for drums');
                        }
                    } else {
                        if (events[i].subtype === MIDIEvents.EVENT_MIDI_CONTROLLER) {
                            if (events[i].param1 === 7) {
                                if (events[i].channel !== 9) { // TODO why not set loudness for drums?
                                    const track = this.takeTrack(events[i].channel, song);
                                    track.volume = events[i].param2 / 127 || 0.000001;
                                    // console.debug('volume', track.volume,'for',events[i].channel);
                                }
                            } else if (
                                (expectedPitchBendRangeMessageNumber === 1 && events[i].param1 === 0x65 && events[i].param2 === 0x00) ||
                                (expectedPitchBendRangeMessageNumber === 2 && events[i].param1 === 0x64 && events[i].param2 === 0x00) ||
                                (expectedPitchBendRangeMessageNumber === 3 && events[i].param1 === 0x06) ||
                                (expectedPitchBendRangeMessageNumber === 4 && events[i].param1 === 0x26)
                            ) {
                                if (expectedPitchBendRangeMessageNumber > 1 && events[i].channel !== expectedPitchBendRangeChannel) {
                                    throw Error('Unexpected channel number in non-first pitch-bend RANGE (SENSITIVITY) message. MIDI file might be corrupt.');
                                }
                                expectedPitchBendRangeChannel = events[i].channel;
                                if (expectedPitchBendRangeMessageNumber === 3) {
                                    pitchBendRange[events[i].channel] = events[i].param2; // in semitones
                                    // console.debug('pitchBendRange', pitchBendRange);
                                }
                                if (expectedPitchBendRangeMessageNumber === 4) {
                                    pitchBendRange[events[i].channel] += events[i].param2 / 100; // convert cents to semitones, add to semitones set in the previous MIDI message
                                    // console.debug('pitchBendRange', pitchBendRange);
                                }
                                expectedPitchBendRangeMessageNumber++;
                                if (expectedPitchBendRangeMessageNumber === 5) {
                                    expectedPitchBendRangeMessageNumber = 1;
                                }
                            } else {
                                // console.debug('controller', events[i]);
                            }
                        } else {
                            if (events[i].subtype === MIDIEvents.EVENT_MIDI_PITCH_BEND) {
                                // console.debug('	bend', events[i].channel, events[i].param1, events[i].param2);
                                this.addSlide(events[i], song, pitchBendRange[events[i].channel]);
                            } else {
                                // console.debug('unknown', events[i].channel, events[i]);
                            };
                        }
                    }
                }
            }
            if (expectedPitchBendRangeMessageNumberOld === expectedPitchBendRangeMessageNumber) { // If the current message wasn't an expected pitch-bend range message
                if (expectedPitchBendRangeMessageNumberOld >= 2 && expectedPitchBendRangeMessageNumberOld <= 3) {
                    throw Error('Pitch-bend RANGE (SENSITIVITY) messages ended prematurely. MIDI file might be corrupt.');
                }
                if (expectedPitchBendRangeMessageNumberOld === 4) { // The fourth message is optional, so since it wasn't sent, the setting of the pitch-bend range is done, and we might expect the first pitch-bend range message some time in the future
                    expectedPitchBendRangeMessageNumber = 1;
                }
            }
        }
        return song;
    }
    // Events reading helpers
    getEvents(type: number, subtype?: number) {
        let playTime = 0;
        let filteredEvents: EventType[]= [];
        let format = this.header.getFormat();
        let tickResolution = this.header.getTickResolution();

        // Reading events
        // if the read is sequential
        if (1 !== format || 1 === this.tracks.length) {
            for (let i = 0, j = this.tracks.length; i < j; i++) {
                // reset playtime if format is 2
                playTime = (2 === format && playTime ? playTime : 0);
                const events = MIDIEvents.createParser(this.tracks[i].getTrackContent(), 0, false);
                // loooping through events
                let event = events.next();
                while (event) {
                    playTime += event.delta ? (event.delta * tickResolution) / 1000 : 0;
                    if (event.type === MIDIEvents.EVENT_META) {
                        // tempo change events
                        if (event.subtype === MIDIEvents.EVENT_META_SET_TEMPO) {
                            tickResolution = this.header.getTickResolution(event.tempo);
                        }
                    }
                    // push the asked events
                    if (((!type) || event.type === type) &&
                        ((!subtype) || (event.subtype && event.subtype === subtype))) {
                        event.playTime = playTime;
                        filteredEvents.push(event);
                    }
                    event = events.next();
                }
            }
            // the read is concurrent
        } else {
            const trackParsers: {
                curEvent?: EventType;
                parser: {
                    next(): EventType | undefined;
                };
            }[] = [];
            let smallestDelta = -1;

            // Creating parsers
            for (let i = 0, j = this.tracks.length; i < j; i++) {
                const parser = MIDIEvents.createParser(
                    this.tracks[i].getTrackContent(), 0, false);
                trackParsers[i] = {
                    parser,
                    curEvent: parser.next()
                }
            }
            // Filling events
            do {
                smallestDelta = -1;
                // finding the smallest event
                for (let i = 0, j = trackParsers.length; i < j; i++) {
                    if (trackParsers[i].curEvent !== undefined) {
                        const curEvent = trackParsers[i].curEvent;
                        if (curEvent === undefined || curEvent === undefined) {
                            throw new Error('Unexpected undefined event');
                        }
                        if (-1 === smallestDelta) {
                            smallestDelta = i;
                        } else {
                            const smallestCurEvent = trackParsers[smallestDelta].curEvent;
                            if (smallestCurEvent === undefined || smallestCurEvent === undefined) {
                                throw new Error('Unexpected undefined event');
                            }
                            if (curEvent.delta <
                                smallestCurEvent.delta) {
                                smallestDelta = i;
                            }
                        }
                    }
                }
                if (-1 !== smallestDelta) {
                    // removing the delta of previous events
                    for (let i = 0, j = trackParsers.length; i < j; i++) {
                        const curEvent = trackParsers[i].curEvent;
                        if (i !== smallestDelta && curEvent !== undefined) {
                            const smallestCurEvent = trackParsers[smallestDelta].curEvent;
                            if (smallestCurEvent === undefined || smallestCurEvent === undefined) {
                                throw new Error('Unexpected undefined event');
                            }
                            curEvent.delta -= smallestCurEvent.delta;
                        }
                    }
                    // filling values
                    const event = trackParsers[smallestDelta].curEvent;
                    if (event === undefined || event === undefined) {
                        throw new Error('Unexpected undefined event');
                    }
                    playTime += (event.delta ? (event.delta * tickResolution) / 1000 : 0);
                    if (event.type === MIDIEvents.EVENT_META) {
                        // tempo change events
                        if (event.subtype === MIDIEvents.EVENT_META_SET_TEMPO) {
                            tickResolution = this.header.getTickResolution(event.tempo);
                        }
                    }
                    // push midi events
                    if (((!type) || event.type === type) &&
                        ((!subtype) || (event.subtype && event.subtype === subtype))) {
                        event.playTime = playTime;
                        event.track = smallestDelta;
                        filteredEvents.push(event);
                    }
                    // getting next event
                    trackParsers[smallestDelta].curEvent = trackParsers[smallestDelta].parser.next();
                }
            } while (-1 !== smallestDelta);
        }
        return filteredEvents;
    };

    getMidiEvents() {
        return this.getEvents(MIDIEvents.EVENT_MIDI);
    };

    // Basic events reading
    getTrackEvents(index: number) {
        const events = [];
        if (index > this.tracks.length || 0 > index) {
            throw Error('Invalid track index (' + index + ')');
        }
        const parser = MIDIEvents.createParser(
            this.tracks[index].getTrackContent(), 0, false);
        let event = parser.next();
        do {
            events.push(event);
            event = parser.next();
        } while (event);
        return events;
    };

    // Basic events writting
    setTrackEvents(index: number, events: EventType[]) {

        if (index > this.tracks.length || 0 > index) {
            throw Error('Invalid track index (' + index + ')');
        }
        if ((!events) || (!events.length)) {
            throw Error('A track must contain at least one event, none given.');
        }
        const bufferLength = MIDIEvents.getRequiredBufferLength(events);
        const destination = new Uint8Array(bufferLength);
        MIDIEvents.writeToTrack(events, destination);
        this.tracks[index].setTrackContent(destination);
    };

    // Remove a track
    deleteTrack(index: number) {
        if (index > this.tracks.length || 0 > index) {
            throw Error('Invalid track index (' + index + ')');
        }
        this.tracks.splice(index, 1);
        this.header.setTracksCount(this.tracks.length);
    };

    // Add a track
    addTrack(index: number) {

        if (index > this.tracks.length || 0 > index) {
            throw Error('Invalid track index (' + index + ')');
        }
        const track = new MIDIFileTrack();
        if (index === this.tracks.length) {
            this.tracks.push(track);
        } else {
            this.tracks.splice(index, 0, track);
        }
        this.header.setTracksCount(this.tracks.length);
    };

    // Retrieve the content in a buffer
    getContent() {

        // Calculating the buffer content
        // - initialize with the header length
        let bufferLength = MIDIFileHeader.HEADER_LENGTH;
        // - add tracks length
        for (let i = 0, j = this.tracks.length; i < j; i++) {
            bufferLength += this.tracks[i].getTrackLength() + 8;
        }
        // Creating the destination buffer
        const destination = new Uint8Array(bufferLength);
        // Adding header
        let origin = new Uint8Array(this.header.datas.buffer,
            this.header.datas.byteOffset,
            MIDIFileHeader.HEADER_LENGTH);
        let i = 0;
        for (let j = MIDIFileHeader.HEADER_LENGTH; i < j; i++) {
            destination[i] = origin[i];
        }
        // Adding tracks
        for (let k = 0, l = this.tracks.length; k < l; k++) {
            origin = new Uint8Array(this.tracks[k].datas.buffer,
                this.tracks[k].datas.byteOffset,
                this.tracks[k].datas.byteLength);
            for (let m = 0, n = this.tracks[k].datas.byteLength; m < n; m++) {
                destination[i++] = origin[m];
            }
        }
        return destination.buffer;
    };

    // Exports Track/Header constructors
    static Header = MIDIFileHeader;
    static Track = MIDIFileTrack;
}
