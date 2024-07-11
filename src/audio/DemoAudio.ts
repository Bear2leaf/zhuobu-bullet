import AudioClip from "./AudioClip.js";


export default class DemoAudio implements AudioClip {


    //LOOP CONTROLS
    // const startButton = document.querySelector('#start-button');
    // const stopButton = document.querySelector('#stop-button');
    // const tempoControl = document.querySelector('#tempo-control');
    private tempo = 120.0;
    private currentNoteIndex = 0;
    private isPlaying = false;
    private lfoGain?: GainNode;
    private lfo?: OscillatorNode;
    private context?: AudioContext;
    private frames = 0;
    private readonly notes: {
        [key: string]: number
    } = {
            "C4": 261.63,
            "Db4": 277.18,
            "D4": 293.66,
            "Eb4": 311.13,
            "E4": 329.63,
            "F4": 349.23,
            "Gb4": 369.99,
            "G4": 392.00,
            "Ab4": 415.30,
            "A4": 440,
            "Bb4": 466.16,
            "B4": 493.88,
            "C5": 523.25
        }


    // NOTE SELECTS
    // const noteSelectsDiv = document.querySelector('#note-selects-div');

    // for (let i = 0; i <= 7; i++) {
    //     const select = document.createElement('select');
    //     select.id = `note ${i + 1}`;
    //     for (let j = 0; j < Object.keys(notes).length; j++) {
    //         const option = document.createElement('option');
    //         option.value = j;
    //         option.innerText = `${Object.keys(notes)[j]}`;
    //         select.appendChild(option);
    //         select.addEventListener('change', setCurrentNotes)
    //     }
    //     noteSelectsDiv.appendChild(select);
    // }

    private readonly currentNotes = [0, 3, 0, 7, 8, 7, 3, 2]
    // const noteSelects = document.querySelectorAll('select');
    // function setNoteSelects() {
    //     for (let i = 0; i < currentNotes.length; i++) {
    //         noteSelects[i].value = currentNotes[i];
    //     }
    // }

    // function setCurrentNotes() {
    //     for (let i = 0; i < noteSelects.length; i++) {
    //         currentNotes[i] = noteSelects[i].value;
    //     }
    // }

    // setNoteSelects();

    private masterVolume?: GainNode;
    private delay?: DelayNode;

    // const volumeControl = document.querySelector('#volume-control');

    // volumeControl.addEventListener('input', function () {
    //     masterVolume.gain.value = this.value;
    // });

    //WAVEFORM SELECT
    // const waveforms = document.getElementsByName('waveform');
    private readonly waveform: OscillatorType = "sine";

    // function setWaveform() {
    //     for (var i = 0; i < waveforms.length; i++) {
    //         if (waveforms[i].checked) {
    //             waveform = waveforms[i].value;
    //         }
    //     }
    // }

    // waveforms.forEach((waveformInput) => {
    //     waveformInput.addEventListener('change', function () {
    //         setWaveform();
    //     });
    // });


    // EFFECTS CONTROLS

    // Envelope
    private readonly attackTime = 0.3;
    private readonly sustainLevel = 0.8;
    private readonly releaseTime = 0.3;
    private readonly noteLength = 1;

    // const attackControl = document.querySelector('#attack-control');
    // const releaseControl = document.querySelector('#release-control');
    // const noteLengthControl = document.querySelector('#note-length-control');

    // attackControl.addEventListener('input', function () {
    //     attackTime = Number(this.value);
    // });

    // releaseControl.addEventListener('input', function () {
    //     releaseTime = Number(this.value);
    // });

    // noteLengthControl.addEventListener('input', function () {
    //     noteLength = Number(this.value);
    // });

    // Vibrato
    private readonly vibratoSpeed = 10;
    private readonly vibratoAmount = 0;
    // const vibratoAmountControl = document.querySelector('#vibrato-amount-control');
    // const vibratoSpeedControl = document.querySelector('#vibrato-speed-control');

    // vibratoAmountControl.addEventListener('input', function () {
    //     vibratoAmount = this.value;
    // })

    // vibratoSpeedControl.addEventListener('input', function () {
    //     vibratoSpeed = this.value;
    // })

    // Delay
    // const delayAmountControl = document.querySelector('#delay-amount-control');
    // const delayTimeControl = document.querySelector('#delay-time-control');
    // const feedbackControl = document.querySelector('#feedback-control');
    setContext(context: AudioContext) {
        this.context = context;
    }
    getContext() {
        if (this.context === undefined) {
            throw new Error("audiocontext not exist")
        }
        return this.context;
    }
    init() {

        const masterVolume = this.getContext().createGain();
        this.masterVolume = masterVolume;
        masterVolume.connect(this.getContext().destination);
        masterVolume.gain.value = 0.2

        const delay = this.getContext().createDelay(0.001); // weapp maxDelayTime is required.
        this.delay = delay;
        const feedback = this.getContext().createGain();
        const delayAmountGain = this.getContext().createGain();

        delayAmountGain.connect(delay)
        delay.connect(feedback)

        feedback.connect(delay)
        delay.connect(masterVolume)


        delay.delayTime.value = 0;
        delayAmountGain.gain.value = 0;
        feedback.gain.value = 0;

        // delayAmountControl.addEventListener('input', function () {
        //     delayAmountGain.value = this.value;
        // })

        // delayTimeControl.addEventListener('input', function () {
        //     delay.delayTime.value = this.value;
        // })

        // feedbackControl.addEventListener('input', function () {
        //     feedback.gain.value = this.value;
        // })
    }
    playOnce(): void {
        this.playCurrentNote();
        this.nextNote();
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;

    }
    update() {
        const secondsPerBeat = 60 / this.tempo;
        if (this.isPlaying && (this.frames / 60) > secondsPerBeat) {
            this.playOnce();
            this.frames = 0;
        };
        this.frames++;
    }

    // tempoControl.addEventListener('input', function () {
    //     tempo = Number(this.value);
    // }, false);

    // startButton.addEventListener('click', function () {
    //     if (!isPlaying) {
    //         isPlaying = true;
    //         noteLoop();
    //     }
    // })

    // stopButton.addEventListener('click', function () {
    //     isPlaying = false;
    // })

    nextNote() {
        // noteSelects[currentNoteIndex].style.background = "yellow";
        // if (noteSelects[currentNoteIndex - 1]) {
        //     noteSelects[currentNoteIndex - 1].style.background = "white";
        // } else {
        //     noteSelects[7].style.background = "white"
        // }
        this.currentNoteIndex++;
        if (this.currentNoteIndex === 8) {
            this.currentNoteIndex = 0;
        }
    }

    playCurrentNote() {
        const osc = this.getContext().createOscillator();
        const noteGain = this.getContext().createGain();
        noteGain.gain.setValueAtTime(0, 0);
        noteGain.gain.linearRampToValueAtTime(this.sustainLevel, this.getContext().currentTime + this.noteLength * this.attackTime);
        noteGain.gain.setValueAtTime(this.sustainLevel, this.getContext().currentTime + this.noteLength - this.noteLength * this.releaseTime);
        noteGain.gain.linearRampToValueAtTime(0, this.getContext().currentTime + this.noteLength);

        this.lfoGain = this.getContext().createGain();
        this.lfoGain.gain.setValueAtTime(this.vibratoAmount, 0);
        this.lfoGain.connect(osc.frequency)

        this.lfo = this.getContext().createOscillator();
        this.lfo.frequency.setValueAtTime(this.vibratoSpeed, 0);
        this.lfo.start(0);
        this.lfo.stop(this.getContext().currentTime + this.noteLength);
        this.lfo.connect(this.lfoGain);
        osc.type = this.waveform;
        const notekeys = Object.keys(this.notes);
        const currentNoteKey = notekeys[this.currentNotes[this.currentNoteIndex]];
        osc.frequency.setValueAtTime(this.notes[currentNoteKey], 0);
        osc.start(0);
        osc.stop(this.getContext().currentTime + this.noteLength);
        osc.connect(noteGain);
        if (this.masterVolume === undefined) throw new Error("masterVolume is not set!");
        if (this.delay === undefined) throw new Error("delay is not set!");
        noteGain.connect(this.masterVolume);
        noteGain.connect(this.delay);
    }

}