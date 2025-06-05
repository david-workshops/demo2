import { generateMidiEvent } from "../music-generator";
// MidiEvent type is imported but not directly used in test assertions

describe("Music Generator", () => {
  it("should generate valid MIDI events with wind-like characteristics by default", () => {
    const event = generateMidiEvent();
    expect(event).toBeDefined();
    expect(event.type).toBeDefined();

    // Test specific event types - should now have wind-like characteristics by default
    if (event.type === "note") {
      expect(event.note).toBeDefined();
      expect(event.note.name).toBeDefined();
      // Wind-like default: higher octaves (4-7)
      expect(event.note.octave).toBeGreaterThanOrEqual(4);
      expect(event.note.octave).toBeLessThanOrEqual(7);
      expect(event.note.midiNumber).toBeGreaterThan(0);
      expect(event.note.velocity).toBeGreaterThanOrEqual(0);
      expect(event.note.velocity).toBeLessThanOrEqual(127);
      // Wind-like default: shorter durations (100-600ms)
      expect(event.note.duration).toBeGreaterThanOrEqual(100);
      expect(event.note.duration).toBeLessThanOrEqual(600);
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

  it("should always have wind-like characteristics", () => {
    // Test with no weather data - should still have wind characteristics
    const noWeatherEvents = [];
    for (let i = 0; i < 50; i++) {
      const event = generateMidiEvent(null);
      if (event.type === "note") {
        noWeatherEvents.push(event);
      }
    }

    // Should have some note events
    expect(noWeatherEvents.length).toBeGreaterThan(0);

    // Test wind characteristics are applied by default
    noWeatherEvents.forEach((event) => {
      if (event.type === "note") {
        // Wind should favor higher registers (4-7 octaves)
        expect(event.note.octave).toBeGreaterThanOrEqual(4);
        expect(event.note.octave).toBeLessThanOrEqual(7);

        // Wind should have shorter durations (100-600ms)
        expect(event.note.duration).toBeGreaterThanOrEqual(100);
        expect(event.note.duration).toBeLessThanOrEqual(600);

        // Wind should have varying velocities (30-90)
        expect(event.note.velocity).toBeGreaterThanOrEqual(30);
        expect(event.note.velocity).toBeLessThanOrEqual(90);
      }
    });
  });

  it("should have wind characteristics even with non-wind weather", () => {
    const clearWeather = {
      temperature: 20,
      weatherCode: 0, // Clear sky (not wind)
      weatherDescription: "Clear sky",
    };

    // Generate multiple events with clear weather
    const clearWeatherEvents = [];
    for (let i = 0; i < 50; i++) {
      const event = generateMidiEvent(clearWeather);
      if (event.type === "note") {
        clearWeatherEvents.push(event);
      }
    }

    // Should have some events
    expect(clearWeatherEvents.length).toBeGreaterThan(0);

    // Should still have wind characteristics even with clear weather
    clearWeatherEvents.forEach((event) => {
      if (event.type === "note") {
        // Should still favor higher registers (4-7 octaves)
        expect(event.note.octave).toBeGreaterThanOrEqual(4);
        expect(event.note.octave).toBeLessThanOrEqual(7);

        // Should still have shorter durations (100-600ms)  
        expect(event.note.duration).toBeGreaterThanOrEqual(100);
        expect(event.note.duration).toBeLessThanOrEqual(600);

        // Should still have wind-like velocities (30-90)
        expect(event.note.velocity).toBeGreaterThanOrEqual(30);
        expect(event.note.velocity).toBeLessThanOrEqual(90);
      }
    });
  });
});
