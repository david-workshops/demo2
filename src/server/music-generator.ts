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

// Schubert-like harmonic progressions (scale degrees)
const SCHUBERT_PROGRESSIONS = {
  major: [
    [1, 6, 4, 5], // I-vi-IV-V (common romantic progression)
    [1, 4, 5, 1], // I-IV-V-I (classic cadence)
    [6, 4, 1, 5], // vi-IV-I-V (deceptive resolution)
    [1, 2, 5, 1], // I-ii-V-I (jazz influenced)
    [1, 7, 6, 5], // I-vii°-vi-V (chromatic descent)
  ],
  minor: [
    [1, 4, 5, 1], // i-iv-V-i (harmonic minor cadence)
    [1, 6, 4, 5], // i-VI-iv-V (Phrygian progression)
    [1, 7, 3, 4], // i-VII-III-iv (modal mixture)
    [1, 2, 5, 1], // i-ii°-V-i
    [4, 1, 5, 1], // iv-i-V-i (plagal motion)
  ],
};

// State variables
let currentKey = Math.floor(Math.random() * 12); // 0-11 for C through B
let currentScale: Scale = "minor"; // Start with minor for Schubert-like character
let lastModeChangeTime = Date.now();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _noteCounter = 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let density = 0.7; // Probability of generating a note vs. silence

// Schubert-like state tracking
let currentProgression: number[] = [];
let progressionIndex = 0;
let lastMelodyNote: number | null = null; // For melodic continuity
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let phrasePosition = 0; // Track position in musical phrase

// Apply weather influence to music parameters
function applyWeatherInfluence(weather: WeatherData | null) {
  // Reset to defaults if no weather data
  if (!weather) {
    density = defaultSettings.density;
    return defaultSettings;
  }

  // Create settings object with defaults
  const settings = { ...defaultSettings };

  // Modify based on temperature - Schubert-like interpretations
  if (weather.temperature < 0) {
    // Very cold: introspective, melancholic (like Winterreise)
    settings.tempo = 65;
    settings.minOctave = 2;
    settings.maxOctave = 5;
    settings.noteDurationRange = { min: 1000, max: 4000 };
    settings.velocityRange = { min: 35, max: 75 };
    if (Math.random() < 0.8 && currentScale !== "minor") {
      currentScale = "minor";
    }
  } else if (weather.temperature < 10) {
    // Cool: contemplative, lyrical
    settings.tempo = 80;
    settings.minOctave = 2;
    settings.maxOctave = 6;
    settings.noteDurationRange = { min: 800, max: 3200 };
    settings.velocityRange = { min: 45, max: 85 };
    if (Math.random() < 0.6 && currentScale === "major") {
      currentScale = "minor";
    }
  } else if (weather.temperature > 30) {
    // Very hot: passionate, dramatic (like dramatic ballads)
    settings.tempo = 120;
    settings.minOctave = 3;
    settings.maxOctave = 7;
    settings.noteDurationRange = { min: 400, max: 2000 };
    settings.velocityRange = { min: 65, max: 115 };
    if (Math.random() < 0.4 && currentScale === "minor") {
      currentScale = "major";
    }
  } else if (weather.temperature > 25) {
    // Warm: lyrical, expressive (like Lieder)
    settings.tempo = 100;
    settings.minOctave = 3;
    settings.maxOctave = 6;
    settings.noteDurationRange = { min: 600, max: 2500 };
    settings.velocityRange = { min: 55, max: 95 };
    if (Math.random() < 0.3 && currentScale === "minor") {
      currentScale = "dorian"; // More modal color
    }
  }

  // Modify based on weather conditions - Schubert-like mood interpretations
  const code = weather.weatherCode;

  // Clear conditions (0, 1) - pastoral, optimistic
  if ([0, 1].includes(code)) {
    settings.density = 0.6;
    settings.sustainProbability = 0.04;
  }
  // Cloudy conditions (2, 3) - thoughtful, varied
  else if ([2, 3].includes(code)) {
    settings.density = 0.7;
    settings.sustainProbability = 0.06;
  }
  // Fog conditions (45, 48) - mysterious, atmospheric
  else if ([45, 48].includes(code)) {
    settings.density = 0.5;
    settings.sustainProbability = 0.12;
    settings.velocityRange = { min: 35, max: 70 };
  }
  // Rain conditions - melancholic, flowing (like "Gretchen am Spinnrade")
  else if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
  ) {
    settings.sustainProbability = 0.18;
    settings.noteDurationRange = { min: 300, max: 1800 };
    settings.density = 0.8;
    // Favor minor keys in rain
    if (Math.random() < 0.7 && currentScale !== "minor") {
      currentScale = "minor";
    }
  }
  // Snow conditions - serene, crystalline (like "Der Lindenbaum")
  else if ([71, 73, 75, 77, 85, 86].includes(code)) {
    settings.tempo = Math.max(60, settings.tempo - 25);
    settings.velocityRange = { min: 30, max: 75 };
    settings.noteDurationRange = { min: 1000, max: 3500 };
    settings.sustainProbability = 0.08;
  }
  // Thunderstorm conditions - dramatic, intense (like "Erlkönig")
  else if ([95, 96, 99].includes(code)) {
    settings.velocityRange = { min: 30, max: 127 };
    settings.density = 0.9;
    settings.noteDurationRange = { min: 200, max: 1500 };
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

// Get chord for a scale degree (1-7)
function getChordForScaleDegree(degree: number): number[] {
  const scaleNotes = getScaleNotes();
  const rootIndex = (degree - 1) % scaleNotes.length;
  const root = scaleNotes[rootIndex];

  // Build triad using scale degrees
  const third = scaleNotes[(rootIndex + 2) % scaleNotes.length];
  const fifth = scaleNotes[(rootIndex + 4) % scaleNotes.length];

  return [root, third, fifth];
}

// Generate harmonic progression-based chord
function generateHarmonicChord(weather: WeatherData | null): Note[] {
  const settings = applyWeatherInfluence(weather);

  // Initialize or continue progression
  if (
    currentProgression.length === 0 ||
    progressionIndex >= currentProgression.length
  ) {
    const scaleType = currentScale === "major" ? "major" : "minor";
    const progressions = SCHUBERT_PROGRESSIONS[scaleType];
    currentProgression =
      progressions[Math.floor(Math.random() * progressions.length)];
    progressionIndex = 0;
  }

  const currentDegree = currentProgression[progressionIndex];
  progressionIndex++;

  const chordNotes = getChordForScaleDegree(currentDegree);
  const result: Note[] = [];

  // Generate chord with Schubert-like voicing
  const baseOctave = Math.floor(Math.random() * 2) + 3; // Octaves 3-4

  chordNotes.forEach((note, index) => {
    const octave = baseOctave + (index > 0 && Math.random() < 0.3 ? 1 : 0);
    const velocity =
      Math.floor(Math.random() * 30) + Math.max(50, settings.velocityRange.min);
    const duration = Math.random() * 1000 + 1500; // Longer, more expressive durations

    result.push({
      name: NOTES[note],
      octave,
      midiNumber: note + octave * 12 + 12,
      velocity,
      duration,
    });
  });

  return result;
}

// Generate lyrical, Schubert-like melody
function generateLyricalMelody(weather: WeatherData | null): Note {
  const settings = applyWeatherInfluence(weather);
  const scaleNotes = getScaleNotes();

  let noteIndex: number;

  if (lastMelodyNote !== null) {
    // Create melodic continuity - prefer steps and small intervals
    const currentIndex = scaleNotes.indexOf(lastMelodyNote % 12);
    if (currentIndex !== -1) {
      // 70% chance of stepwise motion, 30% chance of small leaps
      const stepDirection = Math.random() < 0.5 ? 1 : -1;
      const interval =
        Math.random() < 0.7
          ? stepDirection
          : stepDirection * (Math.floor(Math.random() * 3) + 2);
      noteIndex =
        (currentIndex + interval + scaleNotes.length) % scaleNotes.length;
    } else {
      noteIndex = Math.floor(Math.random() * scaleNotes.length);
    }
  } else {
    // Start with a random note
    noteIndex = Math.floor(Math.random() * scaleNotes.length);
  }

  const note = scaleNotes[noteIndex];
  lastMelodyNote = note;

  // Schubert-like octave range (middle register, expressive)
  const octave = Math.floor(Math.random() * 2) + 4; // Octaves 4-5
  const midiNum = note + octave * 12 + 12;

  // More expressive velocity and duration
  const velocity =
    Math.floor(Math.random() * 40) + Math.max(60, settings.velocityRange.min);
  const duration = Math.random() * 800 + 700; // 700-1500ms for lyrical phrasing

  return {
    name: NOTES[note],
    octave,
    midiNumber: midiNum,
    velocity,
    duration,
  };
}

// Occasionally change key, scale, or mode
function maybeChangeMusicalContext(): void {
  const now = Date.now();

  // Change approximately every 3-5 minutes
  if (now - lastModeChangeTime > 3 * 60 * 1000 && Math.random() < 0.01) {
    // 1% chance per check when we're past the minimum time
    const changeType = Math.floor(Math.random() * 3);

    if (changeType === 0) {
      // Change key - favor keys with more sharps/flats (Schubert-like)
      const schubertKeys = [2, 4, 7, 9, 11]; // D, E, G, A, B (more expressive keys)
      currentKey =
        schubertKeys[Math.floor(Math.random() * schubertKeys.length)];
    } else if (changeType === 1) {
      // Change scale - favor minor, dorian, and natural minor
      const schubertScales: Scale[] = [
        "minor",
        "dorian",
        "minor",
        "natural minor" as Scale,
      ];
      // Note: "natural minor" isn't in our Scale type, so we'll use "minor" twice for higher probability
      currentScale =
        schubertScales[Math.floor(Math.random() * schubertScales.length)] ||
        "minor";
    } else {
      // Change both, favoring emotional keys and scales
      const schubertKeys = [2, 4, 7, 9, 11]; // D, E, G, A, B
      currentKey =
        schubertKeys[Math.floor(Math.random() * schubertKeys.length)];
      currentScale = Math.random() < 0.7 ? "minor" : "dorian"; // 70% minor, 30% dorian
    }

    // Reset progression when changing context
    currentProgression = [];
    progressionIndex = 0;
    lastMelodyNote = null;
    phrasePosition = 0;

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
  phrasePosition++;
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

  // Occasionally use pedals (more frequently for Schubert-like expression)
  const pedal = decidePedal(weather);
  if (pedal) {
    return {
      type: "pedal",
      pedal,
    };
  }

  // Decide between note, chord, or counterpoint with Schubert-like preferences
  const eventType = Math.random();

  if (eventType < 0.4) {
    // Generate a lyrical melody note (increased probability)
    return {
      type: "note",
      note: generateLyricalMelody(weather),
      currentKey: NOTES[currentKey],
      currentScale,
    };
  } else if (eventType < 0.75) {
    // Generate a harmonic progression chord (increased probability)
    return {
      type: "chord",
      notes: generateHarmonicChord(weather),
      currentKey: NOTES[currentKey],
      currentScale,
    };
  } else {
    // Generate Schubert-like counterpoint (voices with harmonic awareness)
    const numVoices = Math.floor(Math.random() * 2) + 2; // 2-3 voices for clarity
    const notes: Note[] = [];

    // Use harmonic chord as basis for counterpoint
    const harmonicBase = generateHarmonicChord(weather);

    for (let i = 0; i < Math.min(numVoices, harmonicBase.length); i++) {
      // Create slight rhythmic and melodic variation from harmonic base
      const baseNote = harmonicBase[i];
      const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1 semitone
      const midiNum = Math.max(
        12,
        Math.min(127, baseNote.midiNumber + variation),
      );

      notes.push({
        name: NOTES[(midiNum - 12) % 12],
        octave: Math.floor((midiNum - 12) / 12),
        midiNumber: midiNum,
        velocity: baseNote.velocity + Math.floor(Math.random() * 20) - 10,
        duration: baseNote.duration * (0.8 + Math.random() * 0.4),
      });
    }

    return {
      type: "counterpoint",
      notes,
      currentKey: NOTES[currentKey],
      currentScale,
    };
  }
}
