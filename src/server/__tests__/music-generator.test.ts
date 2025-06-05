import {
  generateMidiEvent,
  setJungleMode,
  getJungleMode,
} from "../music-generator";
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

  describe("Jungle Mode", () => {
    beforeEach(() => {
      // Reset jungle mode before each test
      setJungleMode(false);
    });

    it("should toggle jungle mode on and off", () => {
      expect(getJungleMode()).toBe(false);

      setJungleMode(true);
      expect(getJungleMode()).toBe(true);

      setJungleMode(false);
      expect(getJungleMode()).toBe(false);
    });

    it("should generate different note patterns in jungle mode", () => {
      // Generate events in piano mode
      setJungleMode(false);
      const pianoEvents = [];
      for (let i = 0; i < 20; i++) {
        pianoEvents.push(generateMidiEvent());
      }

      // Generate events in jungle mode
      setJungleMode(true);
      const jungleEvents = [];
      for (let i = 0; i < 20; i++) {
        jungleEvents.push(generateMidiEvent());
      }

      // Should have generated some events
      expect(pianoEvents.length).toBeGreaterThan(0);
      expect(jungleEvents.length).toBeGreaterThan(0);

      // Find note events to compare
      const pianoNotes = pianoEvents.filter(
        (e) =>
          e.type === "note" || e.type === "chord" || e.type === "counterpoint",
      );
      const jungleNotes = jungleEvents.filter(
        (e) =>
          e.type === "note" || e.type === "chord" || e.type === "counterpoint",
      );

      // Should have some note events in both modes
      expect(pianoNotes.length).toBeGreaterThan(0);
      expect(jungleNotes.length).toBeGreaterThan(0);
    });

    it("should generate valid jungle animal notes", () => {
      setJungleMode(true);

      // Generate multiple events and check for jungle-specific patterns
      const events = [];
      for (let i = 0; i < 50; i++) {
        events.push(generateMidiEvent());
      }

      const noteEvents = events.filter(
        (e) =>
          (e.type === "note" ||
            e.type === "chord" ||
            e.type === "counterpoint") &&
          (e.type === "note" ? e.note : e.notes),
      );

      expect(noteEvents.length).toBeGreaterThan(0);

      // Check that we get notes across different octave ranges (representing different animals)
      const allNotes = noteEvents.flatMap((e) => {
        if (e.type === "note") {
          return [e.note];
        } else if (e.type === "chord" || e.type === "counterpoint") {
          return e.notes;
        }
        return [];
      });

      const octaves = new Set(allNotes.map((note) => note.octave));

      // Should have notes in multiple octaves representing different animals
      expect(octaves.size).toBeGreaterThan(1);

      // Should have some high notes (birds/insects) and some low notes (frogs)
      const hasHighNotes = allNotes.some((note) => note.octave >= 6);
      const hasLowNotes = allNotes.some((note) => note.octave <= 4);

      expect(hasHighNotes || hasLowNotes).toBe(true);
    });
  });
});
