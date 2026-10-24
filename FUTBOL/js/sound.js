/**
 * Sound FX Generator using Web Audio API
 * Genera sonidos dinámicos estilo FC Mobile sin necesidad de archivos externos.
 */

const SoundFX = {
    audioCtx: null,
    enabled: true,

    init() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
    },

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    },

    playHover() {
        if (!this.enabled) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.05);

            gain.gain.setValueAtTime(0.02, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.05);
        } catch (e) {}
    },

    playClick() {
        if (!this.enabled) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(160, this.audioCtx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.08);
        } catch (e) {}
    },

    playRankUp() {
        if (!this.enabled) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, index) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + (index * 0.07));

                gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime + (index * 0.07));
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + (index * 0.07) + 0.15);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start(this.audioCtx.currentTime + (index * 0.07));
                osc.stop(this.audioCtx.currentTime + (index * 0.07) + 0.15);
            });
        } catch (e) {}
    },

    playPackOpen() {
        if (!this.enabled) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            // Whoosh fanfare
            const now = this.audioCtx.currentTime;
            const chords = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
            chords.forEach((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + (idx * 0.09));

                gain.gain.setValueAtTime(0.07, now + (idx * 0.09));
                gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.09) + 0.4);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start(now + (idx * 0.09));
                osc.stop(now + (idx * 0.09) + 0.45);
            });
        } catch (e) {}
    }
};
