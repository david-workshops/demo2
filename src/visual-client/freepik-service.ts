import { WeatherData } from "../shared/types";
import { musicState } from "../shared/music-state";

// Structure to track active notes
interface ActiveNotes {
  noteNames: string[];
  count: number;
  highestNote: number;
  lowestNote: number;
}

// Interface for debug information
interface DebugInfo {
  apiConfigured: boolean;
  usePlaceholder: boolean;
  requestStats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    lastError: string;
    lastRequestTime: number;
    pendingRequest: boolean;
  };
  activeNotes: ActiveNotes;
  weatherData: WeatherData | null;
  lastPrompt: string;
}

// Interface for the image generation result from the server
interface ImageGenerationResult {
  imageUrl: string;
  isPlaceholder: boolean;
  prompt: string;
}

export class FreepikService {
  private lastPrompt = "";
  private activeNotes: ActiveNotes = {
    noteNames: [],
    count: 0,
    highestNote: 0,
    lowestNote: 127,
  };
  private weatherData: WeatherData | null = null;
  private usePlaceholder = true;
  private requestStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    lastError: "",
    lastRequestTime: 0,
    pendingRequest: false,
  };
  private debugInfo: DebugInfo | null = null;
  private socket = musicState.getSocket();

  constructor() {
    // Always start in gradient mode to reduce API usage
    this.usePlaceholder = true;

    // Initialize event listeners for server responses
    this.initSocketListeners();

    // Let server know we're in gradient mode
    this.socket.emit("set-use-placeholder", true);

    // Get initial debug info from server
    this.socket.emit("get-freepik-debug");
  }

  // Initialize socket event listeners
  private initSocketListeners() {
    // Handle debug info updates
    this.socket.on("freepik-debug", (debugInfo: DebugInfo) => {
      this.debugInfo = debugInfo;
      this.usePlaceholder = debugInfo.usePlaceholder;
      this.requestStats = { ...debugInfo.requestStats };
      this.lastPrompt = debugInfo.lastPrompt;
    });

    // Handle image generation responses
    this.socket.on("image-generated", (result: ImageGenerationResult) => {
      // Update local prompt
      this.lastPrompt = result.prompt;

      // Update request stats
      this.requestStats.pendingRequest = false;
      this.requestStats.successfulRequests++;

      // Get updated debug info
      this.socket.emit("get-freepik-debug");
    });

    // Handle error responses
    this.socket.on("image-error", ({ error }: { error: string }) => {
      this.requestStats.pendingRequest = false;
      this.requestStats.failedRequests++;
      this.requestStats.lastError = error;

      // Get updated debug info
      this.socket.emit("get-freepik-debug");
    });
  }

  // Update the active notes being played
  public updateNotes(noteNames: string[], midiNumbers: number[] = []) {
    this.activeNotes.noteNames = noteNames;
    this.activeNotes.count = noteNames.length;

    if (midiNumbers.length > 0) {
      this.activeNotes.highestNote = Math.max(...midiNumbers);
      this.activeNotes.lowestNote = Math.min(...midiNumbers);
    }

    // Send the note data to the server
    this.socket.emit("notes-update", {
      noteNames,
      midiNumbers,
    });
  }

  // Update the weather data
  public updateWeather(weather: WeatherData) {
    this.weatherData = weather;
    // Weather is already sent to server via musicState
  }

  // Get the last generated prompt
  public getLastPrompt(): string {
    return this.lastPrompt;
  }

  // Get debug information about API requests
  public getDebugInfo(): DebugInfo {
    // If we have debug info from the server, use that
    if (this.debugInfo) {
      return { ...this.debugInfo };
    }

    // Otherwise, use local info
    return {
      apiConfigured: false, // We don't know until we get server response
      usePlaceholder: this.usePlaceholder,
      requestStats: { ...this.requestStats },
      activeNotes: { ...this.activeNotes },
      weatherData: this.weatherData,
      lastPrompt: this.lastPrompt,
    };
  }

  // Generate an image using the server API
  public async generateImage(): Promise<string> {
    this.requestStats.totalRequests++;
    this.requestStats.lastRequestTime = Date.now();
    this.requestStats.pendingRequest = true;

    // If we're in placeholder mode (gradient), don't make API calls
    if (this.usePlaceholder) {
      // Request a gradient from the server directly
      return new Promise((resolve, reject) => {
        const onImageGenerated = (result: ImageGenerationResult) => {
          this.socket.off("image-generated", onImageGenerated);
          this.socket.off("image-error", onImageError);
          resolve(result.imageUrl);

          // Update request stats
          this.requestStats.pendingRequest = false;
          this.requestStats.successfulRequests++;
        };

        const onImageError = ({ error }: { error: string }) => {
          this.socket.off("image-generated", onImageGenerated);
          this.socket.off("image-error", onImageError);
          reject(new Error(error));

          // Update request stats
          this.requestStats.pendingRequest = false;
          this.requestStats.failedRequests++;
          this.requestStats.lastError = error;
        };

        // Register the listeners
        this.socket.once("image-generated", onImageGenerated);
        this.socket.once("image-error", onImageError);

        // Request a gradient directly
        this.socket.emit("generate-gradient");
      });
    }

    return new Promise((resolve, reject) => {
      // Set up a one-time listener for the response
      const onImageGenerated = (result: ImageGenerationResult) => {
        // Clean up listeners
        this.socket.off("image-generated", onImageGenerated);
        this.socket.off("image-error", onImageError);

        if (result.isPlaceholder) {
          // For CSS gradient, just return it directly
          resolve(result.imageUrl);
        } else {
          // For real image URL, format it for CSS
          resolve(`url(${result.imageUrl})`);
        }
      };

      const onImageError = ({ error }: { error: string }) => {
        // Clean up listeners
        this.socket.off("image-generated", onImageGenerated);
        this.socket.off("image-error", onImageError);

        reject(new Error(error));
      };

      // Register the listeners
      this.socket.once("image-generated", onImageGenerated);
      this.socket.once("image-error", onImageError);

      // Request image generation from server
      this.socket.emit("generate-image");
    });
  }

  // Start periodic image generation
  public startPeriodicGeneration(interval = 145000) {
    this.socket.emit("start-image-generation", interval);
  }

  // Stop periodic image generation
  public stopPeriodicGeneration() {
    this.socket.emit("stop-image-generation");
  }

  // Set visualization mode to use placeholders (gradients) or API images
  public setUsePlaceholder(value: boolean) {
    this.usePlaceholder = value;
    this.socket.emit("set-use-placeholder", value);
  }

  // Get current placeholder usage status
  public getUsePlaceholder(): boolean {
    return this.usePlaceholder;
  }

  // Toggle between placeholder and API mode
  public togglePlaceholderMode(): boolean {
    this.usePlaceholder = !this.usePlaceholder;
    this.socket.emit("set-use-placeholder", this.usePlaceholder);
    return this.usePlaceholder;
  }
}
