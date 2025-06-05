import {
  generateMidiEvent,
  generateElevatorMusicEvent,
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
});

describe("Elevator Music Generator", () => {
  it("should generate valid elevator music events", () => {
    const event = generateElevatorMusicEvent();
    expect(event).toBeDefined();
    expect(event.type).toBeDefined();

    // Test specific event types for elevator music
    if (event.type === "note") {
      expect(event.note).toBeDefined();
      expect(event.note.name).toBeDefined();
      expect(event.note.octave).toBeGreaterThanOrEqual(3); // Mid-range register
      expect(event.note.octave).toBeLessThanOrEqual(6);
      expect(event.note.midiNumber).toBeGreaterThan(0);
      expect(event.note.velocity).toBeGreaterThanOrEqual(30); // Softer dynamics
      expect(event.note.velocity).toBeLessThanOrEqual(90);
      expect(event.note.duration).toBeGreaterThanOrEqual(800); // Longer durations
      expect(event.note.duration).toBeLessThanOrEqual(3200);
      expect(event.currentKey).toBeDefined();
      expect(event.currentScale).toBe("major"); // Always major scale
    } else if (event.type === "chord") {
      expect(event.notes).toBeInstanceOf(Array);
      expect(event.notes.length).toBeGreaterThanOrEqual(3);
      expect(event.notes.length).toBeLessThanOrEqual(4); // Smaller chords
      expect(event.currentKey).toBeDefined();
      expect(event.currentScale).toBe("major"); // Always major scale

      // Check that all notes have elevator music characteristics
      event.notes.forEach((note) => {
        expect(note.velocity).toBeGreaterThanOrEqual(30);
        expect(note.velocity).toBeLessThanOrEqual(90);
        expect(note.octave).toBeGreaterThanOrEqual(3);
        expect(note.octave).toBeLessThanOrEqual(6);
      });
    } else if (event.type === "pedal") {
      expect(event.pedal).toBeDefined();
      expect(["sustain", "soft"]).toContain(event.pedal.type); // Only sustain and soft pedals
      expect(event.pedal.value).toBeGreaterThanOrEqual(0);
      expect(event.pedal.value).toBeLessThanOrEqual(1);
    } else if (event.type === "silence") {
      expect(event.duration).toBeGreaterThanOrEqual(200); // Longer silence periods
      expect(event.duration).toBeLessThanOrEqual(800);
    }
  });

  it("should generate multiple elevator music events without errors", () => {
    // Generate multiple events to test consistency
    for (let i = 0; i < 30; i++) {
      const event = generateElevatorMusicEvent();
      expect(event).toBeDefined();
    }
  });

  it("should have calming characteristics - slower tempo and softer dynamics", () => {
    const events = [];

    // Collect events to analyze characteristics
    for (let i = 0; i < 50; i++) {
      const event = generateElevatorMusicEvent();
      if (event.type === "note" || event.type === "chord") {
        events.push(event);
      }
    }

    expect(events.length).toBeGreaterThan(0);

    // Check that all musical events use major scale (calming)
    events.forEach((event) => {
      expect(event.currentScale).toBe("major");
    });

    // Check velocity ranges are softer
    const velocities: number[] = [];
    events.forEach((event) => {
      if (event.type === "note") {
        velocities.push(event.note.velocity);
      } else if (event.type === "chord") {
        event.notes.forEach((note) => velocities.push(note.velocity));
      }
    });

    const avgVelocity =
      velocities.reduce((sum, vel) => sum + vel, 0) / velocities.length;
    expect(avgVelocity).toBeLessThan(80); // Should be softer than regular music
    expect(Math.max(...velocities)).toBeLessThanOrEqual(90); // Max velocity should be limited
  });

  it("should prefer sustain and soft pedals for smoothness", () => {
    const pedalEvents = [];

    // Generate many events to find pedal events
    for (let i = 0; i < 100; i++) {
      const event = generateElevatorMusicEvent();
      if (event.type === "pedal") {
        pedalEvents.push(event);
      }
    }

    // If we found pedal events, they should only be sustain or soft
    pedalEvents.forEach((event) => {
      expect(["sustain", "soft"]).toContain(event.pedal.type);
      // No sostenuto pedal in elevator music for simplicity
    });
  });

  it("should have longer note durations for smoothness", () => {
    const noteDurations: number[] = [];

    // Collect note durations
    for (let i = 0; i < 50; i++) {
      const event = generateElevatorMusicEvent();
      if (event.type === "note") {
        noteDurations.push(event.note.duration);
      } else if (event.type === "chord") {
        event.notes.forEach((note) => noteDurations.push(note.duration));
      }
    }

    if (noteDurations.length > 0) {
      const avgDuration =
        noteDurations.reduce((sum, dur) => sum + dur, 0) / noteDurations.length;
      expect(avgDuration).toBeGreaterThan(1500); // Should be longer than regular music
      expect(Math.min(...noteDurations)).toBeGreaterThanOrEqual(800); // Min duration check
    }
  });

  it("should stay in mid-range octaves for pleasant sound", () => {
    const octaves: number[] = [];

    // Collect octaves
    for (let i = 0; i < 50; i++) {
      const event = generateElevatorMusicEvent();
      if (event.type === "note") {
        octaves.push(event.note.octave);
      } else if (event.type === "chord") {
        event.notes.forEach((note) => octaves.push(note.octave));
      }
    }

    if (octaves.length > 0) {
      // All octaves should be in the pleasant mid-range
      expect(Math.min(...octaves)).toBeGreaterThanOrEqual(3);
      expect(Math.max(...octaves)).toBeLessThanOrEqual(6);
    }
  });

  it("should support elevator mode in main generateMidiEvent function", () => {
    // Test that elevator mode parameter works
    const regularEvent = generateMidiEvent(null, false);
    const elevatorEvent = generateMidiEvent(null, true);

    expect(regularEvent).toBeDefined();
    expect(elevatorEvent).toBeDefined();

    // Elevator event should have elevator characteristics if it's a musical event
    if (elevatorEvent.type === "note" || elevatorEvent.type === "chord") {
      expect(elevatorEvent.currentScale).toBe("major");
    }
  });
});
