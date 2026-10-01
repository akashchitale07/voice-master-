/**
 * Audio / WAV generation utilities for Hindi Voice Studio
 */

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Creates a valid RIFF 16-bit PCM WAV Blob from Float32Array channel data.
 */
export function audioBufferToWavBlob(
  audioBuffer: AudioBuffer | { sampleRate: number; channelData: Float32Array }
): Blob {
  const sampleRate = audioBuffer.sampleRate;
  const channelData =
    'getChannelData' in audioBuffer
      ? audioBuffer.getChannelData(0)
      : audioBuffer.channelData;
  const numSamples = channelData.length;

  const headerLength = 44;
  const dataByteLength = numSamples * 2; // 16-bit mono = 2 bytes per sample
  const buffer = new ArrayBuffer(headerLength + dataByteLength);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Write PCM samples (convert Float32 [-1, 1] to Int16 [-32768, 32767])
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Generates an acoustic speech-cadence WAV preview for Hindi text offline
 * using harmonic formant synthesis when no cloud key is available.
 */
export function generateSyntheticHindiWav(
  text: string,
  speed: number = 1.0,
  pitchMultiplier: number = 1.0
): Blob {
  const sampleRate = 22050;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  // Estimate ~0.4s per word adjusted by speed
  const durationSec = Math.max(1.5, Math.min(60, (wordCount * 0.45) / speed));
  const numSamples = Math.floor(sampleRate * durationSec);
  const channelData = new Float32Array(numSamples);

  const baseFreq = 160 * pitchMultiplier; // Hindi fundamental vocal frequency (~160Hz)

  // Modulated harmonic sound with natural speech cadence and pauses
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Word cadence envelope
    const wordPhase = (t * speed * 2.2) % 1;
    const syllableEnv = Math.sin(wordPhase * Math.PI);
    
    // Natural pitch inflection
    const f0 = baseFreq * (1 + 0.08 * Math.sin(t * 3.5));
    
    // Vocal tract formants (F1, F2, F3) for Hindi vowel space
    const f1 = 600 * pitchMultiplier;
    const f2 = 1400 * pitchMultiplier;
    const f3 = 2400;

    const fundamental = Math.sin(2 * Math.PI * f0 * t);
    const harmonic1 = 0.5 * Math.sin(2 * Math.PI * f1 * t);
    const harmonic2 = 0.3 * Math.sin(2 * Math.PI * f2 * t);
    const harmonic3 = 0.15 * Math.sin(2 * Math.PI * f3 * t);

    // Combine with soft envelope
    const rawVoice = (fundamental + harmonic1 + harmonic2 + harmonic3) * 0.25;
    const sample = rawVoice * Math.max(0, syllableEnv);

    channelData[i] = sample;
  }

  return audioBufferToWavBlob({ sampleRate, channelData });
}
