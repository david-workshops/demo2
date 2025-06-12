import { MidiEvent, Note, Pedal, WeatherData } from "../shared/types";

// Furniture object types and their characteristics
interface FurnitureObject {
  name: string;
  type: 'morse' | 'glissando' | 'melody' | 'harmony';
  pitchRange: { min: number; max: number }; // MIDI note numbers
  tempo: number; // Relative tempo factor
  volume: { min: number; max: number }; // Velocity range
  activityLevel: number; // 0-1, how often this object speaks
  lastActivity: number; // Timestamp of last activity
  state: 'active' | 'dormant' | 'arguing' | 'harmonizing';
  partner?: string; // Which object it's currently interacting with
}

// Haunted furniture objects in the apartment
const furnitureObjects: Record<string, FurnitureObject> = {
  chair: {
    name: 'chair',
    type: 'morse',
    pitchRange: { min: 48, max: 72 }, // C3 to C5
    tempo: 1.2,
    volume: { min: 60, max: 90 },
    activityLevel: 0.7,
    lastActivity: 0,
    state: 'active'
  },
  lamp: {
    name: 'lamp',
    type: 'morse',
    pitchRange: { min: 60, max: 84 }, // C4 to C6
    tempo: 0.8,
    volume: { min: 40, max: 70 },
    activityLevel: 0.5,
    lastActivity: 0,
    state: 'active'
  },
  bookshelf: {
    name: 'bookshelf',
    type: 'glissando',
    pitchRange: { min: 36, max: 60 }, // C2 to C4
    tempo: 0.3,
    volume: { min: 30, max: 80 },
    activityLevel: 0.4,
    lastActivity: 0,
    state: 'active'
  },
  cabinet: {
    name: 'cabinet',
    type: 'harmony',
    pitchRange: { min: 40, max: 70 }, // E2 to A#4
    tempo: 0.6,
    volume: { min: 50, max: 85 },
    activityLevel: 0.6,
    lastActivity: 0,
    state: 'active'
  },
  radiator: {
    name: 'radiator',
    type: 'harmony',
    pitchRange: { min: 30, max: 55 }, // F#1 to G3
    tempo: 0.4,
    volume: { min: 45, max: 75 },
    activityLevel: 0.5,
    lastActivity: 0,
    state: 'active'
  },
  ghostSpoon: {
    name: 'ghostSpoon',
    type: 'melody',
    pitchRange: { min: 72, max: 96 }, // C5 to C7
    tempo: 0.7,
    volume: { min: 20, max: 50 },
    activityLevel: 0.2, // Rare appearances
    lastActivity: 0,
    state: 'dormant'
  }
};

// Global state
let lastWindowSlam = Date.now();
let sustainPedalActive = false;
let sustainPedalTime = 0;
let globalSilenceUntil = 0;
let conversationPairs: Array<{ obj1: string; obj2: string; relationship: 'harmonizing' | 'arguing'; startTime: number }> = [];

// Microtonal adjustments (cents deviation from equal temperament)
const microtonalAdjustments = [-50, -30, -15, 0, 15, 30, 50];

// Generate Morse-like staccato patterns
function generateMorsePattern(furniture: FurnitureObject): Note[] {
  const pattern = Math.random() < 0.5 ? 'short' : 'long';
  const notes: Note[] = [];
  
  if (pattern === 'short') {
    // Short staccato bursts (3-5 notes)
    const numNotes = Math.floor(Math.random() * 3) + 3;
    const basePitch = Math.floor(Math.random() * (furniture.pitchRange.max - furniture.pitchRange.min)) + furniture.pitchRange.min;
    
    for (let i = 0; i < numNotes; i++) {
      notes.push({
        name: `${furniture.name}_morse_${i}`,
        octave: Math.floor(basePitch / 12),
        midiNumber: basePitch + (Math.random() < 0.3 ? (Math.random() > 0.5 ? 1 : -1) : 0),
        velocity: Math.floor(Math.random() * (furniture.volume.max - furniture.volume.min)) + furniture.volume.min,
        duration: 80 + Math.random() * 120 // Very short, staccato
      });
    }
  } else {
    // Longer Morse-like pattern
    const basePitch = Math.floor(Math.random() * (furniture.pitchRange.max - furniture.pitchRange.min)) + furniture.pitchRange.min;
    notes.push({
      name: `${furniture.name}_morse_long`,
      octave: Math.floor(basePitch / 12),
      midiNumber: basePitch,
      velocity: Math.floor(Math.random() * (furniture.volume.max - furniture.volume.min)) + furniture.volume.min,
      duration: 300 + Math.random() * 400
    });
  }
  
  return notes;
}

// Generate dissonant glissando
function generateGlissando(furniture: FurnitureObject): Note[] {
  const notes: Note[] = [];
  const startPitch = Math.floor(Math.random() * (furniture.pitchRange.max - furniture.pitchRange.min)) + furniture.pitchRange.min;
  const direction = Math.random() > 0.5 ? 1 : -1;
  const steps = Math.floor(Math.random() * 8) + 4; // 4-12 steps
  
  for (let i = 0; i < steps; i++) {
    const pitch = startPitch + (direction * i * 0.5); // Microtonal steps
    const microtonalAdjust = microtonalAdjustments[Math.floor(Math.random() * microtonalAdjustments.length)];
    
    notes.push({
      name: `${furniture.name}_gliss_${i}`,
      octave: Math.floor(pitch / 12),
      midiNumber: Math.floor(pitch) + (microtonalAdjust / 100), // Microtonal adjustment
      velocity: Math.floor(Math.random() * (furniture.volume.max - furniture.volume.min)) + furniture.volume.min,
      duration: 200 + Math.random() * 300
    });
  }
  
  return notes;
}

// Generate broken childlike melody (ghost spoon)
function generateGhostMelody(furniture: FurnitureObject): Note[] {
  const notes: Note[] = [];
  const melodyFragments = [
    [0, 2, 4, 2, 0], // Simple ascending/descending
    [0, -2, 1, -1, 0], // Broken pattern
    [0, 5, 4, 2, 0], // Lullaby-like
    [0, 3, 1, 4, 0] // Haunting fragment
  ];
  
  const fragment = melodyFragments[Math.floor(Math.random() * melodyFragments.length)];
  const basePitch = Math.floor(Math.random() * (furniture.pitchRange.max - furniture.pitchRange.min)) + furniture.pitchRange.min;
  
  fragment.forEach((interval, i) => {
    if (Math.random() < 0.8) { // Sometimes skip notes to make it "broken"
      notes.push({
        name: `${furniture.name}_melody_${i}`,
        octave: Math.floor((basePitch + interval) / 12),
        midiNumber: basePitch + interval,
        velocity: Math.floor(Math.random() * (furniture.volume.max - furniture.volume.min)) + furniture.volume.min,
        duration: 400 + Math.random() * 600
      });
    }
  });
  
  return notes;
}

// Generate harmony (thirds or tritones)
function generateHarmony(furniture: FurnitureObject, relationship: 'harmonizing' | 'arguing'): Note[] {
  const notes: Note[] = [];
  const basePitch = Math.floor(Math.random() * (furniture.pitchRange.max - furniture.pitchRange.min)) + furniture.pitchRange.min;
  
  // Root note
  notes.push({
    name: `${furniture.name}_harmony_root`,
    octave: Math.floor(basePitch / 12),
    midiNumber: basePitch,
    velocity: Math.floor(Math.random() * (furniture.volume.max - furniture.volume.min)) + furniture.volume.min,
    duration: 800 + Math.random() * 1200
  });
  
  // Harmony note
  const intervalSize = relationship === 'harmonizing' ? 
    [3, 4, 7][Math.floor(Math.random() * 3)] : // Minor 3rd, Major 3rd, Perfect 5th
    [6, 10, 11][Math.floor(Math.random() * 3)]; // Tritone, Minor 7th, Major 7th
  
  notes.push({
    name: `${furniture.name}_harmony_interval`,
    octave: Math.floor((basePitch + intervalSize) / 12),
    midiNumber: basePitch + intervalSize,
    velocity: Math.floor(Math.random() * (furniture.volume.max - furniture.volume.min)) + furniture.volume.min,
    duration: 800 + Math.random() * 1200
  });
  
  return notes;
}

// Generate window slam event
function generateWindowSlam(): Note[] {
  const notes: Note[] = [];
  const numNotes = Math.floor(Math.random() * 6) + 8; // 8-14 notes
  
  for (let i = 0; i < numNotes; i++) {
    const pitch = Math.floor(Math.random() * 24) + 24; // Low register C1-C3
    notes.push({
      name: `window_slam_${i}`,
      octave: Math.floor(pitch / 12),
      midiNumber: pitch,
      velocity: 80 + Math.floor(Math.random() * 47), // High velocity
      duration: 50 + Math.random() * 100 // Very short, percussive
    });
  }
  
  return notes;
}

// Manage furniture relationships
function updateFurnitureRelationships(): void {
  const now = Date.now();
  
  // Remove expired relationships
  conversationPairs = conversationPairs.filter(pair => now - pair.startTime < 30000); // 30 second conversations
  
  // Possibly start new relationships
  if (Math.random() < 0.05 && conversationPairs.length < 2) { // Max 2 concurrent conversations
    const availableObjects = Object.keys(furnitureObjects).filter(name => 
      !conversationPairs.some(pair => pair.obj1 === name || pair.obj2 === name) &&
      furnitureObjects[name].state !== 'dormant'
    );
    
    if (availableObjects.length >= 2) {
      const obj1 = availableObjects[Math.floor(Math.random() * availableObjects.length)];
      const obj2 = availableObjects.filter(name => name !== obj1)[Math.floor(Math.random() * (availableObjects.length - 1))];
      const relationship = Math.random() < 0.7 ? 'harmonizing' : 'arguing';
      
      conversationPairs.push({
        obj1,
        obj2,
        relationship,
        startTime: now
      });
      
      // Update furniture states
      furnitureObjects[obj1].state = relationship;
      furnitureObjects[obj2].state = relationship;
      furnitureObjects[obj1].partner = obj2;
      furnitureObjects[obj2].partner = obj1;
    }
  }
}

// Manage sustain pedal like fog
function manageSustainPedal(): Pedal | null {
  const now = Date.now();
  
  if (!sustainPedalActive && Math.random() < 0.02) { // 2% chance to start sustain
    sustainPedalActive = true;
    sustainPedalTime = now;
    return { type: 'sustain', value: 0.7 + Math.random() * 0.3 }; // 0.7-1.0
  } else if (sustainPedalActive && now - sustainPedalTime > 5000 + Math.random() * 10000) { // 5-15 seconds
    sustainPedalActive = false;
    return { type: 'sustain', value: 0 }; // Release
  }
  
  return null;
}

// Main function to generate haunted furniture events
export function generateHauntedFurnitureEvent(weather: WeatherData | null = null): MidiEvent {
  const now = Date.now();
  
  // Check for global silence period
  if (now < globalSilenceUntil) {
    return {
      type: 'silence',
      duration: 100 + Math.random() * 200
    };
  }
  
  // Check for window slam event (every 10-15 seconds)
  if (now - lastWindowSlam > 10000 + Math.random() * 5000) {
    lastWindowSlam = now;
    globalSilenceUntil = now + 500 + Math.random() * 1000; // Brief silence after slam
    
    return {
      type: 'chord', // Use chord type for multiple simultaneous notes
      notes: generateWindowSlam(),
      currentKey: 'atonal',
      currentScale: 'chromatic' as any
    };
  }
  
  // Update furniture relationships
  updateFurnitureRelationships();
  
  // Check for sustain pedal events
  const pedalEvent = manageSustainPedal();
  if (pedalEvent) {
    return {
      type: 'pedal',
      pedal: pedalEvent
    };
  }
  
  // Generate silence sometimes (use silence like negative space)
  if (Math.random() < 0.4) {
    return {
      type: 'silence',
      duration: 100 + Math.random() * 800
    };
  }
  
  // Select active furniture object
  const activeFurniture = Object.values(furnitureObjects).filter(f => 
    f.state !== 'dormant' && Math.random() < f.activityLevel * f.tempo
  );
  
  if (activeFurniture.length === 0) {
    return {
      type: 'silence',
      duration: 200 + Math.random() * 300
    };
  }
  
  const furniture = activeFurniture[Math.floor(Math.random() * activeFurniture.length)];
  furniture.lastActivity = now;
  
  // Generate appropriate sound for furniture type
  let notes: Note[] = [];
  
  switch (furniture.type) {
    case 'morse':
      notes = generateMorsePattern(furniture);
      break;
    case 'glissando':
      notes = generateGlissando(furniture);
      break;
    case 'melody':
      notes = generateGhostMelody(furniture);
      break;
    case 'harmony':
      const relationship = conversationPairs.find(pair => 
        pair.obj1 === furniture.name || pair.obj2 === furniture.name
      )?.relationship || 'harmonizing';
      notes = generateHarmony(furniture, relationship);
      break;
  }
  
  // Return appropriate MIDI event
  if (notes.length === 1) {
    return {
      type: 'note',
      note: notes[0],
      currentKey: 'atonal',
      currentScale: 'chromatic' as any
    };
  } else {
    return {
      type: 'chord',
      notes: notes,
      currentKey: 'atonal',
      currentScale: 'chromatic' as any
    };
  }
}