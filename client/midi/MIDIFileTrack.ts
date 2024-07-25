///...........................................
// MIDIFileTrack : Read and edit a MIDI track chunk in a given ArrayBuffer
export class MIDIFileTrack {
    // Static constants
    static readonly HDR_LENGTH = 8;
    datas: DataView;
    constructor(buffer?: ArrayBuffer, start = 0, strictMode = false) {
        let a;
        let trackLength;

        // no buffer, creating him
        if (!buffer) {
            a = new Uint8Array(12);
            // Adding the empty track header (MTrk)
            a[0] = 77;
            a[1] = 84;
            a[2] = 114;
            a[3] = 107;
            // Adding the empty track size (4)
            a[4] = 0;
            a[5] = 0;
            a[6] = 0;
            a[7] = 4;
            // Adding the track end event
            a[8] = 0;
            a[9] = 255;
            a[10] = 47;
            a[11] = 0;
            // Saving the buffer
            this.datas = new DataView(a.buffer, 0, MIDIFileTrack.HDR_LENGTH + 4);
            // parsing the given buffer
        } else {
            if (!(buffer instanceof ArrayBuffer)) {
                throw new Error('Invalid buffer received.');
            }
            // Buffer length must size at least like an  empty track (8+3bytes)
            if (12 > buffer.byteLength - start) {
                throw new Error('Invalid MIDIFileTrack (0x' + start.toString(16) + ') :' +
                    ' Buffer length must size at least 12bytes');
            }
            // Creating a temporary view to read the track header
            this.datas = new DataView(buffer, start, MIDIFileTrack.HDR_LENGTH);
            // Reading MIDI track header chunk
            if (!(
                'M' === String.fromCharCode(this.datas.getUint8(0)) &&
                'T' === String.fromCharCode(this.datas.getUint8(1)) &&
                'r' === String.fromCharCode(this.datas.getUint8(2)) &&
                'k' === String.fromCharCode(this.datas.getUint8(3)))) {
                throw new Error('Invalid MIDIFileTrack (0x' + start.toString(16) + ') :' +
                    ' MTrk prefix not found');
            }
            // Reading the track length
            trackLength = this.getTrackLength();
            if (buffer.byteLength - start < trackLength) {
                throw new Error('Invalid MIDIFileTrack (0x' + start.toString(16) + ') :' +
                    ' The track size exceed the buffer length.');
            }
            // Creating the final DataView
            this.datas = new DataView(buffer, start, MIDIFileTrack.HDR_LENGTH + trackLength);
            // Trying to find the end of track event
            if (!(
                255 === this.datas.getUint8(MIDIFileTrack.HDR_LENGTH + (trackLength - 3)) &&
                47 === this.datas.getUint8(MIDIFileTrack.HDR_LENGTH + (trackLength - 2)) &&
                0 === this.datas.getUint8(MIDIFileTrack.HDR_LENGTH + (trackLength - 1)))) {
                throw new Error('Invalid MIDIFileTrack (0x' + start.toString(16) + ') :' +
                    ' No track end event found at the expected index' +
                    ' (' + (MIDIFileTrack.HDR_LENGTH + (trackLength - 1)).toString(16) + ').');
            }
        }
    }


    // Track length
    getTrackLength() {
        return this.datas.getUint32(4);
    };

    setTrackLength(trackLength: number) {
        return this.datas.setUint32(4, trackLength);
    };

    // Read track contents
    getTrackContent() {
        return new DataView(this.datas.buffer,
            this.datas.byteOffset + MIDIFileTrack.HDR_LENGTH,
            this.datas.byteLength - MIDIFileTrack.HDR_LENGTH);
    };

    // Set track content
    setTrackContent(dataView: Uint8Array) {
        let origin;
        let destination;
        let i;
        let j;
        // Calculating the track length
        const trackLength = dataView.byteLength - dataView.byteOffset;

        // Track length must size at least like an  empty track (4bytes)
        if (4 > trackLength) {
            throw new Error('Invalid track length, must size at least 4bytes');
        }
        this.datas = new DataView(
            new Uint8Array(MIDIFileTrack.HDR_LENGTH + trackLength).buffer);
        // Adding the track header (MTrk)
        this.datas.setUint8(0, 77); // M
        this.datas.setUint8(1, 84); // T
        this.datas.setUint8(2, 114); // r
        this.datas.setUint8(3, 107); // k

        // Adding the track size
        this.datas.setUint32(4, trackLength);
        // Copying the content
        origin = new Uint8Array(dataView.buffer, dataView.byteOffset,
            dataView.byteLength);
        destination = new Uint8Array(this.datas.buffer,
            MIDIFileTrack.HDR_LENGTH,
            trackLength);
        for (let i = 0, j = origin.length; i < j; i++) {
            destination[i] = origin[i];
        }
    };
}
