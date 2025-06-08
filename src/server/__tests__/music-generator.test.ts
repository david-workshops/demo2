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

  it("should default to C major for Taylor Swift style", () => {
    // Generate multiple events to check initial key and scale
    const events = [];
    for (let i = 0; i < 20; i++) {
      const event = generateMidiEvent();
      events.push(event);
    }

    // Find events that have key and scale information
    const musicalEvents = events.filter(
      (event) => event.type === "note" || event.type === "chord" || event.type === "counterpoint"
    );

    // Should have some musical events
    expect(musicalEvents.length).toBeGreaterThan(0);

    // Most events should be in C major (initial setting)
    const cMajorEvents = musicalEvents.filter(
      (event) => "currentKey" in event && event.currentKey === "C" && event.currentScale === "major"
    );
    expect(cMajorEvents.length).toBeGreaterThan(0);
  });

  it("should generate notes in higher octaves for brighter sound", () => {
    const events = [];
    for (let i = 0; i < 50; i++) {
      const event = generateMidiEvent();
      if (event.type === "note") {
        events.push(event);
      }
    }

    // Should have some note events
    expect(events.length).toBeGreaterThan(0);

    // Most notes should be in octave 3 or higher for brighter sound
    const brighterNotes = events.filter((event) => event.note.octave >= 3);
    expect(brighterNotes.length / events.length).toBeGreaterThan(0.8); // At least 80%
  });
});
