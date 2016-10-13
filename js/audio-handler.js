define(['helper'], (Helper) => { // eslint-disable-line
  return class AudioPlayer {
    constructor() {
      const bgAudio = new Audio();
      bgAudio.loop = true;
      bgAudio.autoplay = true;
      bgAudio.src = 'mp3/bg.mp3';

      const audio = new Audio();
      audio.loop = true;
      audio.autoplay = true;
      audio.volume = 0;
      audio.src = 'mp3/keyboard.mp3';

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      const audioAnalyser =  audioContext.createAnalyser();
      audioAnalyser.fftSize = 1024;

      const audioSource =  audioContext.createMediaElementSource(audio);
      audioSource.connect(audioAnalyser);
      audioAnalyser.connect( audioContext.destination);

      const bufferLength = audioAnalyser.frequencyBinCount;

      Object.assign(this, { audio, audioContext, audioAnalyser, audioSource, bufferLength});

      this.dataArray = new Uint8Array(bufferLength);

      this.previousAudioLevel = 0;
    }

    changeAudio(level) {
      if(level !== this.previousAudioLevel) {
        const { audio } = this;
        audio.volume = level / 100;
        this.previousAudioLevel = level;
      }
    }

    getVolume() {
      this.audioAnalyser.getByteFrequencyData(this.dataArray);
      return Math.floor(this.dataArray.reduce((a, b) => a + b) / this.dataArray.length);
    }

    currentVolume() {
      return this.audio.volume;
    }
  };
});
