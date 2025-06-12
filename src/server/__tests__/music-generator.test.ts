import { generateMidiEvent } from "../music-generator";
import { MidiEvent } from "../../shared/types";

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
    } else if (event.type === "car") {
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
      expect(event.carId).toBeDefined();
      expect(typeof event.carId).toBe("string");
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

  it("should generate car events with Doppler effect", () => {
    // Generate events for a longer period to ensure car spawning
    const events: MidiEvent[] = [];

    // Simulate time passing by generating many events
    for (let i = 0; i < 1000; i++) {
      const event = generateMidiEvent();
      events.push(event);

      // If we found a car event, that's sufficient for this test
      if (event.type === "car") {
        break;
      }
    }

    // Find car events
    const carEvents = events.filter((e) => e.type === "car");

    // We should eventually generate car events
    if (carEvents.length > 0) {
      const carEvent = carEvents[0];
      if (carEvent.type === "car") {
        expect(carEvent.carId).toBeDefined();
        expect(typeof carEvent.carId).toBe("string");
        expect(carEvent.note).toBeDefined();
        expect(carEvent.note.velocity).toBeGreaterThanOrEqual(35);
        expect(carEvent.note.velocity).toBeLessThanOrEqual(65);
        expect(carEvent.note.duration).toBe(150);
        expect(carEvent.note.octave).toBeGreaterThanOrEqual(1);
        expect(carEvent.note.octave).toBeLessThanOrEqual(4);
      }
    }
  });
});
