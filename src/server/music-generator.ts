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
let currentScale: Scale = "mixolydian"; // Primary mode for SF streets
let lastModeChangeTime = Date.now();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _noteCounter = 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let density = 0.7; // Probability of generating a note vs. silence

// 12-tone serialism state
let toneRow: number[] = []; // Current 12-tone row
let toneRowIndex = 0; // Current position in the tone row
let lastToneRowResetTime = Date.now();

// SF Street sound layers state
let trafficIntensity = 0.3; // 0-1, affects density and rhythm
let conversationIntensity = 0.2; // 0-1, affects occurrence of conversation snippets
let windIntensity = 0.6; // 0-1, constant rhythmic layer
let trafficEbbTime = Date.now();
let conversationEbbTime = Date.now();

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

// 12-tone serialism functions
function generateToneRow(): number[] {
  // Create a row with all 12 chromatic tones
  const row = Array.from({ length: 12 }, (_, i) => i);
  // Shuffle using Fisher-Yates algorithm
  for (let i = row.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [row[i], row[j]] = [row[j], row[i]];
  }
  return row;
}

function getNextSerialTone(): number {
  // Reset tone row every 3-5 minutes or when completed
  const now = Date.now();
  if (toneRow.length === 0 || toneRowIndex >= 12 || 
      (now - lastToneRowResetTime > 3 * 60 * 1000 && Math.random() < 0.02)) {
    toneRow = generateToneRow();
    toneRowIndex = 0;
    lastToneRowResetTime = now;
  }
  
  const tone = toneRow[toneRowIndex];
  toneRowIndex = (toneRowIndex + 1) % 12;
  return tone;
}

// Helper function to get notes in the current key and scale
function getScaleNotes(): number[] {
  return SCALES[currentScale].map((interval) => (currentKey + interval) % 12);
}

// SF Street sound layer management
function updateStreetSoundLayers(): void {
  const now = Date.now();
  
  // Traffic ebb and flow (cycles every 2-4 minutes)
  const trafficCycle = 2.5 * 60 * 1000; // 2.5 minutes
  const trafficPhase = ((now - trafficEbbTime) % trafficCycle) / trafficCycle;
  trafficIntensity = 0.1 + 0.6 * (Math.sin(trafficPhase * Math.PI * 2) * 0.5 + 0.5);
  
  // Conversation ebb and flow (cycles every 1-3 minutes, more sporadic)
  const conversationCycle = 90 * 1000; // 1.5 minutes
  const conversationPhase = ((now - conversationEbbTime) % conversationCycle) / conversationCycle;
  conversationIntensity = Math.max(0, 0.8 * (Math.sin(conversationPhase * Math.PI * 3) * 0.5 + 0.5));
  
  // Wind is more constant but with subtle variations
  const windPhase = (now % (30 * 1000)) / (30 * 1000); // 30 second cycle
  windIntensity = 0.5 + 0.3 * Math.sin(windPhase * Math.PI * 4);
}

// Helper function to generate a random note in the current key and scale with serialism
function generateRandomNote(
  weather: WeatherData | null,
  customOctaveRange?: { min: number; max: number },
  forceSerialism = false,
): Note {
  const settings = applyWeatherInfluence(weather);
  
  let note: number;
  if (forceSerialism || Math.random() < 0.7) {
    // Use 12-tone serialism for most notes
    note = getNextSerialTone();
  } else {
    // Occasionally use scale-based notes for traditional harmony
    const scaleNotes = getScaleNotes();
    const noteIndex = Math.floor(Math.random() * scaleNotes.length);
    note = scaleNotes[noteIndex];
  }

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

// Specialized SF street sound generators
function generateTrafficSound(weather: WeatherData | null): Note[] {
  // Traffic sounds: lower register, rhythmic patterns, variable intensity
  const notes: Note[] = [];
  const numNotes = Math.floor(Math.random() * 3) + 1; // 1-3 notes
  const baseOctave = 2 + Math.floor(trafficIntensity * 2); // Octaves 2-4
  
  for (let i = 0; i < numNotes; i++) {
    const note = generateRandomNote(weather, 
      { min: baseOctave, max: baseOctave + 1 }, 
      true // Force serialism
    );
    // Adjust for traffic characteristics
    note.velocity = Math.floor(40 + trafficIntensity * 50); // 40-90 based on intensity
    note.duration = 300 + Math.random() * 800; // Short, percussive
    notes.push(note);
  }
  
  return notes;
}

function generateWindSound(weather: WeatherData | null): Note {
  // Wind: sustained, higher register, constant rhythmic element
  const note = generateRandomNote(weather, 
    { min: 5, max: 7 }, // High register
    Math.random() < 0.3 // Occasional serialism
  );
  
  // Wind characteristics
  note.velocity = Math.floor(30 + windIntensity * 40); // 30-70, softer
  note.duration = 1500 + Math.random() * 2000; // Sustained
  
  return note;
}

function generateConversationSnippet(weather: WeatherData | null): Note[] {
  // Conversation: mid register, clustered notes, muffled (softer)
  const notes: Note[] = [];
  const numNotes = Math.floor(Math.random() * 4) + 2; // 2-5 notes
  const baseNote = getNextSerialTone(); // Use serialism for conversation
  
  for (let i = 0; i < numNotes; i++) {
    // Create note clusters (close together)
    const clusteredNote = (baseNote + (i <= 1 ? i : i - 2)) % 12;
    const octave = 3 + Math.floor(Math.random() * 2); // Octaves 3-4
    
    const note: Note = {
      name: NOTES[clusteredNote],
      octave,
      midiNumber: clusteredNote + octave * 12 + 12,
      velocity: Math.floor(25 + conversationIntensity * 45), // 25-70, muffled
      duration: 200 + Math.random() * 600, // Short, speech-like
    };
    
    notes.push(note);
  }
  
  return notes;
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

// Main function to generate MIDI events for SF streets
export function generateMidiEvent(
  weather: WeatherData | null = null,
): MidiEvent {
  _noteCounter++;
  maybeChangeMusicalContext();
  updateStreetSoundLayers();

  const settings = applyWeatherInfluence(weather);

  // Adjust density based on street sound layers
  const streetDensity = settings.density * (0.7 + trafficIntensity * 0.3 + windIntensity * 0.2);
  
  // Randomly introduce silence based on street-adjusted density
  if (Math.random() > streetDensity) {
    return {
      type: "silence",
      duration: Math.random() * 500 + 100, // 100-600ms of silence
    };
  }

  // Occasionally use pedals (less frequently for street sounds)
  const pedal = decidePedal(weather);
  if (pedal && Math.random() < 0.3) { // Reduced pedal probability
    return {
      type: "pedal",
      pedal,
    };
  }

  // Determine SF street sound type based on intensities
  const soundChoice = Math.random();
  
  // Wind is constant and rhythmic (30% probability)
  if (soundChoice < 0.3 && windIntensity > 0.3) {
    return {
      type: "note",
      note: generateWindSound(weather),
      currentKey: NOTES[currentKey],
      currentScale,
    };
  }
  // Traffic sounds with ebb and flow (40% probability when intense)
  else if (soundChoice < 0.7 && trafficIntensity > 0.2) {
    const trafficNotes = generateTrafficSound(weather);
    if (trafficNotes.length === 1) {
      return {
        type: "note",
        note: trafficNotes[0],
        currentKey: NOTES[currentKey],
        currentScale,
      };
    } else {
      return {
        type: "chord",
        notes: trafficNotes,
        currentKey: NOTES[currentKey],
        currentScale,
      };
    }
  }
  // Conversation snippets that ebb and flow (probability based on intensity)
  else if (conversationIntensity > 0.1 && Math.random() < conversationIntensity) {
    return {
      type: "counterpoint",
      notes: generateConversationSnippet(weather),
      currentKey: NOTES[currentKey],
      currentScale,
    };
  }
  // Fallback to standard generation with serialism
  else {
    const eventType = Math.random();
    
    if (eventType < 0.5) {
      // Generate a single note using serialism
      return {
        type: "note",
        note: generateRandomNote(weather, undefined, true),
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
      // Generate counterpoint using serialism
      const numVoices = Math.floor(Math.random() * 3) + 2; // 2-4 voices
      const notes: Note[] = [];

      for (let i = 0; i < numVoices; i++) {
        // Assign each voice to a different register
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
          generateRandomNote(weather, { min: minOctave, max: maxOctave }, true),
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
