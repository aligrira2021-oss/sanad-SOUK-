/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    // Standard and vendor prefixed support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioContextClass();
  }
  
  // Resume if suspended by browser auto-play policies
  if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(err => console.warn('Failed to resume AudioContext:', err));
  }
  
  return sharedAudioContext!;
}

/**
 * Play a welcoming ascending chime for log-in and account creation
 */
export function playLoginSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Smooth, warm synthesizer
    // Pentatonic scale (C4 - E4 - G4 - C5 - E5)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.08;
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Warm, glass-like triangle wave
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Soft entrance, gentle decay
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.18, startTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.95);
    });
  } catch (err) {
    console.warn('Audio feedback blocked by user agent:', err);
  }
}

/**
 * Play a custom listing tone based on package category: royal (VIP), bronze, or free
 */
export function playListingSound(packageType: 'royal' | 'bronze' | 'free' | string): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const type = packageType ? packageType.toLowerCase() : 'free';
    
    if (type === 'royal' || type === 'vip') {
      // Celestial luxury chime (D4 -> F#4 -> A4 -> C#5 -> E5 -> A5)
      const frequencies = [293.66, 369.99, 440.00, 554.37, 659.25, 880.00];
      
      // Multi-tap celestial echoes
      frequencies.forEach((freq, idx) => {
        const startTime = now + idx * 0.12;
        
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Sine wave for clean purity
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        // Add subtle vibrato
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.linearRampToValueAtTime(freq + 4, startTime + 0.1);
        osc.frequency.linearRampToValueAtTime(freq - 4, startTime + 0.3);
        
        // Parallel triangle oscillator for rich golden tone
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(freq * 0.5, startTime); // sub-octave warmth
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.14, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);
        
        osc.connect(gainNode);
        subOsc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        subOsc.start(startTime);
        osc.stop(startTime + 1.9);
        subOsc.stop(startTime + 1.9);
      });
      
    } else if (type === 'bronze') {
      // Majestic, warm bronze arpeggio (C4 -> G4 -> C5 -> E5)
      const frequencies = [261.63, 392.00, 523.25, 659.25];
      
      frequencies.forEach((freq, idx) => {
        const startTime = now + idx * 0.14;
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Triangle wave for warm metal feel
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 1.3);
      });
      
    } else {
      // Standard Free Ad Confirmation Bell (Whistle ding)
      const frequencies = [523.25, 783.99]; // (C5 -> G5)
      
      frequencies.forEach((freq, idx) => {
        const startTime = now + idx * 0.08;
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 0.65);
      });
    }
  } catch (err) {
    console.warn('Listing audio feedback blocked:', err);
  }
}

/**
 * Helper to synthesize realistic clapping sound using bandpassed white noise
 */
function createSyntheticClap(ctx: AudioContext, time: number) {
  // Let's create a small buffer of white noise
  const bufferSize = ctx.sampleRate * 0.15; // 150ms clap
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Fill with random noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  // Noise source
  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;
  
  // BPF around 1200Hz represents human palm acoustics
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  filter.Q.value = 2.5;
  
  const gainNode = ctx.createGain();
  
  // Rapid burst decay (Clap envelope)
  gainNode.gain.setValueAtTime(0, time);
  gainNode.gain.linearRampToValueAtTime(0.25, time + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(0.005, time + 0.08);
  gainNode.gain.setValueAtTime(0, time + 0.09);
  
  noiseNode.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  noiseNode.start(time);
  noiseNode.stop(time + 0.15);
}

/**
 * Play a light applause / clapping sequence and premium chord for package subscriptions
 */
export function playSubscriptionClapSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Triumphant, rich luxury subscription chord sequence (C4 -> E4 -> G4 -> B4 -> D5)
    const chord = [261.63, 329.63, 392.00, 493.88, 587.33];
    
    // Play warm background chord
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 2.6);
    });
    
    // Elegant, rhythmic double-clap series (Fast professional clapping bursts)
    const clapTimes = [0, 0.12, 0.25, 0.38, 0.52, 0.70, 0.88, 1.05, 1.25, 1.45, 1.65, 1.85];
    clapTimes.forEach((delay) => {
      // Dual layer left/right spatial emulation using randomized offset
      createSyntheticClap(ctx, now + delay + (Math.random() * 0.02 - 0.01));
      createSyntheticClap(ctx, now + delay + (Math.random() * 0.03));
    });
    
  } catch (err) {
    console.warn('Subscription clapping audio blocked:', err);
  }
}
