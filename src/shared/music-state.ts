import { default as io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { MidiEvent, Note, WeatherData } from "./types";

// Event types for subscribers
export type MusicStateEvent =
  | { type: "notes-updated" }
  | { type: "weather-updated" }
  | { type: "key-updated" }
  | { type: "pedals-updated" }
  | { type: "all-notes-off" };

// Subscriber callback type
type SubscriberCallback = (event: MusicStateEvent) => void;

/**
 * Shared music state service that maintains piano state across components
 */
class MusicStateService {
  // Socket connection
  private socket = io();

  // State variables
  private notesPlaying: Note[] = [];
  private weatherData: WeatherData | null = null;
  private currentKey: string = "";
  private currentScale: string = "";

  // Pedal status
  private pedalStatus = {
    sustain: 0,
    sostenuto: 0,
    soft: 0,
  };

  // Subscribers for state changes
  private subscribers: SubscriberCallback[] = [];

  constructor() {
    this.initSocketListeners();
  }

  // Initialize socket event listeners
  private initSocketListeners() {
    this.socket.on("connect", () => {
      console.log("Connected to server");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    // Handle MIDI events from server
    this.socket.on("midi", (event: MidiEvent) => {
      this.handleMidiEvent(event);
    });

    // Handle weather updates
    this.socket.on("weather", (weatherData: WeatherData) => {
      console.log(
        `Received weather data: ${weatherData.temperature}°C, ${weatherData.weatherDescription}`,
      );
      this.weatherData = weatherData;

      // Ensure the weather data is properly set before notifying subscribers
      setTimeout(() => {
        console.log("Notifying subscribers about weather update");
        this.notifySubscribers({ type: "weather-updated" });
      }, 0);
    });
  }

  // Handle MIDI events and update state
  private handleMidiEvent(event: MidiEvent) {
    switch (event.type) {
      case "note":
        // Update key and scale
        this.currentKey = event.currentKey;
        this.currentScale = event.currentScale;

        // Add timestamp to the note for tracking
        event.note._startTime = Date.now();
        this.notesPlaying.push(event.note);

        this.notifySubscribers({ type: "notes-updated" });
        this.notifySubscribers({ type: "key-updated" });
        break;

      case "chord":
      case "counterpoint":
        // Update key and scale
        this.currentKey = event.currentKey;
        this.currentScale = event.currentScale;

        // Add all notes in the chord or counterpoint
        event.notes.forEach((note) => {
          // Add timestamp to the note for tracking
          note._startTime = Date.now();
          this.notesPlaying.push(note);
        });

        this.notifySubscribers({ type: "notes-updated" });
        this.notifySubscribers({ type: "key-updated" });
        break;

      case "pedal":
        if (event.pedal.type === "sustain") {
          this.pedalStatus.sustain = event.pedal.value;
        } else if (event.pedal.type === "sostenuto") {
          this.pedalStatus.sostenuto = event.pedal.value;
        } else if (event.pedal.type === "soft") {
          this.pedalStatus.soft = event.pedal.value;
        }

        this.notifySubscribers({ type: "pedals-updated" });
        break;

      case "allNotesOff":
        this.notesPlaying = [];
        this.notifySubscribers({ type: "all-notes-off" });
        break;
    }

    // Cleanup notes that are finished playing
    this.cleanupFinishedNotes();
  }

  // Remove notes that have finished playing
  private cleanupFinishedNotes() {
    const now = Date.now();
    this.notesPlaying = this.notesPlaying.filter((note) => {
      return (note._startTime || 0) + note.duration > now;
    });
  }

  // Notify all subscribers of state changes
  private notifySubscribers(event: MusicStateEvent) {
    this.subscribers.forEach((callback) => {
      callback(event);
    });
  }

  // Public methods

  // Subscribe to state changes
  public subscribe(callback: SubscriberCallback): number {
    this.subscribers.push(callback);
    return this.subscribers.length - 1;
  }

  // Unsubscribe from state changes
  public unsubscribe(index: number) {
    if (index >= 0 && index < this.subscribers.length) {
      this.subscribers.splice(index, 1);
    }
  }

  // Get active notes
  public getNotesPlaying(): Note[] {
    this.cleanupFinishedNotes();
    return [...this.notesPlaying];
  }

  // Get current key and scale
  public getCurrentKey(): string {
    return this.currentKey;
  }

  public getCurrentScale(): string {
    return this.currentScale;
  }

  // Get pedal status
  public getPedalStatus() {
    return { ...this.pedalStatus };
  }

  // Get current weather data
  public getWeatherData(): WeatherData | null {
    return this.weatherData;
  }

  // Set weather data and notify server
  public setWeatherData(weatherData: WeatherData) {
    this.weatherData = weatherData;
    this.socket.emit("weather", weatherData);
    this.notifySubscribers({ type: "weather-updated" });
  }

  // Send commands to server
  public start() {
    this.socket.emit("start");
  }

  public stop() {
    this.socket.emit("stop");
  }

  // Get the socket instance directly if needed
  public getSocket() {
    return this.socket;
  }
}

// Create singleton instance
export const musicState = new MusicStateService();

// Add missing property to Note interface for tracking
declare module "./types" {
  interface Note {
    _startTime?: number;
  }
}
