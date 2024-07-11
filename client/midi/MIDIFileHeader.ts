///...........................................
// MIDIFileHeader : Read and edit a MIDI header chunk in a given ArrayBuffer
export class MIDIFileHeader {
    // Static constants
    static readonly HEADER_LENGTH = 14;
    static readonly FRAMES_PER_SECONDS = 1;
    static readonly TICKS_PER_BEAT = 2;
    datas: DataView;

    constructor(buffer?: ArrayBuffer, strictMode?: boolean) {
        let a;
        // No buffer creating him
        if (!buffer) {
            a = new Uint8Array(MIDIFileHeader.HEADER_LENGTH);
            // Adding the header id (MThd)
            a[0] = 77;
            a[1] = 84;
            a[2] = 104;
            a[3] = 100;
            // Adding the header chunk size
            a[4] = 0;
            a[5] = 0;
            a[6] = 0;
            a[7] = 6;
            // Adding the file format (1 here cause it's the most commonly used)
            a[8] = 0;
            a[9] = 1;
            // Adding the track count (1 cause it's a new file)
            a[10] = 0;
            a[11] = 1;
            // Adding the time division (192 ticks per beat)
            a[12] = 0;
            a[13] = 192;
            // saving the buffer
            this.datas = new DataView(a.buffer, 0, MIDIFileHeader.HEADER_LENGTH);
            // Parsing the given buffer
        } else {
            if (!(buffer instanceof ArrayBuffer)) {
                throw Error('Invalid buffer received.');
            }
            this.datas = new DataView(buffer, 0, MIDIFileHeader.HEADER_LENGTH);
            // Reading MIDI header chunk
            if (!(
                'M' === String.fromCharCode(this.datas.getUint8(0)) &&
                'T' === String.fromCharCode(this.datas.getUint8(1)) &&
                'h' === String.fromCharCode(this.datas.getUint8(2)) &&
                'd' === String.fromCharCode(this.datas.getUint8(3)))) {
                throw new Error('Invalid MIDIFileHeader : MThd prefix not found');
            }
            // Reading chunk length
            if (6 !== this.datas.getUint32(4)) {
                throw new Error('Invalid MIDIFileHeader : Chunk length must be 6');
            }
        }
    }


    // MIDI file format
    getFormat() {
        const format = this.datas.getUint16(8);
        if (0 !== format && 1 !== format && 2 !== format) {
            throw new Error('Invalid MIDI file : MIDI format (' + format + '),' +
                ' format can be 0, 1 or 2 only.');
        }
        return format;
    };

    setFormat(format: 0 | 1 | 2) {
        if (0 !== format && 1 !== format && 2 !== format) {
            throw new Error('Invalid MIDI format given (' + format + '),' +
                ' format can be 0, 1 or 2 only.');
        }
        this.datas.setUint16(8, format);
    };

    // Number of tracks
    getTracksCount() {
        return this.datas.getUint16(10);
    };

    setTracksCount(n: number) {
        return this.datas.setUint16(10, n);
    };

    // Tick compute
    getTickResolution(tempo?: number) {
        // Frames per seconds
        if (this.datas.getUint16(12) & 32768) {
            return 1000000 / (this.getSMPTEFrames() * this.getTicksPerFrame());
            // Ticks per beat
        }
        // Default MIDI tempo is 120bpm, 500ms per beat
        tempo = tempo || 500000;
        return tempo / this.getTicksPerBeat();
    };

    // Time division type
    getTimeDivision() {
        if (this.datas.getUint16(12) & 32768) {
            return MIDIFileHeader.FRAMES_PER_SECONDS;
        }
        return MIDIFileHeader.TICKS_PER_BEAT;
    };

    // Ticks per beat
    getTicksPerBeat() {
        const divisionWord = this.datas.getUint16(12);
        if (divisionWord & 32768) {
            throw new Error('Time division is not expressed as ticks per beat.');
        }
        return divisionWord;
    };

    setTicksPerBeat(ticksPerBeat: number) {
        this.datas.setUint16(12, ticksPerBeat & 32767);
    };

    // Frames per seconds
    getSMPTEFrames() {
        const divisionWord = this.datas.getUint16(12);
        let smpteFrames;

        if (!(divisionWord & 32768)) {
            throw new Error('Time division is not expressed as frames per seconds.');
        }
        smpteFrames = divisionWord & 32512;
        if (-1 === [24, 25, 29, 30].indexOf(smpteFrames)) {
            throw new Error('Invalid SMPTE frames value (' + smpteFrames + ').');
        }
        return 29 === smpteFrames ? 29.97 : smpteFrames;
    };

    getTicksPerFrame() {
        const divisionWord = this.datas.getUint16(12);

        if (!(divisionWord & 32768)) {
            throw new Error('Time division is not expressed as frames per seconds.');
        }
        return divisionWord & 255;
    };

    setSMTPEDivision(smpteFrames: number, ticksPerFrame: number) {
        if (29.97 === smpteFrames) {
            smpteFrames = 29;
        }
        if (-1 === [24, 25, 29, 30].indexOf(smpteFrames)) {
            throw new Error('Invalid SMPTE frames value given (' + smpteFrames + ').');
        }
        if (0 > ticksPerFrame || 255 < ticksPerFrame) {
            throw new Error('Invalid ticks per frame value given (' + smpteFrames + ').');
        }
        this.datas.setUint8(12, 128 | smpteFrames);
        this.datas.setUint8(13, ticksPerFrame);
    };
}
