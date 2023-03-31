function rand(max, min) {
  return Math.random() * (max - min) + min;
}

class WhiteNoiseGenerator extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0];
    for (let i = 0; i < channel.length; i++) {
      channel[i] = rand(1, -1);
    }
    return true;
  }
}

registerProcessor("white-noise-generator", WhiteNoiseGenerator);
