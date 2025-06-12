import { generateMidiEvent, setAirConditioningMode } from "../music-generator";
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

  describe("Air Conditioning + Birds + Beethoven Mode", () => {
    beforeEach(() => {
      // Enable air conditioning mode for these tests
      setAirConditioningMode(true);
    });

    afterEach(() => {
      // Disable air conditioning mode after tests
      setAirConditioningMode(false);
    });

    it("should generate air conditioning rumble (low bass notes)", () => {
      // Generate multiple events to catch air conditioning rumble
      let foundAirConditioningRumble = false;

      for (let i = 0; i < 20; i++) {
        const event = generateMidiEvent();

        if (event.type === "chord") {
          // Check for low bass notes characteristic of air conditioning rumble
          const hasLowBass = event.notes.some(
            (note) => note.octave <= 2 && note.velocity < 70,
          );
          const hasLongDuration = event.notes.some(
            (note) => note.duration > 2000,
          );

          if (hasLowBass && hasLongDuration) {
            foundAirConditioningRumble = true;
            break;
          }
        }
      }

      expect(foundAirConditioningRumble).toBe(true);
    });

    it("should generate bird chirps (high pitched short notes)", () => {
      // Generate multiple events to catch bird chirps
      let foundBirdChirp = false;

      for (let i = 0; i < 30; i++) {
        const event = generateMidiEvent();

        if (event.type === "counterpoint") {
          // Check for high pitched short notes characteristic of bird chirps
          const hasHighPitch = event.notes.some((note) => note.octave >= 6);
          const hasShortDuration = event.notes.some(
            (note) => note.duration < 400,
          );

          if (hasHighPitch && hasShortDuration) {
            foundBirdChirp = true;
            break;
          }
        }
      }

      expect(foundBirdChirp).toBe(true);
    });

    it("should use C minor key (Beethoven style)", () => {
      const event = generateMidiEvent();

      // Check that we're using the Beethoven-style key and scale
      if (
        event.type === "note" ||
        event.type === "chord" ||
        event.type === "counterpoint"
      ) {
        expect(event.currentKey).toBe("C");
        expect(event.currentScale).toBe("minor");
      }
    });

    it("should include sustain pedal for atmospheric effect", () => {
      // Generate multiple events to find sustain pedal usage
      let foundSustainPedal = false;

      for (let i = 0; i < 50; i++) {
        const event = generateMidiEvent();

        if (event.type === "pedal" && event.pedal.type === "sustain") {
          foundSustainPedal = true;
          expect(event.pedal.value).toBeGreaterThan(0);
          break;
        }
      }

      expect(foundSustainPedal).toBe(true);
    });
  });
});
