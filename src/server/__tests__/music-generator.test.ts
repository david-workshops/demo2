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
  
  it("should use Christmas carol settings as the base", () => {
    // Generate events without weather data to check default settings
    const events = [];
    for (let i = 0; i < 20; i++) {
      events.push(generateMidiEvent(null));
    }
    
    // Check for Christmas carol characteristics in default settings
    const noteEvents = events.filter(event => 
      event.type === "note" || event.type === "chord" || event.type === "counterpoint"
    );
    
    // Should have some note events
    expect(noteEvents.length).toBeGreaterThan(0);
    
    // Check scale - should be major by default for Christmas carol
    const scalesUsed = new Set();
    noteEvents.forEach(event => {
      if (event.type === "note" || event.type === "chord" || event.type === "counterpoint") {
        scalesUsed.add(event.currentScale);
      }
    });
    expect(scalesUsed.has("major") || scalesUsed.has("pentatonicMajor")).toBeTruthy();
  });
});
