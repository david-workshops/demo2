/**
 * SF Street Sounds Module
 * Generates environmental street sounds using Web Audio API
 * Including horns, wind, sirens, rustling leaves, and brake screeches
 */

export interface StreetSoundConfig {
  enabled: boolean;
  volume: number; // 0-1
  weatherInfluenced: boolean;
}

export class StreetSounds {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private config: StreetSoundConfig;
  private activeSounds: Map<string, { source: AudioNode; gain: GainNode }>;
  private soundInterval: number | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    
    // Create master gain node for street sounds
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = 0.3; // Lower volume than piano
    this.masterGain.connect(audioContext.destination);
    
    this.config = {
      enabled: false,
      volume: 0.3,
      weatherInfluenced: true
    };
    
    this.activeSounds = new Map();
  }

  /**
   * Start street sounds generation
   */
  start(): void {
    if (this.soundInterval) return;
    
    this.config.enabled = true;
    
    // Generate random street sounds every 3-8 seconds
    const scheduleNextSound = () => {
      const delay = 3000 + Math.random() * 5000; // 3-8 seconds
      this.soundInterval = window.setTimeout(() => {
        if (this.config.enabled) {
          this.generateRandomStreetSound();
          scheduleNextSound();
        }
      }, delay);
    };
    
    scheduleNextSound();
  }

  /**
   * Stop street sounds generation
   */
  stop(): void {
    this.config.enabled = false;
    
    if (this.soundInterval) {
      clearTimeout(this.soundInterval);
      this.soundInterval = null;
    }
    
    // Stop all active sounds
    this.activeSounds.forEach(({ source, gain }) => {
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
      setTimeout(() => {
        if (source instanceof AudioScheduledSourceNode) {
          source.stop();
        }
      }, 200);
    });
    this.activeSounds.clear();
  }

  /**
   * Set volume for street sounds
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.value = this.config.volume;
  }

  /**
   * Enable/disable weather influence
   */
  setWeatherInfluence(enabled: boolean): void {
    this.config.weatherInfluenced = enabled;
  }

  /**
   * Generate a random street sound based on probabilities
   */
  private generateRandomStreetSound(): void {
    const rand = Math.random();
    
    if (rand < 0.25) {
      this.playHornSound();
    } else if (rand < 0.45) {
      this.playWindSound();
    } else if (rand < 0.6) {
      this.playSirenSound();
    } else if (rand < 0.8) {
      this.playRustlingLeavesSound();
    } else {
      this.playBrakeScreechSound();
    }
  }

  /**
   * Generate horn sound using low frequency oscillators
   */
  private playHornSound(): void {
    const now = this.audioContext.currentTime;
    const duration = 0.8 + Math.random() * 0.7; // 0.8-1.5 seconds
    
    // Create oscillator for horn
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    // Horn typically around 200-400Hz
    const frequency = 200 + Math.random() * 200;
    oscillator.frequency.value = frequency;
    oscillator.type = 'sawtooth';
    
    // Horn envelope: quick attack, sustained, quick release
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.setValueAtTime(0.4, now + duration - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    this.activeSounds.set('horn-' + Date.now(), { source: oscillator, gain });
    
    // Cleanup
    setTimeout(() => {
      this.activeSounds.delete('horn-' + Date.now());
    }, duration * 1000 + 100);
  }

  /**
   * Generate wind sound using filtered white noise
   */
  private playWindSound(): void {
    const now = this.audioContext.currentTime;
    const duration = 2 + Math.random() * 3; // 2-5 seconds
    
    // Create noise buffer
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = buffer;
    
    // Low-pass filter for wind-like sound
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300 + Math.random() * 200; // 300-500Hz
    filter.Q.value = 1;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
    gain.gain.setValueAtTime(0.15, now + duration - 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noiseSource.start(now);
    
    this.activeSounds.set('wind-' + Date.now(), { source: noiseSource, gain });
    
    // Cleanup
    setTimeout(() => {
      this.activeSounds.delete('wind-' + Date.now());
    }, duration * 1000 + 100);
  }

  /**
   * Generate siren sound using frequency sweep oscillators
   */
  private playSirenSound(): void {
    const now = this.audioContext.currentTime;
    const duration = 1.5 + Math.random() * 1; // 1.5-2.5 seconds
    
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    // Siren sweep from low to high frequency
    const startFreq = 400 + Math.random() * 200; // 400-600Hz
    const endFreq = startFreq + 400 + Math.random() * 200; // +400-600Hz higher
    
    oscillator.frequency.setValueAtTime(startFreq, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration / 2);
    oscillator.frequency.exponentialRampToValueAtTime(startFreq, now + duration);
    
    oscillator.type = 'sine';
    
    // Siren envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gain.gain.setValueAtTime(0.25, now + duration - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    this.activeSounds.set('siren-' + Date.now(), { source: oscillator, gain });
    
    // Cleanup
    setTimeout(() => {
      this.activeSounds.delete('siren-' + Date.now());
    }, duration * 1000 + 100);
  }

  /**
   * Generate rustling leaves sound using high frequency filtered noise
   */
  private playRustlingLeavesSound(): void {
    const now = this.audioContext.currentTime;
    const duration = 1 + Math.random() * 2; // 1-3 seconds
    
    // Create noise buffer
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = buffer;
    
    // High-pass filter for rustling sound
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000 + Math.random() * 1000; // 2-3kHz
    filter.Q.value = 2;
    
    // Additional bandpass for leaves character
    const filter2 = this.audioContext.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.value = 4000 + Math.random() * 2000; // 4-6kHz
    filter2.Q.value = 3;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.2);
    gain.gain.setValueAtTime(0.08, now + duration - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    noiseSource.connect(filter);
    filter.connect(filter2);
    filter2.connect(gain);
    gain.connect(this.masterGain);
    
    noiseSource.start(now);
    
    this.activeSounds.set('leaves-' + Date.now(), { source: noiseSource, gain });
    
    // Cleanup
    setTimeout(() => {
      this.activeSounds.delete('leaves-' + Date.now());
    }, duration * 1000 + 100);
  }

  /**
   * Generate brake screech sound using harsh high frequency oscillators
   */
  private playBrakeScreechSound(): void {
    const now = this.audioContext.currentTime;
    const duration = 0.5 + Math.random() * 0.8; // 0.5-1.3 seconds
    
    // Create multiple oscillators for harsh sound
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    
    for (let i = 0; i < 3; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      // High frequency range with slight detuning
      const baseFreq = 1500 + Math.random() * 1000; // 1.5-2.5kHz
      osc.frequency.value = baseFreq + (i * 50); // Slight detuning
      osc.type = 'sawtooth';
      
      // Harsh envelope with quick decay
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15 / (i + 1), now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      oscillators.push(osc);
      gains.push(gain);
    }
    
    // Start all oscillators
    oscillators.forEach(osc => {
      osc.start(now);
      osc.stop(now + duration);
    });
    
    this.activeSounds.set('screech-' + Date.now(), { 
      source: oscillators[0], 
      gain: gains[0] 
    });
    
    // Cleanup
    setTimeout(() => {
      this.activeSounds.delete('screech-' + Date.now());
    }, duration * 1000 + 100);
  }

  /**
   * Trigger street sounds based on weather conditions
   */
  triggerWeatherInfluencedSound(weatherCode: number, temperature: number): void {
    if (!this.config.enabled || !this.config.weatherInfluenced) return;
    
    // Rain/storm conditions - more frequent sounds
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode)) {
      // More sirens and brake sounds in stormy weather
      if (Math.random() < 0.3) {
        this.playSirenSound();
      } else if (Math.random() < 0.4) {
        this.playBrakeScreechSound();
      }
    }
    
    // Windy conditions (based on weather code approximation)
    if ([2, 3, 45, 48].includes(weatherCode) || temperature < 5) {
      // More wind and rustling sounds
      if (Math.random() < 0.6) {
        this.playWindSound();
      } else if (Math.random() < 0.3) {
        this.playRustlingLeavesSound();
      }
    }
    
    // Normal conditions - occasional horn sounds
    if ([0, 1].includes(weatherCode)) {
      if (Math.random() < 0.2) {
        this.playHornSound();
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): StreetSoundConfig {
    return { ...this.config };
  }
}