import { MidiEvent, Note, Scale, Pedal, WeatherData, JungleAnimal } from "../shared/types";

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

// Jungle Symphony mode state
let jungleSymphonyMode = false;
let lastAnimalChangeTime = Date.now();
let currentDominantAnimal: JungleAnimal = "bird";

// Jungle animal characteristics
const JUNGLE_ANIMALS: Record<JungleAnimal, {
  octaveRange: { min: number; max: number };
  velocityRange: { min: number; max: number };
  durationRange: { min: number; max: number };
  density: number;
  preferredScales: Scale[];
  notesPerEvent: { min: number; max: number };
  rhythmPattern?: number[]; // relative timing multipliers
}> = {
  bird: {
    octaveRange: { min: 5, max: 7 },
    velocityRange: { min: 80, max: 120 },
    durationRange: { min: 150, max: 800 },
    density: 0.8,
    preferredScales: ["pentatonicMajor", "major", "mixolydian"],
    notesPerEvent: { min: 1, max: 4 },
    rhythmPattern: [1, 0.5, 0.5, 1, 0.25, 0.25, 0.25, 0.25],
  },
  monkey: {
    octaveRange: { min: 4, max: 6 },
    velocityRange: { min: 60, max: 100 },
    durationRange: { min: 200, max: 600 },
    density: 0.7,
    preferredScales: ["pentatonicMinor", "minor", "dorian"],
    notesPerEvent: { min: 2, max: 5 },
    rhythmPattern: [0.5, 0.5, 0.25, 0.75, 0.5, 0.5],
  },
  tiger: {
    octaveRange: { min: 1, max: 3 },
    velocityRange: { min: 90, max: 127 },
    durationRange: { min: 800, max: 2500 },
    density: 0.3,
    preferredScales: ["minor", "phrygian", "locrian"],
    notesPerEvent: { min: 1, max: 2 },
    rhythmPattern: [2, 1, 2, 3],
  },
  elephant: {
    octaveRange: { min: 0, max: 2 },
    velocityRange: { min: 70, max: 110 },
    durationRange: { min: 1200, max: 4000 },
    density: 0.2,
    preferredScales: ["minor", "dorian", "pentatonicMinor"],
    notesPerEvent: { min: 1, max: 3 },
    rhythmPattern: [4, 2, 4, 6],
  },
  frog: {
    octaveRange: { min: 3, max: 5 },
    velocityRange: { min: 50, max: 90 },
    durationRange: { min: 300, max: 700 },
    density: 0.6,
    preferredScales: ["pentatonicMinor", "minor", "wholeTone"],
    notesPerEvent: { min: 1, max: 2 },
    rhythmPattern: [0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5],
  },
  insect: {
    octaveRange: { min: 6, max: 8 },
    velocityRange: { min: 30, max: 70 },
    durationRange: { min: 100, max: 2000 },
    density: 0.9,
    preferredScales: ["wholeTone", "lydian", "major"],
    notesPerEvent: { min: 1, max: 3 },
    rhythmPattern: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
  },
};

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

// Function to enable jungle symphony mode
export function enableJungleSymphony(): void {
  jungleSymphonyMode = true;
  // Start with a nature-friendly scale
  currentScale = "pentatonicMinor";
  currentKey = 5; // F
  lastAnimalChangeTime = Date.now();
  currentDominantAnimal = "bird";
  console.log("Jungle Symphony mode enabled! 🦜🐒🐅🐘🐸🦗");
}

// Function to disable jungle symphony mode
export function disableJungleSymphony(): void {
  jungleSymphonyMode = false;
  // Reset to default musical parameters
  currentScale = "major";
  currentKey = Math.floor(Math.random() * 12);
  console.log("Jungle Symphony mode disabled. Returning to normal mode.");
}

// Function to check if jungle symphony mode is active
export function isJungleSymphonyActive(): boolean {
  return jungleSymphonyMode;
}

// Change the dominant animal periodically in jungle mode
function maybeChangeDominantAnimal(): void {
  if (!jungleSymphonyMode) return;
  
  const now = Date.now();
  
  // Change dominant animal every 30-90 seconds
  if (now - lastAnimalChangeTime > (30 + Math.random() * 60) * 1000) {
    const animals: JungleAnimal[] = ["bird", "monkey", "tiger", "elephant", "frog", "insect"];
    const newAnimal = animals[Math.floor(Math.random() * animals.length)];
    currentDominantAnimal = newAnimal;
    
    // Adapt scale to the new dominant animal
    const animalConfig = JUNGLE_ANIMALS[newAnimal];
    if (animalConfig.preferredScales.length > 0) {
      currentScale = animalConfig.preferredScales[Math.floor(Math.random() * animalConfig.preferredScales.length)];
    }
    
    lastAnimalChangeTime = now;
  }
}

// Generate animal-specific notes
function generateAnimalSound(animal: JungleAnimal): Note[] {
  const config = JUNGLE_ANIMALS[animal];
  const scaleNotes = getScaleNotes();
  const notes: Note[] = [];
  
  const numNotes = Math.floor(Math.random() * (config.notesPerEvent.max - config.notesPerEvent.min + 1)) + config.notesPerEvent.min;
  
  for (let i = 0; i < numNotes; i++) {
    const noteIndex = Math.floor(Math.random() * scaleNotes.length);
    const note = scaleNotes[noteIndex];
    
    // Animal-specific octave
    const octave = Math.floor(Math.random() * (config.octaveRange.max - config.octaveRange.min + 1)) + config.octaveRange.min;
    const midiNum = note + octave * 12 + 12;
    
    // Animal-specific velocity
    const velocity = Math.floor(Math.random() * (config.velocityRange.max - config.velocityRange.min + 1)) + config.velocityRange.min;
    
    // Animal-specific duration
    const duration = Math.random() * (config.durationRange.max - config.durationRange.min) + config.durationRange.min;
    
    notes.push({
      name: NOTES[note],
      octave,
      midiNumber: midiNum,
      velocity,
      duration,
    });
  }
  
  return notes;
}

// Generate jungle symphony event
function generateJungleEvent(): MidiEvent {
  // Randomly choose an animal, with bias toward the current dominant animal
  const animals: JungleAnimal[] = ["bird", "monkey", "tiger", "elephant", "frog", "insect"];
  let chosenAnimal: JungleAnimal;
  
  if (Math.random() < 0.5) {
    // 50% chance to use dominant animal
    chosenAnimal = currentDominantAnimal;
  } else {
    // 50% chance to use any animal, but still weighted
    const weights = animals.map(animal => {
      const config = JUNGLE_ANIMALS[animal];
      return config.density;
    });
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    chosenAnimal = animals[0]; // fallback
    for (let i = 0; i < animals.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        chosenAnimal = animals[i];
        break;
      }
    }
  }
  
  // Check if this animal should make a sound based on its density
  const config = JUNGLE_ANIMALS[chosenAnimal];
  if (Math.random() > config.density) {
    return {
      type: "silence",
      duration: Math.random() * 500 + 100,
    };
  }
  
  // Generate the animal sound
  const animalNotes = generateAnimalSound(chosenAnimal);
  
  return {
    type: "jungle-animal",
    animal: chosenAnimal,
    notes: animalNotes,
    currentKey: NOTES[currentKey],
    currentScale,
  };
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
  maybeChangeMusicalContext();
  
  // If jungle symphony mode is active, handle it differently
  if (jungleSymphonyMode) {
    maybeChangeDominantAnimal();
    return generateJungleEvent();
  }

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
