// Types for musical concepts

export type MusicMode = "normal" | "woodpecker";

export type Scale =
  | "major"
  | "minor"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "locrian"
  | "pentatonicMajor"
  | "pentatonicMinor"
  | "wholeTone";

export interface Note {
  name: string; // Note name (C, C#, etc.)
  octave: number; // Octave number (0-8)
  midiNumber: number; // MIDI note number
  velocity: number; // How hard the note is played (0-127)
  duration: number; // Duration in milliseconds
}

export interface WoodpeckerPattern {
  type: "high" | "mid" | "low"; // Pitch range type
  baseNote: number; // Base MIDI note for this woodpecker
  rhythm: number[]; // Pattern of note durations in ms
  pausePattern: number[]; // Pattern of pause durations in ms
  velocity: number; // Consistent velocity for this woodpecker type
}

export interface Pedal {
  type: "sustain" | "soft" | "sostenuto";
  value: number; // 0-1 range for pedal depth
}

// Weather information
export interface WeatherData {
  temperature: number; // Temperature in Celsius
  weatherCode: number; // Weather code (see open-meteo API docs)
  weatherDescription: string; // Text description of weather
}

// Types for MIDI events
export type MidiEvent =
  | { type: "note"; note: Note; currentKey: string; currentScale: Scale }
  | { type: "chord"; notes: Note[]; currentKey: string; currentScale: Scale }
  | {
      type: "counterpoint";
      notes: Note[];
      currentKey: string;
      currentScale: Scale;
    }
  | { type: "pedal"; pedal: Pedal }
  | { type: "silence"; duration: number }
  | { type: "woodpecker"; note: Note; woodpeckerType: "high" | "mid" | "low" }
  | { type: "allNotesOff" };

// Extended MIDI for disklavier
export interface XPMidiParams {
  // XP MIDI parameters specific to Enspire Pro disklavier system
  attack?: number; // Attack time
  release?: number; // Release time
  brightness?: number; // Tone color/brightness
}
