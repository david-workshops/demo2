import { generateMidiEvent } from "../music-generator";
// MidiEvent type is imported but not directly used in test assertions

describe("Music Generator", () => {
  it("should generate valid MIDI events", () => {
    const event = generateMidiEvent();
    expect(event).toBeDefined();
    expect(event.type).toBeDefined();

    // Test specific event types
    if (event.type === "note") {
      expect(event.note).toBeDefined();
      expect(event.note.name).toBeDefined();
      expect(event.note.octave).toBeGreaterThanOrEqual(1);
      expect(event.note.octave).toBeLessThanOrEqual(7);
      expect(event.note.midiNumber).toBeGreaterThan(0);
      expect(event.note.velocity).toBeGreaterThanOrEqual(0);
      expect(event.note.velocity).toBeLessThanOrEqual(127);
      expect(event.note.duration).toBeGreaterThan(0);
      expect(event.currentKey).toBeDefined();
      expect(event.currentScale).toBeDefined();
    } else if (event.type === "chord" || event.type === "counterpoint") {
      expect(event.notes).toBeInstanceOf(Array);
      expect(event.notes.length).toBeGreaterThan(0);
      expect(event.currentKey).toBeDefined();
      expect(event.currentScale).toBeDefined();
    } else if (event.type === "pedal") {
      expect(event.pedal).toBeDefined();
      expect(["sustain", "sostenuto", "soft"]).toContain(event.pedal.type);
      expect(event.pedal.value).toBeGreaterThanOrEqual(0);
      expect(event.pedal.value).toBeLessThanOrEqual(1);
    } else if (event.type === "silence") {
      expect(event.duration).toBeGreaterThan(0);
    }
  });

  it("should generate multiple events without errors", () => {
    // Generate multiple events to test consistency
    for (let i = 0; i < 20; i++) {
      const event = generateMidiEvent();
      expect(event).toBeDefined();
    }
  });

  it("should generate different types of events", () => {
    // Collect event types over many iterations
    const eventTypes = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const event = generateMidiEvent();
      eventTypes.add(event.type);

      // If we've seen all event types, break early
      if (eventTypes.size >= 4) break; // note, chord, counterpoint, pedal, silence
    }

    // We should observe at least 3 different event types
    expect(eventTypes.size).toBeGreaterThanOrEqual(3);
  });

  it("should use mixolydian mode as primary scale for SF streets", () => {
    // Generate multiple events and check that mixolydian is being used
    let mixolydianFound = false;
    
    for (let i = 0; i < 50; i++) {
      const event = generateMidiEvent();
      if ((event.type === "note" || event.type === "chord" || event.type === "counterpoint") && 
          event.currentScale === "mixolydian") {
        mixolydianFound = true;
        break;
      }
    }
    
    expect(mixolydianFound).toBe(true);
  });

  it("should generate events with SF street characteristics", () => {
    // Test that events have characteristics appropriate for street sounds
    const events = [];
    for (let i = 0; i < 30; i++) {
      events.push(generateMidiEvent());
    }
    
    // Should have variety in octave ranges (traffic low, wind high, conversation mid)
    const noteEvents = events.filter(e => e.type === "note");
    if (noteEvents.length > 0) {
      const octaves = noteEvents.map(e => (e as any).note.octave);
      const minOctave = Math.min(...octaves);
      const maxOctave = Math.max(...octaves);
      expect(maxOctave - minOctave).toBeGreaterThan(1); // Should span multiple octaves
    }
    
    // Should have variety in velocities (muffled conversation, traffic, wind)
    const allNoteEvents = events.filter(e => 
      (e.type === "note") || 
      (e.type === "chord") || 
      (e.type === "counterpoint")
    );
    
    if (allNoteEvents.length > 0) {
      const velocities: number[] = [];
      allNoteEvents.forEach(e => {
        if (e.type === "note") {
          velocities.push((e as any).note.velocity);
        } else if (e.type === "chord" || e.type === "counterpoint") {
          (e as any).notes.forEach((note: any) => velocities.push(note.velocity));
        }
      });
      
      const minVelocity = Math.min(...velocities);
      const maxVelocity = Math.max(...velocities);
      expect(maxVelocity - minVelocity).toBeGreaterThan(10); // Should have dynamic range
    }
  });
});
