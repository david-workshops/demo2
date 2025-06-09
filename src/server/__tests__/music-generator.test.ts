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
      expect(event.note.octave).toBeLessThanOrEqual(8);
      expect(event.note.midiNumber).toBeGreaterThan(0);
      expect(event.note.velocity).toBeGreaterThanOrEqual(0);
      expect(event.note.velocity).toBeLessThanOrEqual(127);
      expect(event.note.duration).toBeGreaterThan(0);
      expect(event.currentKey).toBeDefined();
      expect(event.currentScale).toBeDefined();
    } else if (
      event.type === "chord" ||
      event.type === "counterpoint" ||
      event.type === "birdTweet" ||
      event.type === "leafRustle"
    ) {
      expect(event.notes).toBeInstanceOf(Array);
      expect(event.notes.length).toBeGreaterThan(0);
      expect(event.currentKey).toBeDefined();
      expect(event.currentScale).toBeDefined();

      // Additional validation for bird tweets and leaf rustles
      if (event.type === "birdTweet") {
        expect(event.notes.length).toBeGreaterThanOrEqual(2);
        expect(event.notes.length).toBeLessThanOrEqual(4);
        // Bird tweets should be in high octaves
        event.notes.forEach((note) => {
          expect(note.octave).toBeGreaterThanOrEqual(5);
          expect(note.duration).toBeLessThan(250); // Quick chirps
        });
      } else if (event.type === "leafRustle") {
        expect(event.notes.length).toBeGreaterThanOrEqual(3);
        expect(event.notes.length).toBeLessThanOrEqual(6);
        // Leaf rustles should be soft and in mid-low range
        event.notes.forEach((note) => {
          expect(note.velocity).toBeLessThanOrEqual(60); // Soft sounds
          expect(note.octave).toBeLessThanOrEqual(5); // Mid-low range
        });
      }
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

    for (let i = 0; i < 200; i++) {
      const event = generateMidiEvent();
      eventTypes.add(event.type);

      // If we've seen all event types, break early
      if (eventTypes.size >= 6) break; // note, chord, counterpoint, pedal, silence, birdTweet, leafRustle
    }

    // We should observe at least 4 different event types
    expect(eventTypes.size).toBeGreaterThanOrEqual(4);
  });

  it("should generate bird tweets with appropriate characteristics", () => {
    // Generate many events and find bird tweets
    let birdTweetFound = false;

    for (let i = 0; i < 300; i++) {
      const event = generateMidiEvent();
      if (event.type === "birdTweet") {
        birdTweetFound = true;

        // Bird tweets should have 2-4 notes
        expect(event.notes.length).toBeGreaterThanOrEqual(2);
        expect(event.notes.length).toBeLessThanOrEqual(4);

        // All notes should be high-pitched and quick
        event.notes.forEach((note) => {
          expect(note.octave).toBeGreaterThanOrEqual(5); // High register
          expect(note.octave).toBeLessThanOrEqual(8);
          expect(note.duration).toBeLessThan(250); // Quick chirps
          expect(note.velocity).toBeGreaterThanOrEqual(50);
          expect(note.velocity).toBeLessThanOrEqual(90);
        });

        break;
      }
    }

    expect(birdTweetFound).toBe(true);
  });

  it("should generate leaf rustles with appropriate characteristics", () => {
    // Generate many events and find leaf rustles
    let leafRustleFound = false;

    for (let i = 0; i < 300; i++) {
      const event = generateMidiEvent();
      if (event.type === "leafRustle") {
        leafRustleFound = true;

        // Leaf rustles should have 3-6 notes
        expect(event.notes.length).toBeGreaterThanOrEqual(3);
        expect(event.notes.length).toBeLessThanOrEqual(6);

        // All notes should be soft and in mid-low register
        event.notes.forEach((note) => {
          expect(note.octave).toBeGreaterThanOrEqual(2); // Mid-low register
          expect(note.octave).toBeLessThanOrEqual(5);
          expect(note.velocity).toBeGreaterThanOrEqual(25); // Soft
          expect(note.velocity).toBeLessThanOrEqual(60);
          expect(note.duration).toBeGreaterThanOrEqual(300); // Longer than bird tweets
          expect(note.duration).toBeLessThanOrEqual(1100);
        });

        break;
      }
    }

    expect(leafRustleFound).toBe(true);
  });
});
