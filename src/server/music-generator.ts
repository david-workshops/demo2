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

// Apply weather influence to music parameters
function applyWeatherInfluence(weather: WeatherData | null) {
  // Reset to defaults if no weather data
  if (!weather) {
    density = defaultSettings.density;
    return defaultSettings;
  }

  // Create settings object with defaults
  const settings = { ...defaultSettings };

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

// Elevator music settings - calming, predictable, and pleasant
const elevatorMusicSettings = {
  tempo: 70, // Slower tempo for calming effect
  density: 0.6, // Slightly less dense for clarity
  minOctave: 3, // Mid-range register for pleasant sound
  maxOctave: 6, // Not too high to avoid shrillness
  sustainProbability: 0.2, // More sustain for smoothness
  velocityRange: { min: 45, max: 75 }, // Softer dynamics
  noteDurationRange: { min: 800, max: 3200 }, // Longer notes for smoothness
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
  elevatorMode: boolean = false,
): MidiEvent {
  // If elevator mode is enabled, use the elevator music generator
  if (elevatorMode) {
    return generateElevatorMusicEvent();
  }
  _noteCounter++;
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

  // Decide between note, chord, or counterpoint
  const eventType = Math.random();

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

// Helper function to generate a random note with elevator music settings
function generateElevatorNote(): Note {
  // Force major scale for positive, calming feel
  const elevatorScale = "major";
  const scaleNotes = SCALES[elevatorScale].map(
    (interval) => (currentKey + interval) % 12,
  );
  const noteIndex = Math.floor(Math.random() * scaleNotes.length);
  const note = scaleNotes[noteIndex];

  // Use elevator music octave range
  const octave =
    Math.floor(
      Math.random() *
        (elevatorMusicSettings.maxOctave - elevatorMusicSettings.minOctave + 1),
    ) + elevatorMusicSettings.minOctave;
  const midiNum = note + octave * 12 + 12; // MIDI note numbers start at C0 = 12

  // Softer velocity for calm effect
  const velocity =
    Math.floor(
      Math.random() *
        (elevatorMusicSettings.velocityRange.max -
          elevatorMusicSettings.velocityRange.min +
          1),
    ) + elevatorMusicSettings.velocityRange.min;

  // Longer duration for smoothness
  const duration =
    Math.random() *
      (elevatorMusicSettings.noteDurationRange.max -
        elevatorMusicSettings.noteDurationRange.min) +
    elevatorMusicSettings.noteDurationRange.min;

  return {
    name: NOTES[note],
    octave,
    midiNumber: midiNum,
    velocity,
    duration,
  };
}

// Helper function to generate elevator chord
function generateElevatorChord(numNotes = 3): Note[] {
  // Force major scale for positive feeling
  const elevatorScale = "major";
  const scaleNotes = SCALES[elevatorScale].map(
    (interval) => (currentKey + interval) % 12,
  );
  const rootIndex = Math.floor(Math.random() * scaleNotes.length);
  const rootNote = scaleNotes[rootIndex];

  const chordNotes: Note[] = [];

  // Root octave in middle register
  const rootOctave =
    Math.floor(Math.random() * 2) +
    Math.max(3, elevatorMusicSettings.minOctave);

  // Softer velocity for calm effect
  const rootVelocity =
    Math.floor(Math.random() * 20) + elevatorMusicSettings.velocityRange.min;
  const rootDuration =
    Math.random() *
      (elevatorMusicSettings.noteDurationRange.max -
        elevatorMusicSettings.noteDurationRange.min) +
    elevatorMusicSettings.noteDurationRange.min;

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
        Math.floor(Math.random() * 15) +
        Math.max(30, elevatorMusicSettings.velocityRange.min - 15),
      duration: chordNotes[0].duration * (0.9 + Math.random() * 0.2), // Slight variation from root
    });
  }

  return chordNotes;
}

// Helper function to decide pedal usage for elevator music
function decideElevatorPedal(): Pedal | null {
  const rand = Math.random();

  // Higher probability of sustain pedal for smoothness
  if (rand < elevatorMusicSettings.sustainProbability) {
    return { type: "sustain", value: Math.random() * 0.4 + 0.6 }; // 0.6-1.0 for more sustain
  } else if (rand < elevatorMusicSettings.sustainProbability * 1.5) {
    return { type: "soft", value: Math.random() * 0.5 + 0.5 }; // 0.5-1.0 for softer sound
  }

  return null;
}

// Main function to generate elevator music events
export function generateElevatorMusicEvent(): MidiEvent {
  _noteCounter++;

  // Ensure we stay in major scale for positive feeling
  if (currentScale !== "major") {
    currentScale = "major";
  }

  // Occasionally change key, but less frequently than regular music
  const now = Date.now();
  if (now - lastModeChangeTime > 5 * 60 * 1000 && Math.random() < 0.005) {
    // Even less frequent key changes (5+ minutes)
    currentKey = Math.floor(Math.random() * 12);
    lastModeChangeTime = now;
  }

  // Introduce silence based on elevator music density
  if (Math.random() > elevatorMusicSettings.density) {
    return {
      type: "silence",
      duration: Math.random() * 600 + 200, // 200-800ms of silence
    };
  }

  // Occasionally use pedals for smoothness
  const pedal = decideElevatorPedal();
  if (pedal) {
    return {
      type: "pedal",
      pedal,
    };
  }

  // Decide between note and chord (simpler than regular music, no counterpoint)
  const eventType = Math.random();

  if (eventType < 0.6) {
    // Generate a single note (slightly more likely for clarity)
    return {
      type: "note",
      note: generateElevatorNote(),
      currentKey: NOTES[currentKey],
      currentScale: "major",
    };
  } else {
    // Generate a chord (smaller chords for elevator music)
    const chordSize = Math.floor(Math.random() * 2) + 3; // 3-4 notes (smaller than regular)
    return {
      type: "chord",
      notes: generateElevatorChord(chordSize),
      currentKey: NOTES[currentKey],
      currentScale: "major",
    };
  }
}
