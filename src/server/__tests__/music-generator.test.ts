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

  it("should apply wind weather conditions correctly", () => {
    const windWeather = {
      temperature: 20,
      weatherCode: 22, // Strong wind
      weatherDescription: "Strong wind",
    };

    // Generate multiple events with wind weather to test characteristics
    const windEvents = [];
    for (let i = 0; i < 50; i++) {
      const event = generateMidiEvent(windWeather);
      if (event.type === "note") {
        windEvents.push(event);
      }
    }

    // Should have some wind events
    expect(windEvents.length).toBeGreaterThan(0);

    // Test wind characteristics: higher octaves, shorter durations, varying velocities
    windEvents.forEach((event) => {
      if (event.type === "note") {
        // Wind should favor higher registers (4-7 octaves)
        expect(event.note.octave).toBeGreaterThanOrEqual(4);
        expect(event.note.octave).toBeLessThanOrEqual(7);

        // Wind should have shorter durations (100-600ms)
        expect(event.note.duration).toBeGreaterThanOrEqual(100);
        expect(event.note.duration).toBeLessThanOrEqual(600);

        // Wind should have varying velocities (30-90 for normal wind)
        expect(event.note.velocity).toBeGreaterThanOrEqual(30);
        expect(event.note.velocity).toBeLessThanOrEqual(90);
      }
    });
  });

  it("should apply stronger wind weather conditions correctly", () => {
    const strongWindWeather = {
      temperature: 18,
      weatherCode: 25, // Windy with gusts
      weatherDescription: "Windy with gusts",
    };

    // Generate multiple events with strong wind weather
    const strongWindEvents = [];
    for (let i = 0; i < 50; i++) {
      const event = generateMidiEvent(strongWindWeather);
      if (event.type === "note") {
        strongWindEvents.push(event);
      }
    }

    expect(strongWindEvents.length).toBeGreaterThan(0);

    // Test stronger wind characteristics: wider velocity range, even shorter durations
    strongWindEvents.forEach((event) => {
      if (event.type === "note") {
        // Should still favor higher registers
        expect(event.note.octave).toBeGreaterThanOrEqual(4);
        expect(event.note.octave).toBeLessThanOrEqual(7);

        // Should have even shorter durations (80-500ms)
        expect(event.note.duration).toBeGreaterThanOrEqual(80);
        expect(event.note.duration).toBeLessThanOrEqual(500);

        // Should have wider velocity range for gusts (40-110)
        expect(event.note.velocity).toBeGreaterThanOrEqual(40);
        expect(event.note.velocity).toBeLessThanOrEqual(110);
      }
    });
  });
});
