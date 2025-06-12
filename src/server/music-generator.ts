import { MidiEvent, Note, Scale, Pedal, WeatherData } from "../shared/types";

// Music theory constants
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SCALES: Record<Scale, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  pentatonicMajor: [0, 2, 4, 7, 9],
  pentatonicMinor: [0, 3, 5, 7, 10],
  wholeTone: [0, 2, 4, 6, 8, 10],
};

// State variables
let currentKey = Math.floor(Math.random() * 12); // 0-11 for C through B
let currentScale: Scale = "major";
let lastModeChangeTime = Date.now();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _noteCounter = 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let density = 0.7; // Probability of generating a note vs. silence

// Chopin-style composition state
let chopinStyleEnabled = true; // Enable Chopin-style composition
let chopinStartTime = Date.now(); // When Chopin composition started
let chopinCurrentPhase: "slow" | "fast" = "slow"; // Current phase
const CHOPIN_SLOW_DURATION = 60 * 1000; // 1 minute in milliseconds
const CHOPIN_FAST_DURATION = 15 * 1000; // 15 seconds in milliseconds

// Chopin-style composition management
function updateChopinPhase(): void {
  if (!chopinStyleEnabled) return;
  
  const now = Date.now();
  const elapsed = now - chopinStartTime;
  
  if (chopinCurrentPhase === "slow") {
    // Currently in slow phase, check if we should switch to fast
    if (elapsed >= CHOPIN_SLOW_DURATION) {
      chopinCurrentPhase = "fast";
      chopinStartTime = now; // Reset timer for fast phase
      // Switch to more suitable key/scale for fast section
      if (Math.random() < 0.7) {
        currentScale = "major"; // Fast sections often use major scales
      }
    }
  } else {
    // Currently in fast phase, check if we should switch to slow
    if (elapsed >= CHOPIN_FAST_DURATION) {
      chopinCurrentPhase = "slow";
      chopinStartTime = now; // Reset timer for slow phase
      // Switch to more suitable key/scale for slow section
      if (Math.random() < 0.8) {
        currentScale = "minor"; // Slow sections often use minor scales
        // Occasionally change key for variety
        if (Math.random() < 0.3) {
          currentKey = Math.floor(Math.random() * 12);
        }
      }
    }
  }
}

// Get Chopin-style musical settings based on current phase
function getChopinSettings() {
  if (chopinCurrentPhase === "slow") {
    // Slow, romantic Chopin style (like Nocturnes)
    return {
      tempo: 60, // Much slower tempo
      density: 0.4, // More sparse, contemplative
      minOctave: 2,
      maxOctave: 6,
      velocityRange: { min: 35, max: 85 }, // Softer dynamics
      noteDurationRange: { min: 1200, max: 4000 }, // Longer, sustained notes
      sustainProbability: 0.25, // Heavy pedal use for romantic sound
      chordProbability: 0.3, // More chords for harmonic richness
      arpeggioChance: 0.15, // Occasional arpeggiated chords
    };
  } else {
    // Fast, virtuosic Chopin style (like Etudes)
    return {
      tempo: 140, // Much faster tempo
      density: 0.85, // More notes, technical passages
      minOctave: 3,
      maxOctave: 7,
      velocityRange: { min: 70, max: 115 }, // Brighter, more dynamic
      noteDurationRange: { min: 200, max: 800 }, // Shorter, more articulated notes
      sustainProbability: 0.05, // Less pedal for clarity
      chordProbability: 0.15, // Fewer chords, more single notes
      arpeggioChance: 0.25, // More arpeggios for virtuosic effect
    };
  }
}

// Apply weather influence to music parameters
function applyWeatherInfluence(weather: WeatherData | null) {
  // Get Chopin-style settings first if enabled
  const chopinSettings = chopinStyleEnabled ? getChopinSettings() : null;
  
  // Reset to defaults if no weather data
  if (!weather) {
    const settings = chopinSettings || defaultSettings;
    density = settings.density;
    return settings;
  }

  // Create settings object with Chopin style as base if enabled, otherwise defaults
  const settings = chopinSettings ? { ...chopinSettings } : { ...defaultSettings };

  // If using Chopin style, apply weather as subtle modifications rather than overrides
  if (chopinStyleEnabled) {
    // Weather provides subtle variations to the Chopin style rather than dramatic changes
    
    // Subtle temperature modifications
    if (weather.temperature < 0) {
      // Very cold: slightly slower, slightly softer
      settings.tempo = Math.max(40, settings.tempo - 15);
      settings.velocityRange.min = Math.max(20, settings.velocityRange.min - 10);
      settings.velocityRange.max = Math.max(settings.velocityRange.min + 20, settings.velocityRange.max - 10);
    } else if (weather.temperature > 30) {
      // Very hot: slightly faster, slightly brighter
      settings.tempo = Math.min(180, settings.tempo + 15);
      settings.velocityRange.min = Math.min(100, settings.velocityRange.min + 10);
      settings.velocityRange.max = Math.min(127, settings.velocityRange.max + 10);
    }

    // Subtle weather condition modifications
    const code = weather.weatherCode;
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
      // Rain: more pedal, slightly softer
      settings.sustainProbability = Math.min(0.35, settings.sustainProbability + 0.08);
      settings.velocityRange.max = Math.max(settings.velocityRange.min + 20, settings.velocityRange.max - 5);
    } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
      // Snow: gentler, more sustained
      settings.velocityRange.min = Math.max(20, settings.velocityRange.min - 5);
      settings.noteDurationRange.min = Math.min(settings.noteDurationRange.min + 200, settings.noteDurationRange.max - 100);
    }
  } else {
    // Original weather influence logic when not using Chopin style
    // Modify based on temperature
    if (weather.temperature < 0) {
      // Very cold: slower, lower register, minor scales
      settings.tempo = 70;
      settings.minOctave = 1;
      settings.maxOctave = 5;
      settings.noteDurationRange = { min: 800, max: 3500 };
      settings.velocityRange = { min: 40, max: 80 };
      if (Math.random() < 0.6 && currentScale === "major") {
        currentScale = "minor";
      }
    } else if (weather.temperature < 10) {
      // Cool: slightly slower, mid-low register
      settings.tempo = 85;
      settings.minOctave = 2;
      settings.maxOctave = 6;
      settings.noteDurationRange = { min: 600, max: 3000 };
      if (Math.random() < 0.4 && currentScale === "major") {
        currentScale = "minor";
      }
    } else if (weather.temperature > 30) {
      // Very hot: faster, higher register, brighter scales
      settings.tempo = 130;
      settings.minOctave = 3;
      settings.maxOctave = 7;
      settings.noteDurationRange = { min: 300, max: 1800 };
      settings.velocityRange = { min: 70, max: 110 };
      if (Math.random() < 0.6 && currentScale === "minor") {
        currentScale = "major";
      }
    } else if (weather.temperature > 25) {
      // Warm: slightly faster, mid-high register
      settings.tempo = 115;
      settings.minOctave = 3;
      settings.maxOctave = 7;
      settings.noteDurationRange = { min: 400, max: 2200 };
      if (Math.random() < 0.4 && currentScale === "minor") {
        currentScale = "lydian";
      }
    }

    // Modify based on weather conditions
    const code = weather.weatherCode;

    // Clear conditions (0, 1)
    if ([0, 1].includes(code)) {
      settings.density = 0.6; // Slightly sparse
      settings.sustainProbability = 0.03; // Less sustain
    }
    // Cloudy conditions (2, 3)
    else if ([2, 3].includes(code)) {
      settings.density = 0.7; // Moderate density
    }
    // Fog conditions (45, 48)
    else if ([45, 48].includes(code)) {
      settings.density = 0.5; // More sparse
      settings.sustainProbability = 0.1; // More sustain
      settings.velocityRange = { min: 40, max: 70 }; // Softer
    }
    // Rain conditions
    else if (
      [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
    ) {
      settings.sustainProbability = 0.15; // Much more sustain
      settings.noteDurationRange = { min: 200, max: 1500 }; // Shorter notes
      settings.density = 0.8; // More notes
    }
    // Snow conditions
    else if ([71, 73, 75, 77, 85, 86].includes(code)) {
      settings.tempo = Math.max(70, settings.tempo - 20); // Slower
      settings.velocityRange = { min: 30, max: 70 }; // Softer
      settings.noteDurationRange = { min: 800, max: 3000 }; // Longer notes
    }
    // Thunderstorm conditions
    else if ([95, 96, 99].includes(code)) {
      settings.velocityRange = { min: 40, max: 127 }; // Dramatic dynamics
      settings.density = 0.9; // More dense
    }
  }

  // Update global density
  density = settings.density;

  return settings;
}
// Weather influence settings
const defaultSettings = {
  tempo: 100, // Base tempo (events per minute)
  density: 0.7, // Probability of generating notes vs. silence
  minOctave: 1, // Minimum octave
  maxOctave: 7, // Maximum octave
  sustainProbability: 0.05, // Probability of using sustain pedal
  velocityRange: { min: 60, max: 100 }, // Velocity range for notes
  noteDurationRange: { min: 500, max: 2500 }, // Duration range in ms
  chordProbability: 0.2, // Probability of generating chords
  arpeggioChance: 0.1, // Probability of arpeggiated chords
};

// Helper function to get notes in the current key and scale
function getScaleNotes(): number[] {
  return SCALES[currentScale].map((interval) => (currentKey + interval) % 12);
}

// Helper function to generate a random note in the current key and scale
function generateRandomNote(
  weather: WeatherData | null,
  customOctaveRange?: { min: number; max: number },
): Note {
  const settings = applyWeatherInfluence(weather);
  const scaleNotes = getScaleNotes();
  const noteIndex = Math.floor(Math.random() * scaleNotes.length);
  const note = scaleNotes[noteIndex];

  // Use custom octave range if provided, otherwise use weather-influenced range
  const octaveRange = customOctaveRange || {
    min: settings.minOctave,
    max: settings.maxOctave,
  };

  const octave =
    Math.floor(Math.random() * (octaveRange.max - octaveRange.min + 1)) +
    octaveRange.min;
  const midiNum = note + octave * 12 + 12; // MIDI note numbers start at C0 = 12

  // Velocity influenced by weather
  const velocity =
    Math.floor(
      Math.random() *
        (settings.velocityRange.max - settings.velocityRange.min + 1),
    ) + settings.velocityRange.min;

  // Duration influenced by weather
  const duration =
    Math.random() *
      (settings.noteDurationRange.max - settings.noteDurationRange.min) +
    settings.noteDurationRange.min;

  return {
    name: NOTES[note],
    octave,
    midiNumber: midiNum,
    velocity,
    duration,
  };
}

// Function to generate Chopin-style arpeggios
function generateArpeggio(weather: WeatherData | null, numNotes = 4): Note[] {
  const settings = applyWeatherInfluence(weather);
  const scaleNotes = getScaleNotes();
  const rootIndex = Math.floor(Math.random() * scaleNotes.length);
  const rootNote = scaleNotes[rootIndex];

  const arpeggioNotes: Note[] = [];
  const baseOctave = Math.floor(Math.random() * 2) + Math.max(2, settings.minOctave);

  // Create arpeggio pattern (root, 3rd, 5th, octave, etc.)
  for (let i = 0; i < numNotes; i++) {
    const noteIndex = (rootIndex + (i * 2)) % scaleNotes.length;
    const note = scaleNotes[noteIndex];
    const octave = baseOctave + Math.floor((rootIndex + (i * 2)) / scaleNotes.length);
    
    // Stagger the timing slightly for arpeggio effect
    const baseVelocity = Math.floor(Math.random() * 20) + settings.velocityRange.min;
    const velocity = Math.min(127, baseVelocity + i * 3); // Slight crescendo
    
    // Shorter duration for arpeggio notes
    const duration = (settings.noteDurationRange.min + settings.noteDurationRange.max) / 3;

    arpeggioNotes.push({
      name: NOTES[note],
      octave: Math.min(settings.maxOctave, octave),
      midiNumber: note + Math.min(settings.maxOctave, octave) * 12 + 12,
      velocity,
      duration: duration * (0.8 + Math.random() * 0.4),
    });
  }

  return arpeggioNotes;
}

// Function to generate chords in the current key and scale
function generateChord(weather: WeatherData | null, numNotes = 3): Note[] {
  const settings = applyWeatherInfluence(weather);
  const scaleNotes = getScaleNotes();
  const rootIndex = Math.floor(Math.random() * scaleNotes.length);
  const rootNote = scaleNotes[rootIndex];

  const chordNotes: Note[] = [];

  // Adjust octave range based on weather
  const rootOctave =
    Math.floor(Math.random() * 3) + Math.max(2, settings.minOctave); // Weather-influenced octaves

  // Root note with weather-influenced velocity and duration
  const rootVelocity =
    Math.floor(Math.random() * 30) + settings.velocityRange.min;
  const rootDuration =
    Math.random() *
      (settings.noteDurationRange.max - settings.noteDurationRange.min) +
    settings.noteDurationRange.min;

  chordNotes.push({
    name: NOTES[rootNote],
    octave: rootOctave,
    midiNumber: rootNote + rootOctave * 12 + 12,
    velocity: rootVelocity,
    duration: rootDuration,
  });

  // Add other chord tones (using 3rds)
  for (let i = 1; i < numNotes; i++) {
    const nextIndex = (rootIndex + i * 2) % scaleNotes.length;
    const nextNote = scaleNotes[nextIndex];
    const nextOctave = rootOctave + (nextIndex < rootIndex ? 1 : 0);

    chordNotes.push({
      name: NOTES[nextNote],
      octave: nextOctave,
      midiNumber: nextNote + nextOctave * 12 + 12,
      velocity:
        Math.floor(Math.random() * 20) +
        Math.max(40, settings.velocityRange.min - 20),
      duration: chordNotes[0].duration * (0.8 + Math.random() * 0.4), // Slight variation from root
    });
  }

  return chordNotes;
}

// Occasionally change key, scale, or mode
function maybeChangeMusicalContext(): void {
  const now = Date.now();

  // Change approximately every 3-5 minutes
  if (now - lastModeChangeTime > 3 * 60 * 1000 && Math.random() < 0.01) {
    // 1% chance per check when we're past the minimum time
    const changeType = Math.floor(Math.random() * 3);

    if (changeType === 0) {
      // Change key
      currentKey = Math.floor(Math.random() * 12);
    } else if (changeType === 1) {
      // Change scale
      const scaleNames = Object.keys(SCALES) as Scale[];
      currentScale = scaleNames[Math.floor(Math.random() * scaleNames.length)];
    } else {
      // Change both
      currentKey = Math.floor(Math.random() * 12);
      const scaleNames = Object.keys(SCALES) as Scale[];
      currentScale = scaleNames[Math.floor(Math.random() * scaleNames.length)];
    }

    lastModeChangeTime = now;
  }
}

// Track last time sustain pedal was turned off
let lastSustainOffTime = Date.now();
let sustainPedalEnabled = true;

// Decide which pedal to use
function decidePedal(weather: WeatherData | null): Pedal | null {
  const settings = applyWeatherInfluence(weather);
  const rand = Math.random();
  const now = Date.now();

  // Ensure long periods without sustain pedal (at least 15-30 seconds)
  const timeSinceLastOff = now - lastSustainOffTime;
  if (
    !sustainPedalEnabled &&
    timeSinceLastOff > 15000 + Math.random() * 15000
  ) {
    sustainPedalEnabled = true;
  } else if (sustainPedalEnabled && Math.random() < 0.01) {
    // Occasionally disable sustain pedal for a period
    sustainPedalEnabled = false;
    lastSustainOffTime = now;
    return { type: "sustain", value: 0 }; // Turn off sustain pedal
  }

  // Weather-influenced sustain pedal probability
  if (rand < settings.sustainProbability && sustainPedalEnabled) {
    return { type: "sustain", value: Math.random() * 0.5 + 0.5 }; // 0.5-1.0
  } else if (rand < settings.sustainProbability * 2) {
    return { type: "sostenuto", value: 1 };
  } else if (rand < settings.sustainProbability * 3) {
    return { type: "soft", value: Math.random() * 0.7 + 0.3 }; // 0.3-1.0
  }

  return null;
}

// Main function to generate MIDI events
export function generateMidiEvent(
  weather: WeatherData | null = null,
): MidiEvent {
  _noteCounter++;
  
  // Update Chopin phase if enabled
  if (chopinStyleEnabled) {
    updateChopinPhase();
  }
  
  maybeChangeMusicalContext();

  const settings = applyWeatherInfluence(weather);

  // Randomly introduce silence based on density setting
  if (Math.random() > settings.density) {
    // Return a "silence" event - not an actual MIDI event, but used to
    // indicate that nothing is happening for this interval
    return {
      type: "silence",
      duration: Math.random() * 500 + 100, // 100-600ms of silence
    };
  }

  // Occasionally use pedals
  const pedal = decidePedal(weather);
  if (pedal) {
    return {
      type: "pedal",
      pedal,
    };
  }

  // Decide between note, chord, arpeggio, or counterpoint
  // Chopin style influences these probabilities
  const eventType = Math.random();
  
  if (chopinStyleEnabled) {
    // Chopin-style event generation
    const chopinSettings = getChopinSettings();
    
    if (eventType < 0.4) {
      // Generate a single note
      return {
        type: "note",
        note: generateRandomNote(weather),
        currentKey: NOTES[currentKey],
        currentScale,
      };
    } else if (eventType < 0.4 + chopinSettings.chordProbability) {
      // Generate a chord
      const chordSize = Math.floor(Math.random() * 3) + 3; // 3-5 notes
      return {
        type: "chord",
        notes: generateChord(weather, chordSize),
        currentKey: NOTES[currentKey],
        currentScale,
      };
    } else if (eventType < 0.4 + chopinSettings.chordProbability + chopinSettings.arpeggioChance) {
      // Generate an arpeggio (Chopin specialty)
      const arpeggioSize = Math.floor(Math.random() * 3) + 4; // 4-6 notes
      return {
        type: "counterpoint", // Use counterpoint type for arpeggios
        notes: generateArpeggio(weather, arpeggioSize),
        currentKey: NOTES[currentKey],
        currentScale,
      };
    } else {
      // Generate counterpoint (2-4 notes across different registers)
      const numVoices = Math.floor(Math.random() * 3) + 2; // 2-4 voices
      const notes: Note[] = [];

      for (let i = 0; i < numVoices; i++) {
        // Assign each voice to a different register, influenced by weather
        const settings = applyWeatherInfluence(weather);
        const range = Math.min(settings.maxOctave - settings.minOctave, 5);
        const segment = range / numVoices;
        const minOctave = Math.max(
          settings.minOctave,
          Math.floor(settings.minOctave + i * segment),
        );
        const maxOctave = Math.min(
          settings.maxOctave,
          Math.ceil(settings.minOctave + (i + 1) * segment),
        );

        notes.push(
          generateRandomNote(weather, { min: minOctave, max: maxOctave }),
        );
      }

      return {
        type: "counterpoint",
        notes,
        currentKey: NOTES[currentKey],
        currentScale,
      };
    }
  } else {
    // Original event generation logic
    if (eventType < 0.5) {
      // Generate a single note
      return {
        type: "note",
        note: generateRandomNote(weather),
        currentKey: NOTES[currentKey],
        currentScale,
      };
    } else if (eventType < 0.8) {
      // Generate a chord
      const chordSize = Math.floor(Math.random() * 3) + 3; // 3-5 notes
      return {
        type: "chord",
        notes: generateChord(weather, chordSize),
        currentKey: NOTES[currentKey],
        currentScale,
      };
    } else {
      // Generate counterpoint (2-4 notes across different registers)
      const numVoices = Math.floor(Math.random() * 3) + 2; // 2-4 voices
      const notes: Note[] = [];

      for (let i = 0; i < numVoices; i++) {
        // Assign each voice to a different register, influenced by weather
        const settings = applyWeatherInfluence(weather);
        const range = Math.min(settings.maxOctave - settings.minOctave, 5);
        const segment = range / numVoices;
        const minOctave = Math.max(
          settings.minOctave,
          Math.floor(settings.minOctave + i * segment),
        );
        const maxOctave = Math.min(
          settings.maxOctave,
          Math.ceil(settings.minOctave + (i + 1) * segment),
        );

        notes.push(
          generateRandomNote(weather, { min: minOctave, max: maxOctave }),
        );
      }

      return {
        type: "counterpoint",
        notes,
        currentKey: NOTES[currentKey],
        currentScale,
      };
    }
  }
}

// Export functions to control Chopin composition style
export function enableChopinStyle(): void {
  chopinStyleEnabled = true;
  chopinStartTime = Date.now();
  chopinCurrentPhase = "slow";
  // Start with minor key for Chopin style
  if (Math.random() < 0.8) {
    currentScale = "minor";
  }
}

export function disableChopinStyle(): void {
  chopinStyleEnabled = false;
}

export function isChopinStyleEnabled(): boolean {
  return chopinStyleEnabled;
}

export function getCurrentChopinPhase(): "slow" | "fast" {
  return chopinCurrentPhase;
}

export function getChopinPhaseTimeRemaining(): number {
  const elapsed = Date.now() - chopinStartTime;
  const duration = chopinCurrentPhase === "slow" ? CHOPIN_SLOW_DURATION : CHOPIN_FAST_DURATION;
  return Math.max(0, duration - elapsed);
}
