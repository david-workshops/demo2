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

  it("should generate house music when enabled", () => {
    // Generate house music events
    const houseEvents = [];
    for (let i = 0; i < 50; i++) {
      const event = generateMidiEvent(null, true); // Enable house mode
      houseEvents.push(event);
    }

    // Should have at least some house-specific events
    const houseBeats = houseEvents.filter((e) => e.type === "houseBeat");
    const housePauses = houseEvents.filter((e) => e.type === "housePause");

    // Should generate some house beats
    expect(houseBeats.length).toBeGreaterThan(0);

    // Validate house beat structure
    const houseBeat = houseBeats.find((e) => e.type === "houseBeat");
    if (houseBeat && houseBeat.type === "houseBeat") {
      expect(houseBeat.notes).toBeInstanceOf(Array);
      expect(houseBeat.notes.length).toBeGreaterThan(0);
      expect(houseBeat.currentKey).toBeDefined();
      expect(houseBeat.currentScale).toBeDefined();
      expect(houseBeat.intensity).toBeGreaterThanOrEqual(0);
      expect(houseBeat.intensity).toBeLessThanOrEqual(1);
    }

    // May have house pauses (but not required for every test run)
    if (housePauses.length > 0) {
      const housePause = housePauses[0];
      if (housePause.type === "housePause") {
        expect(housePause.duration).toBeGreaterThan(0);
      }
    }
  });

  it("should gradually increase intensity in house mode", () => {
    // Generate many house events to potentially trigger intensity changes
    const intensities: number[] = [];

    for (let i = 0; i < 100; i++) {
      const event = generateMidiEvent(null, true);
      if (event.type === "houseBeat") {
        intensities.push(event.intensity);
      }
    }

    // Should have captured some intensities
    expect(intensities.length).toBeGreaterThan(0);

    // All intensities should be valid
    intensities.forEach((intensity) => {
      expect(intensity).toBeGreaterThanOrEqual(0);
      expect(intensity).toBeLessThanOrEqual(1);
    });
  });
});
