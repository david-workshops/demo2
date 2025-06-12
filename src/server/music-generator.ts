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
let currentScale: Scale = "wholeTone"; // Start with impressionistic whole tone scale
let lastModeChangeTime = Date.now();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _noteCounter = 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let density = 0.6; // Lower density for more atmospheric, impressionistic feel

// Marble physics state
interface MarbleState {
  x: number; // Position along keyboard (0-1)
  y: number; // Height above strings (0-1)
  velocityX: number;
  velocityY: number;
  gravity: number;
  damping: number;
  active: boolean;
  lastBounceTime: number;
}

let marbleState: MarbleState = {
  x: 0.5,
  y: 0.8,
  velocityX: 0,
  velocityY: 0,
  gravity: 0.002,
  damping: 0.95,
  active: false,
  lastBounceTime: -1000, // Initialize to past time so no immediate bounces
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
  tempo: 80, // Slower tempo for impressionistic feel
  density: 0.6, // Lower density for more space and atmosphere
  minOctave: 2, // Higher minimum for clearer impressionistic textures
  maxOctave: 7, // Keep full range
  sustainProbability: 0.15, // More sustain for impressionistic atmosphere
  velocityRange: { min: 40, max: 85 }, // Softer dynamics overall
  noteDurationRange: { min: 800, max: 4000 }, // Longer, more flowing notes
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

// Generate impressionistic chord (4ths, 5ths, whole tone clusters)
function generateImpressionisticChord(weather: WeatherData | null, numNotes = 3): Note[] {
  const settings = applyWeatherInfluence(weather);
  const scaleNotes = getScaleNotes();
  const rootIndex = Math.floor(Math.random() * scaleNotes.length);
  const rootNote = scaleNotes[rootIndex];

  const chordNotes: Note[] = [];
  const rootOctave = Math.floor(Math.random() * 2) + Math.max(3, settings.minOctave);

  // Root note
  const rootVelocity = Math.floor(Math.random() * 20) + settings.velocityRange.min;
  const rootDuration = Math.random() * (settings.noteDurationRange.max - settings.noteDurationRange.min) + settings.noteDurationRange.min;

  chordNotes.push({
    name: NOTES[rootNote],
    octave: rootOctave,
    midiNumber: rootNote + rootOctave * 12 + 12,
    velocity: rootVelocity,
    duration: rootDuration,
  });

  // Add impressionistic intervals (4ths, 5ths, or whole tone steps)
  for (let i = 1; i < numNotes; i++) {
    let intervalType = Math.random();
    let nextNote: number;
    let nextOctave = rootOctave;

    if (currentScale === 'wholeTone') {
      // For whole tone, use steps of 2 semitones
      nextNote = (rootNote + i * 2) % 12;
    } else if (intervalType < 0.4) {
      // Perfect 4th (5 semitones)
      nextNote = (rootNote + 5) % 12;
      if (nextNote < rootNote) nextOctave++;
    } else if (intervalType < 0.7) {
      // Perfect 5th (7 semitones)  
      nextNote = (rootNote + 7) % 12;
      if (nextNote < rootNote) nextOctave++;
    } else {
      // Scale-based interval
      const nextIndex = (rootIndex + i * 2) % scaleNotes.length;
      nextNote = scaleNotes[nextIndex];
      if (nextIndex < rootIndex) nextOctave++;
    }

    chordNotes.push({
      name: NOTES[nextNote],
      octave: nextOctave,
      midiNumber: nextNote + nextOctave * 12 + 12,
      velocity: Math.floor(Math.random() * 15) + Math.max(35, settings.velocityRange.min - 25),
      duration: rootDuration * (0.7 + Math.random() * 0.6), // Some variation
    });
  }

  return chordNotes;
}

// Generate arpeggiated passage
function generateArpeggiatedPassage(weather: WeatherData | null, numNotes = 4): Note[] {
  const settings = applyWeatherInfluence(weather);
  const scaleNotes = getScaleNotes();
  const notes: Note[] = [];
  
  const baseOctave = Math.floor(Math.random() * 2) + Math.max(3, settings.minOctave);
  const direction = Math.random() < 0.5 ? 1 : -1; // ascending or descending
  const baseDuration = Math.random() * 500 + 400; // 400-900ms base duration
  
  for (let i = 0; i < numNotes; i++) {
    const scaleIndex = (Math.floor(Math.random() * scaleNotes.length) + i * direction) % scaleNotes.length;
    const note = scaleNotes[Math.abs(scaleIndex)];
    const octave = baseOctave + Math.floor(i * direction / scaleNotes.length);
    
    notes.push({
      name: NOTES[note],
      octave: Math.max(1, Math.min(8, octave)),
      midiNumber: note + Math.max(1, Math.min(8, octave)) * 12 + 12,
      velocity: Math.floor(Math.random() * 25) + settings.velocityRange.min - 10,
      duration: baseDuration * (0.8 + Math.random() * 0.4), // Slight variation
    });
  }
  
  return notes;
}

// Generate parallel motion (like Debussy's style)
function generateParallelMotion(weather: WeatherData | null, numVoices = 3): Note[] {
  const settings = applyWeatherInfluence(weather);
  const scaleNotes = getScaleNotes();
  const notes: Note[] = [];
  
  const baseOctave = Math.floor(Math.random() * 2) + Math.max(3, settings.minOctave);
  const rootIndex = Math.floor(Math.random() * scaleNotes.length);
  const baseDuration = Math.random() * (settings.noteDurationRange.max - settings.noteDurationRange.min) + settings.noteDurationRange.min;
  
  // Generate parallel voices with same harmonic interval
  const interval = Math.random() < 0.5 ? 2 : 3; // Major 2nd or minor 3rd intervals
  
  for (let i = 0; i < numVoices; i++) {
    const noteIndex = (rootIndex + i * interval) % scaleNotes.length;
    const note = scaleNotes[noteIndex];
    const octave = baseOctave + Math.floor((rootIndex + i * interval) / scaleNotes.length);
    
    notes.push({
      name: NOTES[note],
      octave: Math.max(1, Math.min(8, octave)),
      midiNumber: note + Math.max(1, Math.min(8, octave)) * 12 + 12,
      velocity: Math.floor(Math.random() * 20) + settings.velocityRange.min - 15,
      duration: baseDuration * (0.9 + Math.random() * 0.2), // Very slight variation for parallel motion
    });
  }
  
  return notes;
}

// Occasionally change key, scale, or mode
function maybeChangeMusicalContext(): void {
  const now = Date.now();

  // Change approximately every 2-4 minutes for more variation
  if (now - lastModeChangeTime > 2 * 60 * 1000 && Math.random() < 0.015) {
    // 1.5% chance per check when we're past the minimum time
    const changeType = Math.floor(Math.random() * 3);

    if (changeType === 0) {
      // Change key, prefer impressionistic keys
      const impressionisticKeys = [0, 2, 4, 6, 7, 9, 11]; // C, D, E, F#, G, A, B - whole tone friendly
      currentKey = impressionisticKeys[Math.floor(Math.random() * impressionisticKeys.length)];
    } else if (changeType === 1) {
      // Change scale, prefer impressionistic scales
      const impressionisticScales: Scale[] = ['wholeTone', 'pentatonicMajor', 'pentatonicMinor', 'lydian', 'dorian'];
      currentScale = impressionisticScales[Math.floor(Math.random() * impressionisticScales.length)];
    } else {
      // Change both
      const impressionisticKeys = [0, 2, 4, 6, 7, 9, 11];
      currentKey = impressionisticKeys[Math.floor(Math.random() * impressionisticKeys.length)];
      const impressionisticScales: Scale[] = ['wholeTone', 'pentatonicMajor', 'pentatonicMinor', 'lydian', 'dorian'];
      currentScale = impressionisticScales[Math.floor(Math.random() * impressionisticScales.length)];
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

// Marble physics simulation
function updateMarble(deltaTime: number): void {
  if (!marbleState.active) return;

  // Apply gravity
  marbleState.velocityY -= marbleState.gravity * deltaTime;
  
  // Update position
  marbleState.x += marbleState.velocityX * deltaTime;
  marbleState.y += marbleState.velocityY * deltaTime;
  
  // Bounce off sides (keyboard edges)
  if (marbleState.x <= 0 || marbleState.x >= 1) {
    marbleState.velocityX *= -marbleState.damping;
    marbleState.x = Math.max(0, Math.min(1, marbleState.x));
  }
  
  // Bounce off strings (bottom)
  if (marbleState.y <= 0) {
    marbleState.velocityY *= -marbleState.damping;
    marbleState.y = 0;
    marbleState.lastBounceTime = Date.now();
    
    // Apply some random horizontal movement on bounce
    marbleState.velocityX += (Math.random() - 0.5) * 0.001;
  }
  
  // Bounce off ceiling
  if (marbleState.y >= 1) {
    marbleState.velocityY *= -marbleState.damping;
    marbleState.y = 1;
  }
  
  // Stop if moving too slowly
  if (Math.abs(marbleState.velocityX) < 0.0001 && Math.abs(marbleState.velocityY) < 0.0001 && marbleState.y <= 0.01) {
    marbleState.active = false;
  }
}

// Trigger marble movement when a note is played
function triggerMarble(note: Note): void {
  // Convert MIDI note to keyboard position (0-1)
  const keyboardPosition = Math.max(0, Math.min(1, (note.midiNumber - 21) / 87)); // Piano range A0 to C8
  
  // Add some randomness to the marble trigger
  const randomOffset = (Math.random() - 0.5) * 0.2; // ±0.1 position
  marbleState.x = Math.max(0, Math.min(1, keyboardPosition + randomOffset));
  
  // Give the marble some initial velocity based on note velocity
  const velocityScale = note.velocity / 127;
  marbleState.velocityX = (Math.random() - 0.5) * 0.002 * velocityScale;
  marbleState.velocityY = 0.001 + Math.random() * 0.002 * velocityScale;
  
  // Start from a random height
  marbleState.y = 0.3 + Math.random() * 0.5;
  
  marbleState.active = true;
}

// Generate marble bounce notes
function generateMarbleBounceNote(): Note | null {
  if (!marbleState.active) {
    return null;
  }
  
  // Only generate bounce notes when the marble actually bounced recently
  const timeSinceBounce = Date.now() - marbleState.lastBounceTime;
  if (timeSinceBounce > 100) {
    return null;
  }
  
  // Convert marble position to MIDI note
  const midiNumber = Math.floor(21 + marbleState.x * 87); // A0 to C8 range
  
  // Create a metallic-sounding note with different characteristics
  const note: Note = {
    name: NOTES[midiNumber % 12],
    octave: Math.floor((midiNumber - 12) / 12),
    midiNumber: midiNumber,
    velocity: Math.floor(20 + Math.random() * 40), // Softer, metallic
    duration: 200 + Math.random() * 300, // Shorter, more percussive
  };
  
  return note;
}

// Main function to generate MIDI events
export function generateMidiEvent(
  weather: WeatherData | null = null,
): MidiEvent {
  _noteCounter++;
  maybeChangeMusicalContext();

  const settings = applyWeatherInfluence(weather);
  
  // Update marble physics
  updateMarble(50); // Approximate deltaTime for 20fps updates

  // Randomly introduce silence based on density setting (more space for impressionistic feel)
  if (Math.random() > settings.density) {
    // Return a "silence" event with longer durations for more atmospheric pauses
    return {
      type: "silence",
      duration: Math.random() * 1500 + 500, // 500-2000ms of silence
    };
  }

  // Occasionally use pedals (more sustain for impressionistic style)
  const pedal = decidePedal(weather);
  if (pedal) {
    return {
      type: "pedal",
      pedal,
    };
  }

  // Decide between different impressionistic textures
  const eventType = Math.random();

  if (eventType < 0.3) {
    // Generate a single note with impressionistic character
    const note = generateRandomNote(weather);
    triggerMarble(note); // Trigger marble on every note
    return {
      type: "note",
      note,
      currentKey: NOTES[currentKey],
      currentScale,
    };
  } else if (eventType < 0.6) {
    // Generate impressionistic chord (often 4ths, 5ths, or whole tone clusters)
    const chordSize = Math.floor(Math.random() * 3) + 2; // 2-4 notes for less dense chords
    const notes = generateImpressionisticChord(weather, chordSize);
    // Trigger marble on the highest note of the chord
    if (notes.length > 0) {
      const highestNote = notes.reduce((prev, current) => 
        (current.midiNumber > prev.midiNumber) ? current : prev
      );
      triggerMarble(highestNote);
    }
    return {
      type: "chord",
      notes,
      currentKey: NOTES[currentKey],
      currentScale,
    };
  } else if (eventType < 0.85) {
    // Generate flowing arpeggiated passage
    const numNotes = Math.floor(Math.random() * 4) + 3; // 3-6 notes
    const notes = generateArpeggiatedPassage(weather, numNotes);
    // Trigger marble on the first note
    if (notes.length > 0) {
      triggerMarble(notes[0]);
    }
    return {
      type: "arpeggio",
      notes,
      currentKey: NOTES[currentKey],
      currentScale,
    };
  } else {
    // Generate atmospheric texture (parallel motion, similar to Debussy)
    const numVoices = Math.floor(Math.random() * 3) + 2; // 2-4 voices
    const notes = generateParallelMotion(weather, numVoices);
    // Trigger marble on a random note from the texture
    if (notes.length > 0) {
      const randomNote = notes[Math.floor(Math.random() * notes.length)];
      triggerMarble(randomNote);
    }
    return {
      type: "parallel-motion",
      notes,
      currentKey: NOTES[currentKey],
      currentScale,
    };
  }
}

// Separate function to check for marble bounce events (to be called by server)
export function checkMarbleBounce(): MidiEvent | null {
  const marbleBounceNote = generateMarbleBounceNote();
  if (marbleBounceNote) {
    return {
      type: "marble-bounce",
      note: marbleBounceNote,
      currentKey: NOTES[currentKey],
      currentScale,
    };
  }
  return null;
}
