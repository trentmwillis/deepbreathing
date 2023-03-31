/**
 * This is a class for generating deep, smooth, and rolling brown noise.
 *
 * The inspiration for the sound profile came from this video:
 *   https://youtu.be/P48QELwruQs
 *
 * The very initial implementation of the noise generator came from this article:
 *   https://noisehack.com/generate-noise-web-audio-api/
 *
 * I then spent a lot of time trying to understand these posts to come up with
 * nicer sounding brown noise:
 *   https://dsp.stackexchange.com/questions/75507/generate-smooth-brown-noise-mathematically
 *   https://dsp.stackexchange.com/questions/75530/amplify-filtered-smooth-brown-noise-to-range-1-0f-1-0f
 *
 * This tutorial then helped me come up with an idea to modulate and stereo-ify
 * the noise to make it sound more natural:
 *   https://drakeandersen.com/max-tutorial-7-the-sound-of-the-ocean/
 *
 * These posts then helped me figure out how to properly modulate frequencies
 * with the Web Audio API:
 *   https://stackoverflow.com/questions/15820746/how-to-modulate-an-audioparam-with-a-lfo-in-web-audio-api
 *   https://stackoverflow.com/questions/38063693/how-to-add-a-lfo-to-filter-cutoff-using-web-audio-api
 *   https://stackoverflow.com/questions/58599068/webaudio-lfo-shift-range-from-1-1-to-0-1
 *
 * And, of course, I spent a lot of time on the MDN pages for various Web Audio APIs.
 */

const RAMP_SECONDS = 5;

function createBrownNoise(audioContext) {
  // Start with some basic white noise...
  const noise = new AudioWorkletNode(audioContext, "white-noise-generator");

  // Apply a highpass filter to soften bassy and rumbly low tones (<100hz)...
  const highpass = audioContext.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(100, audioContext.currentTime);

  // Apply a lowpass filter to soften harsh higher tones (>55-65hz)...
  const lowpass = audioContext.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(60, audioContext.currentTime);

  // Create a low-frequency oscillator to gently modulate the lowpass frequency...
  const lowpassLFO = audioContext.createOscillator();
  lowpassLFO.type = "sine";
  lowpassLFO.frequency.setValueAtTime(0.05, audioContext.currentTime);

  // Create a GainNode to boost the lowpassLFO from [-1, 1] to [-5, 5]...
  const lowpassLFOGain = audioContext.createGain();
  lowpassLFOGain.gain.setValueAtTime(4, audioContext.currentTime);

  // Connect and start everything...
  lowpassLFO.connect(lowpassLFOGain);
  lowpassLFOGain.connect(lowpass.frequency);

  lowpassLFO.start();

  noise.connect(highpass);
  highpass.connect(lowpass);

  return lowpass;
}

export class BrownNoise {
  constructor() {
    this.audioContext = null;
    this.volume = null;
  }

  async play() {
    const audioContext = (this.audioContext = new AudioContext());

    // Load the base white noise generator...
    await audioContext.audioWorklet.addModule(new URL('./src/white-noise-generator.js', location.origin));

    // Create separate left and right brown noise channels...
    const leftBrownNoise = createBrownNoise(audioContext);
    const leftChannel = audioContext.createChannelSplitter(2);

    const rightBrownNoise = createBrownNoise(audioContext);
    const rightChannel = audioContext.createChannelSplitter(2);

    // Create a channel merger to combine the left and right channels into stereo...
    const merger = audioContext.createChannelMerger();

    // Create a GainNode to control the output volume...
    const volume = this.volume = audioContext.createGain();
    volume.gain.setValueAtTime(0, audioContext.currentTime);
    volume.gain.linearRampToValueAtTime(5, audioContext.currentTime + RAMP_SECONDS);

    // Connect all the nodes together...
    leftBrownNoise.connect(leftChannel);
    leftChannel.connect(merger, 0, 0);

    rightBrownNoise.connect(rightChannel);
    rightChannel.connect(merger, 0, 1);

    merger.connect(volume);
    volume.connect(audioContext.destination);
  }

  stop() {
    this.volume.gain.setValueAtTime(5, this.audioContext.currentTime);
    this.volume.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + RAMP_SECONDS);

    setTimeout(() => {
      this.audioContext.close();
      this.audioContext = null;
      this.volume = null;
    }, (RAMP_SECONDS + 1) * 1000);
  }
}
