import { EventType } from "./MIDIType.js";

// MIDIEvents : Read and edit events from various sources (ArrayBuffer, Stream)
export class MIDIEvents {
    // Static constants
    // Event types
    static readonly EVENT_META = 255;
    static readonly EVENT_SYSEX = 240;
    static readonly EVENT_DIVSYSEX = 247;
    static readonly EVENT_MIDI = 8;
    // Meta event types
    static readonly EVENT_META_SEQUENCE_NUMBER = 0;
    static readonly EVENT_META_TEXT = 1;
    static readonly EVENT_META_COPYRIGHT_NOTICE = 2;
    static readonly EVENT_META_TRACK_NAME = 3;
    static readonly EVENT_META_INSTRUMENT_NAME = 4;
    static readonly EVENT_META_LYRICS = 5;
    static readonly EVENT_META_MARKER = 6;
    static readonly EVENT_META_CUE_POINT = 7;
    static readonly EVENT_META_MIDI_CHANNEL_PREFIX = 32;
    static readonly EVENT_META_END_OF_TRACK = 47;
    static readonly EVENT_META_SET_TEMPO = 81;
    static readonly EVENT_META_SMTPE_OFFSET = 84;
    static readonly EVENT_META_TIME_SIGNATURE = 88;
    static readonly EVENT_META_KEY_SIGNATURE = 89;
    static readonly EVENT_META_SEQUENCER_SPECIFIC = 127;
    // MIDI event types
    static readonly EVENT_MIDI_NOTE_OFF = 8;
    static readonly EVENT_MIDI_NOTE_ON = 9;
    static readonly EVENT_MIDI_NOTE_AFTERTOUCH = 10;
    static readonly EVENT_MIDI_CONTROLLER = 11;
    static readonly EVENT_MIDI_PROGRAM_CHANGE = 12;
    static readonly EVENT_MIDI_CHANNEL_AFTERTOUCH = 13;
    static readonly EVENT_MIDI_PITCH_BEND = 14;
    // MIDI event sizes
    static readonly MIDI_1PARAM_EVENTS = [
        MIDIEvents.EVENT_MIDI_PROGRAM_CHANGE,
        MIDIEvents.EVENT_MIDI_CHANNEL_AFTERTOUCH,
    ];
    static readonly MIDI_2PARAMS_EVENTS = [
        MIDIEvents.EVENT_MIDI_NOTE_OFF,
        MIDIEvents.EVENT_MIDI_NOTE_ON,
        MIDIEvents.EVENT_MIDI_NOTE_AFTERTOUCH,
        MIDIEvents.EVENT_MIDI_CONTROLLER,
        MIDIEvents.EVENT_MIDI_PITCH_BEND,
    ];
    constructor() {
        throw new Error('MIDIEvents function not intended to be run.');
    }
    // Create an event stream parser
    static createParser(stream: DataView, startAt: number, strictMode: boolean): { next: () => EventType | undefined } {
        // Private vars
        // Common vars
        let eventTypeByte: number;
        // MIDI events vars
        let MIDIEventType: number;
        let MIDIEventChannel: number;
        let MIDIEventParam1: number;

        const streamReader = {
            position: startAt || 0,
            buffer: stream,
            readUint8: function () {
                return this.buffer.getUint8(this.position++);
            },
            readUint16: function () {
                const v = this.buffer.getUint16(this.position);
                this.position = this.position + 2;
                return v;
            },
            readUint32: function () {
                const v = this.buffer.getUint16(this.position);
                this.position = this.position + 2;
                return v;
            },
            readVarInt: function () {
                let v = 0;
                let i = 0;
                let b;
                while (4 > i++) {
                    b = this.readUint8();

                    if (b & 128) {
                        v += (b & 127);
                        v <<= 7;
                    } else {
                        return v + b;
                    }
                }
                throw new Error('0x' + this.position.toString(16) + ':' +
                    ' Variable integer length cannot exceed 4 bytes');
            },
            readBytes: function (length: number) {
                const bytes = [];

                for (; 0 < length; length--) {
                    bytes.push(this.readUint8());
                }
                return bytes;
            },
            pos: function () {
                return '0x' + (this.buffer.byteOffset + this.position).toString(16);
            },
            end: function () {
                return this.position === this.buffer.byteLength;
            },
        };
        // Consume stream till not at start index
        if (0 < startAt) {
            while (startAt--) {
                streamReader.readUint8();
            }
        }
        // creating the parser object
        return {
            // Read the next event
            next: function () {
                // Check available datas
                if (streamReader.end()) {
                    return;
                }
                // Creating the event
                const event: EventType = {
                    // Memoize the event index
                    index: streamReader.pos(),
                    // Read the delta time
                    delta: streamReader.readVarInt(),
                    track: 0,
                    type: 0,
                    subtype: 0,
                    length: 0,
                    msb: 0,
                    lsb: 0,
                    data: [],
                    prefix: 0,
                    tempo: 0,
                    tempoBPM: 0,
                    hour: 0,
                    minutes: 0,
                    seconds: 0,
                    frames: 0,
                    subframes: 0,
                    key: 0,
                    scale: 0,
                    param1: 0,
                    param2: 0,
                    param3: 0,
                    param4: 0,
                    badsubtype: 0,
                    channel: 0,
                    playTime: 0
                };
                // Read the eventTypeByte
                eventTypeByte = streamReader.readUint8();
                if (240 === (eventTypeByte & 240)) {
                    // Meta events
                    if (eventTypeByte === MIDIEvents.EVENT_META) {
                        event.type = MIDIEvents.EVENT_META;
                        event.subtype = streamReader.readUint8();
                        event.length = streamReader.readVarInt();
                        switch (event.subtype) {
                            case MIDIEvents.EVENT_META_SEQUENCE_NUMBER:
                                if (strictMode && 2 !== event.length) {
                                    throw new Error(streamReader.pos() + ' Bad metaevent length.');
                                }
                                event.msb = streamReader.readUint8();
                                event.lsb = streamReader.readUint8();
                                return event;
                            case MIDIEvents.EVENT_META_TEXT:
                            case MIDIEvents.EVENT_META_COPYRIGHT_NOTICE:
                            case MIDIEvents.EVENT_META_TRACK_NAME:
                            case MIDIEvents.EVENT_META_INSTRUMENT_NAME:
                            case MIDIEvents.EVENT_META_LYRICS:
                            case MIDIEvents.EVENT_META_MARKER:
                            case MIDIEvents.EVENT_META_CUE_POINT:
                                event.data = streamReader.readBytes(event.length);
                                return event;
                            case MIDIEvents.EVENT_META_MIDI_CHANNEL_PREFIX:
                                if (strictMode && 1 !== event.length) {
                                    throw new Error(streamReader.pos() + ' Bad metaevent length.');
                                }
                                event.prefix = streamReader.readUint8();
                                return event;
                            case MIDIEvents.EVENT_META_END_OF_TRACK:
                                if (strictMode && 0 !== event.length) {
                                    throw new Error(streamReader.pos() + ' Bad metaevent length.');
                                }
                                return event;
                            case MIDIEvents.EVENT_META_SET_TEMPO:
                                if (strictMode && 3 !== event.length) {
                                    throw new Error(streamReader.pos() + ' Tempo meta event length must be 3.');
                                }
                                event.tempo = (
                                    (streamReader.readUint8() << 16) +
                                    (streamReader.readUint8() << 8) +
                                    streamReader.readUint8());
                                event.tempoBPM = 60000000 / event.tempo;
                                return event;
                            case MIDIEvents.EVENT_META_SMTPE_OFFSET:
                                if (strictMode && 5 !== event.length) {
                                    throw new Error(streamReader.pos() + ' Bad metaevent length.');
                                }
                                event.hour = streamReader.readUint8();
                                if (strictMode && 23 < event.hour) {
                                    throw new Error(streamReader.pos() + ' SMTPE offset hour value must' +
                                        ' be part of 0-23.');
                                }
                                event.minutes = streamReader.readUint8();
                                if (strictMode && 59 < event.minutes) {
                                    throw new Error(streamReader.pos() + ' SMTPE offset minutes value' +
                                        ' must be part of 0-59.');
                                }
                                event.seconds = streamReader.readUint8();
                                if (strictMode && 59 < event.seconds) {
                                    throw new Error(streamReader.pos() + ' SMTPE offset seconds value' +
                                        ' must be part of 0-59.');
                                }
                                event.frames = streamReader.readUint8();
                                if (strictMode && 30 < event.frames) {
                                    throw new Error(streamReader.pos() + ' SMTPE offset frames value must' +
                                        ' be part of 0-30.');
                                }
                                event.subframes = streamReader.readUint8();
                                if (strictMode && 99 < event.subframes) {
                                    throw new Error(streamReader.pos() + ' SMTPE offset subframes value' +
                                        ' must be part of 0-99.');
                                }
                                return event;
                            case MIDIEvents.EVENT_META_KEY_SIGNATURE:
                                if (strictMode && 2 !== event.length) {
                                    throw new Error(streamReader.pos() + ' Bad metaevent length.');
                                }
                                event.key = streamReader.readUint8();
                                if (strictMode && (-7 > event.key || 7 < event.key)) {
                                    throw new Error(streamReader.pos() + ' Bad metaevent length.');
                                }
                                event.scale = streamReader.readUint8();
                                if (strictMode && 0 !== event.scale && 1 !== event.scale) {
                                    throw new Error(streamReader.pos() + ' Key signature scale value must' +
                                        ' be 0 or 1.');
                                }
                                return event;
                            case MIDIEvents.EVENT_META_TIME_SIGNATURE:
                                if (strictMode && 4 !== event.length) {
                                    throw new Error(streamReader.pos() + ' Bad metaevent length.');
                                }
                                event.data = streamReader.readBytes(event.length);
                                event.param1 = event.data[0];
                                event.param2 = event.data[1];
                                event.param3 = event.data[2];
                                event.param4 = event.data[3];
                                return event;
                            case MIDIEvents.EVENT_META_SEQUENCER_SPECIFIC:
                                event.data = streamReader.readBytes(event.length);
                                return event;
                            default:
                                if (strictMode) {
                                    throw new Error(streamReader.pos() + ' Unknown meta event type ' +
                                        '(' + event.subtype.toString(16) + ').');
                                }
                                event.data = streamReader.readBytes(event.length);
                                return event;
                        }
                        // System events
                    } else if (eventTypeByte === MIDIEvents.EVENT_SYSEX ||
                        eventTypeByte === MIDIEvents.EVENT_DIVSYSEX) {
                        event.type = eventTypeByte;
                        event.length = streamReader.readVarInt();
                        event.data = streamReader.readBytes(event.length);
                        return event;
                        // Unknown event, assuming it's system like event
                    } else {
                        if (strictMode) {
                            throw new Error(streamReader.pos() + ' Unknown event type ' +
                                eventTypeByte.toString(16) + ', Delta: ' + event.delta + '.');
                        }
                        event.type = eventTypeByte;
                        event.badsubtype = streamReader.readVarInt();
                        event.length = streamReader.readUint8();
                        event.data = streamReader.readBytes(event.length);
                        return event;
                    }
                    // MIDI eventsdestination[index++]
                } else {
                    // running status
                    if (0 === (eventTypeByte & 128)) {
                        if (!(MIDIEventType)) {
                            throw new Error(streamReader.pos() + ' Running status without previous event');
                        }
                        MIDIEventParam1 = eventTypeByte;
                    } else {
                        MIDIEventType = eventTypeByte >> 4;
                        MIDIEventChannel = eventTypeByte & 15;
                        MIDIEventParam1 = streamReader.readUint8();
                    }
                    event.type = MIDIEvents.EVENT_MIDI;
                    event.subtype = MIDIEventType;
                    event.channel = MIDIEventChannel;
                    event.param1 = MIDIEventParam1;
                    switch (MIDIEventType) {
                        case MIDIEvents.EVENT_MIDI_NOTE_OFF:
                            event.param2 = streamReader.readUint8();
                            return event;
                        case MIDIEvents.EVENT_MIDI_NOTE_ON:
                            event.param2 = streamReader.readUint8();

                            // If velocity is 0, it's a note off event in fact
                            if (!event.param2) {
                                event.subtype = MIDIEvents.EVENT_MIDI_NOTE_OFF;
                                event.param2 = 127; // Find a standard telling what to do here
                            }
                            return event;
                        case MIDIEvents.EVENT_MIDI_NOTE_AFTERTOUCH:
                            event.param2 = streamReader.readUint8();
                            return event;
                        case MIDIEvents.EVENT_MIDI_CONTROLLER:
                            event.param2 = streamReader.readUint8();
                            return event;
                        case MIDIEvents.EVENT_MIDI_PROGRAM_CHANGE:
                            return event;
                        case MIDIEvents.EVENT_MIDI_CHANNEL_AFTERTOUCH:
                            return event;
                        case MIDIEvents.EVENT_MIDI_PITCH_BEND:
                            event.param2 = streamReader.readUint8();
                            return event;
                        default:
                            if (strictMode) {
                                throw new Error(streamReader.pos() + ' Unknown MIDI event type ' +
                                    '(' + MIDIEventType.toString(16) + ').');
                            }
                            return event;
                    }
                }
            },
        };
    };

    // Return the buffer length needed to encode the given events
    static writeToTrack(events: EventType[], destination: Uint8Array, strictMode?: boolean) {
        let index = 0;

        // Converting each event to binary MIDI datas
        for (let i = 0, j = events.length; i < j; i++) {
            // Writing delta value
            if (events[i].delta >>> 28) {
                throw Error('Event #' + i + ': Maximum delta time value reached (' +
                    events[i].delta + '/134217728 max)');
            }
            if (events[i].delta >>> 21) {
                destination[index++] = ((events[i].delta >>> 21) & 127) | 128;
            }
            if (events[i].delta >>> 14) {
                destination[index++] = ((events[i].delta >>> 14) & 127) | 128;
            }
            if (events[i].delta >>> 7) {
                destination[index++] = ((events[i].delta >>> 7) & 127) | 128;
            }
            destination[index++] = (events[i].delta & 127);
            // MIDI Events encoding
            if (events[i].type === MIDIEvents.EVENT_MIDI) {
                // Adding the byte of subtype + channel
                destination[index++] = (events[i].subtype << 4) + events[i].channel;
                // Adding the byte of the first params
                destination[index++] = events[i].param1;
                // Adding a byte for the optionnal second param
                if (-1 !== MIDIEvents.MIDI_2PARAMS_EVENTS.indexOf(events[i].subtype)) {
                    destination[index++] = events[i].param2;
                }
                // META / SYSEX events encoding
            } else {
                // Adding the event type byte
                destination[index++] = events[i].type;
                // Adding the META event subtype byte
                if (events[i].type === MIDIEvents.EVENT_META) {
                    destination[index++] = events[i].subtype;
                }
                // Writing the event length bytes
                if (events[i].length >>> 28) {
                    throw Error('Event #' + i + ': Maximum length reached (' +
                        events[i].length + '/134217728 max)');
                }
                if (events[i].length >>> 21) {
                    destination[index++] = ((events[i].length >>> 21) & 127) | 128;
                }
                if (events[i].length >>> 14) {
                    destination[index++] = ((events[i].length >>> 14) & 127) | 128;
                }
                if (events[i].length >>> 7) {
                    destination[index++] = ((events[i].length >>> 7) & 127) | 128;
                }
                destination[index++] = (events[i].length & 127);
                if (events[i].type === MIDIEvents.EVENT_META) {
                    switch (events[i].subtype) {
                        case MIDIEvents.EVENT_META_SEQUENCE_NUMBER:
                            destination[index++] = events[i].msb;
                            destination[index++] = events[i].lsb;
                            break;
                        case MIDIEvents.EVENT_META_TEXT:
                        case MIDIEvents.EVENT_META_COPYRIGHT_NOTICE:
                        case MIDIEvents.EVENT_META_TRACK_NAME:
                        case MIDIEvents.EVENT_META_INSTRUMENT_NAME:
                        case MIDIEvents.EVENT_META_LYRICS:
                        case MIDIEvents.EVENT_META_MARKER:
                        case MIDIEvents.EVENT_META_CUE_POINT:
                            for (let k = 0, l = events[i].length; k < l; k++) {
                                destination[index++] = events[i].data[k];
                            }
                            break;
                        case MIDIEvents.EVENT_META_MIDI_CHANNEL_PREFIX:
                            destination[index++] = events[i].prefix;
                            break;
                        case MIDIEvents.EVENT_META_END_OF_TRACK:
                            break;
                        case MIDIEvents.EVENT_META_SET_TEMPO:
                            destination[index++] = (events[i].tempo >> 16);
                            destination[index++] = (events[i].tempo >> 8) & 255;
                            destination[index++] = events[i].tempo & 255;
                            break;
                        case MIDIEvents.EVENT_META_SMTPE_OFFSET:
                            if (strictMode && 23 < events[i].hour) {
                                throw new Error('Event #' + i + ': SMTPE offset hour value must be' +
                                    ' part of 0-23.');
                            }
                            destination[index++] = events[i].hour;
                            if (strictMode && 59 < events[i].minutes) {
                                throw new Error('Event #' + i + ': SMTPE offset minutes value must' +
                                    ' be part of 0-59.');
                            }
                            destination[index++] = events[i].minutes;
                            if (strictMode && 59 < events[i].seconds) {
                                throw new Error('Event #' + i + ': SMTPE offset seconds value must' +
                                    ' be part of 0-59.');
                            }
                            destination[index++] = events[i].seconds;
                            if (strictMode && 30 < events[i].frames) {
                                throw new Error('Event #' + i + ': SMTPE offset frames amount must' +
                                    ' be part of 0-30.');
                            }
                            destination[index++] = events[i].frames;
                            if (strictMode && 99 < events[i].subframes) {
                                throw new Error('Event #' + i + ': SMTPE offset subframes amount' +
                                    ' must be part of 0-99.');
                            }
                            destination[index++] = events[i].subframes;
                            break;
                        case MIDIEvents.EVENT_META_KEY_SIGNATURE:
                            if ('number' !== typeof events[i].key || -7 > events[i].key ||
                                7 < events[i].scale) {
                                throw new Error('Event #' + i + ':The key signature key must be' +
                                    ' between -7 and 7');
                            }
                            if ('number' !== typeof events[i].scale ||
                                0 > events[i].scale || 1 < events[i].scale) {
                                throw new Error('Event #' + i + ':' +
                                    'The key signature scale must be 0 or 1');
                            }
                            destination[index++] = events[i].key;
                            destination[index++] = events[i].scale;
                            break;
                        // Not implemented
                        case MIDIEvents.EVENT_META_TIME_SIGNATURE:
                        case MIDIEvents.EVENT_META_SEQUENCER_SPECIFIC:
                        default:
                            for (let k = 0, l = events[i].length; k < l; k++) {
                                destination[index++] = events[i].data[k];
                            }
                            break;
                    }
                    // Adding bytes corresponding to the sysex event datas
                } else {
                    for (let k = 0, l = events[i].length; k < l; k++) {
                        destination[index++] = events[i].data[k];
                    }
                }
            }
        }
    };

    // Return the buffer length needed to encode the given events
    static getRequiredBufferLength(events: EventType[]) {
        let bufferLength = 0;
        // Calculating the track size by adding events lengths
        for (let i = 0, j = events.length; i < j; i++) {
            // Computing necessary bytes to encode the delta value
            bufferLength +=
                events[i].delta >>> 21 ? 4 :
                    events[i].delta >>> 14 ? 3 :
                        events[i].delta >>> 7 ? 2 : 1;
            // MIDI Events have various fixed lengths
            if (events[i].type === MIDIEvents.EVENT_MIDI) {
                // Adding a byte for subtype + channel
                bufferLength++;
                // Adding a byte for the first params
                bufferLength++;
                // Adding a byte for the optionnal second param
                if (-1 !== MIDIEvents.MIDI_2PARAMS_EVENTS.indexOf(events[i].subtype)) {
                    bufferLength++;
                }
                // META / SYSEX events lengths are self defined
            } else {
                // Adding a byte for the event type
                bufferLength++;
                // Adding a byte for META events subtype
                if (events[i].type === MIDIEvents.EVENT_META) {
                    bufferLength++;
                }
                // Adding necessary bytes to encode the length
                bufferLength +=
                    events[i].length >>> 21 ? 4 :
                        events[i].length >>> 14 ? 3 :
                            events[i].length >>> 7 ? 2 : 1;
                // Adding bytes corresponding to the event length
                bufferLength += events[i].length;
            }
        }
        return bufferLength;
    };

}
