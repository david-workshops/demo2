import { generateMidiEvent } from '../music-generator';
import { MidiEvent } from '../../shared/types';

describe('Music Generator', () => {
  it('should generate valid MIDI events', () => {
    const event = generateMidiEvent();
    expect(event).toBeDefined();
    expect(event.type).toBeDefined();
    
    // Test specific event types
    if (event.type === 'note') {
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
    } else if (event.type === 'chord' || event.type === 'counterpoint') {
      expect(event.notes).toBeInstanceOf(Array);
      expect(event.notes.length).toBeGreaterThan(0);
      expect(event.currentKey).toBeDefined();
      expect(event.currentScale).toBeDefined();
    } else if (event.type === 'pedal') {
      expect(event.pedal).toBeDefined();
      expect(['sustain', 'sostenuto', 'soft']).toContain(event.pedal.type);
      expect(event.pedal.value).toBeGreaterThanOrEqual(0);
      expect(event.pedal.value).toBeLessThanOrEqual(1);
    } else if (event.type === 'silence') {
      expect(event.duration).toBeGreaterThan(0);
    }
  });
  
  it('should generate multiple events without errors', () => {
    // Generate multiple events to test consistency
    for (let i = 0; i < 20; i++) {
      const event = generateMidiEvent();
      expect(event).toBeDefined();
    }
  });

  it('should generate different types of events', () => {
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