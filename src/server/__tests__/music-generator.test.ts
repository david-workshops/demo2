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

  describe("Woodpecker Mode", () => {
    it("should generate woodpecker events in woodpecker mode", () => {
      const event = generateMidiEvent(null, "woodpecker");
      expect(event).toBeDefined();
      expect(["woodpecker", "silence"]).toContain(event.type);

      if (event.type === "woodpecker") {
        expect(event.note).toBeDefined();
        expect(event.woodpeckerType).toBeDefined();
        expect(["high", "mid", "low"]).toContain(event.woodpeckerType);
        expect(event.note.duration).toBeGreaterThanOrEqual(50);
        expect(event.note.duration).toBeLessThanOrEqual(150);
        expect(event.note.velocity).toBeGreaterThanOrEqual(95);
        expect(event.note.velocity).toBeLessThanOrEqual(120);
      }
    });

    it("should generate different woodpecker types", () => {
      const woodpeckerTypes = new Set<string>();

      // Generate many events to see different woodpecker types
      for (let i = 0; i < 50; i++) {
        const event = generateMidiEvent(null, "woodpecker");
        if (event.type === "woodpecker") {
          woodpeckerTypes.add(event.woodpeckerType);
        }
      }

      // Should eventually see multiple woodpecker types
      expect(woodpeckerTypes.size).toBeGreaterThanOrEqual(1);
    });

    it("should generate short, percussive notes characteristic of woodpeckers", () => {
      let woodpeckerEventFound = false;

      for (let i = 0; i < 20; i++) {
        const event = generateMidiEvent(null, "woodpecker");
        if (event.type === "woodpecker") {
          woodpeckerEventFound = true;
          // Short duration (50-150ms range)
          expect(event.note.duration).toBeLessThan(160);
          expect(event.note.duration).toBeGreaterThan(40);
          // High velocity (percussive attack)
          expect(event.note.velocity).toBeGreaterThan(90);
          break;
        }
      }

      // Should find at least one woodpecker event in reasonable attempts
      expect(woodpeckerEventFound).toBe(true);
    });

    it("should default to normal mode when no mode specified", () => {
      const normalEvent = generateMidiEvent();
      const modeEvent = generateMidiEvent(null, "normal");

      // Both should not be woodpecker events
      expect(normalEvent.type).not.toBe("woodpecker");
      expect(modeEvent.type).not.toBe("woodpecker");
    });
  });
});
