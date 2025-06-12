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
  // Chaotic scales for atmospheric chaos
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  diminished: [0, 2, 3, 5, 6, 8, 9, 11],
  augmented: [0, 3, 4, 7, 8, 11],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  doubleHarmonic: [0, 1, 4, 5, 7, 8, 11],
  hungarian: [0, 2, 3, 6, 7, 8, 11],
  byzantine: [0, 1, 4, 5, 7, 8, 11],
  oriental: [0, 1, 4, 5, 6, 9, 10],
};

// State variables
let currentKey = Math.floor(Math.random() * 12); // 0-11 for C through B
let currentScale: Scale = "major";
let lastModeChangeTime = Date.now();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _noteCounter = 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let density = 0.7; // Probability of generating a note vs. silence

// Chaos mode variables for atmospheric chaos
let chaosMode = false;
let chaosModeStartTime = Date.now();
let insectBurstMode = false;
let insectBurstStartTime = Date.now();
let hardcoreMode = false;
let hardcoreModeStartTime = Date.now();

// Chaotic scales for atmospheric chaos
const CHAOTIC_SCALES: Scale[] = [
  "chromatic",
  "diminished",
  "augmented",
  "harmonicMinor",
  "doubleHarmonic",
  "hungarian",
  "byzantine",
  "oriental",
];

// Check if we should enter chaos mode (random chance)
function maybeEnterChaosMode(): void {
  const now = Date.now();

  // 0.5% chance per check to enter chaos mode
  if (!chaosMode && Math.random() < 0.005) {
    chaosMode = true;
    chaosModeStartTime = now;
    // Switch to a chaotic scale
    currentScale =
      CHAOTIC_SCALES[Math.floor(Math.random() * CHAOTIC_SCALES.length)];
  }

  // Chaos mode lasts 30 seconds to 2 minutes
  if (chaosMode && now - chaosModeStartTime > 30000 + Math.random() * 90000) {
    chaosMode = false;
  }
}

// Check if we should enter insect burst mode
function maybeEnterInsectBurstMode(): void {
  const now = Date.now();

  // 1% chance per check to enter insect burst mode
  if (!insectBurstMode && Math.random() < 0.01) {
    insectBurstMode = true;
    insectBurstStartTime = now;
  }

  // Insect burst mode lasts 5-15 seconds
  if (
    insectBurstMode &&
    now - insectBurstStartTime > 5000 + Math.random() * 10000
  ) {
    insectBurstMode = false;
  }
}

// Check if we should enter hardcore mode
function maybeEnterHardcoreMode(): void {
  const now = Date.now();

  // 0.8% chance per check to enter hardcore mode
  if (!hardcoreMode && Math.random() < 0.008) {
    hardcoreMode = true;
    hardcoreModeStartTime = now;
  }

  // Hardcore mode lasts 20-60 seconds
  if (
    hardcoreMode &&
    now - hardcoreModeStartTime > 20000 + Math.random() * 40000
  ) {
    hardcoreMode = false;
  }
}

// Apply weather influence to music parameters
function applyWeatherInfluence(weather: WeatherData | null) {
  // Reset to defaults if no weather data
  if (!weather) {
    density = defaultSettings.density;
    return defaultSettings;
  }

  // Create settings object with defaults
  const settings = { ...defaultSettings };

  // Apply chaos mode modifications first
  if (chaosMode) {
    settings.velocityRange = { min: 20, max: 127 }; // Extreme dynamics
    settings.noteDurationRange = { min: 50, max: 4000 }; // Wild duration range
    settings.density = 0.9; // Very dense
    settings.sustainProbability = 0.2; // More sustain chaos
  }

  // Apply insect burst mode modifications
  if (insectBurstMode) {
    settings.noteDurationRange = { min: 50, max: 200 }; // Very short, staccato
    settings.density = 0.95; // Almost constant notes
    settings.velocityRange = { min: 60, max: 110 }; // Moderate but consistent
  }

  // Apply hardcore mode modifications
  if (hardcoreMode) {
    settings.tempo = 160; // Fast tempo
    settings.velocityRange = { min: 90, max: 127 }; // Loud and aggressive
    settings.noteDurationRange = { min: 100, max: 800 }; // Short, punchy notes
    settings.density = 0.85; // Dense but not overwhelming
  }

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

// Generate insect-inspired rapid burst patterns
function generateInsectBurst(weather: WeatherData | null): Note[] {
  const burstNotes: Note[] = [];
  const burstLength = Math.floor(Math.random() * 8) + 3; // 3-10 notes in burst

  // Pick a high register for insect-like sounds
  const insectOctaveRange = { min: 5, max: 7 };

  for (let i = 0; i < burstLength; i++) {
    const note = generateRandomNote(weather, insectOctaveRange);
    // Make notes very short and staccato
    note.duration = 50 + Math.random() * 100; // 50-150ms
    // Add some randomness to timing with micro-delays
    note.velocity = 60 + Math.floor(Math.random() * 40); // 60-100 velocity
    burstNotes.push(note);
  }

  return burstNotes;
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

  // In chaos mode, generate cluster chords (adjacent notes)
  if (chaosMode && Math.random() < 0.4) {
    // Generate a cluster chord with adjacent semitones
    const clusterSize = Math.floor(Math.random() * 4) + 3; // 3-6 notes
    for (let i = 1; i < clusterSize; i++) {
      const clusterNote = (rootNote + i) % 12;
      const clusterOctave = rootOctave + Math.floor((rootNote + i) / 12);

      chordNotes.push({
        name: NOTES[clusterNote],
        octave: clusterOctave,
        midiNumber: clusterNote + clusterOctave * 12 + 12,
        velocity: Math.floor(Math.random() * 40) + settings.velocityRange.min,
        duration: rootDuration * (0.7 + Math.random() * 0.6),
      });
    }
  } else {
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
  }

  return chordNotes;
}

// Occasionally change key, scale, or mode
function maybeChangeMusicalContext(): void {
  const now = Date.now();

  // More frequent changes in chaos mode
  const changeIntervalMin = chaosMode ? 30000 : 180000; // 30s vs 3min
  const changeProbability = chaosMode ? 0.05 : 0.01; // 5% vs 1%

  // Change approximately every 3-5 minutes (or faster in chaos mode)
  if (
    now - lastModeChangeTime > changeIntervalMin &&
    Math.random() < changeProbability
  ) {
    const changeType = Math.floor(Math.random() * 3);

    if (changeType === 0) {
      // Change key
      currentKey = Math.floor(Math.random() * 12);
    } else if (changeType === 1) {
      // Change scale - prefer chaotic scales in chaos mode
      const scaleNames: Scale[] = chaosMode
        ? [...CHAOTIC_SCALES, "minor", "wholeTone"]
        : (Object.keys(SCALES) as Scale[]);
      currentScale = scaleNames[Math.floor(Math.random() * scaleNames.length)];
    } else {
      // Change both
      currentKey = Math.floor(Math.random() * 12);
      const scaleNames: Scale[] = chaosMode
        ? CHAOTIC_SCALES
        : (Object.keys(SCALES) as Scale[]);
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

  // Check for mode changes
  maybeEnterChaosMode();
  maybeEnterInsectBurstMode();
  maybeEnterHardcoreMode();
  maybeChangeMusicalContext();

  const settings = applyWeatherInfluence(weather);

  // In insect burst mode, prioritize generating insect bursts
  if (insectBurstMode && Math.random() < 0.6) {
    return {
      type: "insectBurst",
      notes: generateInsectBurst(weather),
      currentKey: NOTES[currentKey],
      currentScale,
    };
  }

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

  // Decide between note, chord, or counterpoint - chaos mode affects probabilities
  const eventType = Math.random();

  if (chaosMode) {
    // In chaos mode, favor more complex structures
    if (eventType < 0.3) {
      // Generate a single note
      return {
        type: "note",
        note: generateRandomNote(weather),
        currentKey: NOTES[currentKey],
        currentScale,
      };
    } else if (eventType < 0.6) {
      // Generate a chord (often cluster chords in chaos mode)
      const chordSize = Math.floor(Math.random() * 4) + 3; // 3-6 notes
      return {
        type: "chord",
        notes: generateChord(weather, chordSize),
        currentKey: NOTES[currentKey],
        currentScale,
      };
    } else {
      // Generate counterpoint with more voices
      const numVoices = Math.floor(Math.random() * 4) + 3; // 3-6 voices
      const notes: Note[] = [];

      for (let i = 0; i < numVoices; i++) {
        // Assign each voice to a different register, influenced by weather
        const settings = applyWeatherInfluence(weather);
        const range = Math.min(settings.maxOctave - settings.minOctave, 6);
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
    // Normal mode probabilities
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
