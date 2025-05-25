import { WeatherData } from "../shared/types";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Interfaces for the Freepik API
interface FreepikImageGenerationRequest {
  prompt: string;
  resolution?: "1k" | "2k" | "4k";
  aspect_ratio?:
    | "square_1_1"
    | "classic_4_3"
    | "traditional_3_4"
    | "widescreen_16_9"
    | "social_story_9_16"
    | "smartphone_horizontal_20_9"
    | "smartphone_vertical_9_20"
    | "standard_3_2"
    | "portrait_2_3"
    | "horizontal_2_1"
    | "vertical_1_2"
    | "social_5_4"
    | "social_post_4_5";
  realism?: boolean;
  creative_detailing?: number;
  engine?:
    | "automatic"
    | "magnific_illusio"
    | "magnific_sharpy"
    | "magnific_sparkle";
  fixed_generation?: boolean;
  webhook_url?: string;
  structure_reference?: string;
  structure_strength?: number;
  style_reference?: string;
  adherence?: number;
  hdr?: number;
  model?: string;
  filter_nsfw?: boolean;
  styling?: {
    styles?: Array<{ name: string; strength: number }>;
    characters?: Array<{ id: string; strength: number }>;
    colors?: Array<{ color: string; weight: number }>;
  };
}

interface FreepikTaskResponse {
  task_id: string;
  task_status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  generated: string[];
}

interface FreepikCompletedTaskResponse {
  data: {
    generated: string[];
    task_id: string;
    status: "COMPLETED";
    has_nsfw: boolean[];
  };
}

// Structure to track active notes
interface ActiveNotes {
  noteNames: string[];
  count: number;
  highestNote: number;
  lowestNote: number;
}

export class FreepikService {
  private baseUrl = "https://api.freepik.com/v1/ai/mystic";
  private apiKey = process.env.FREEPIK_API_KEY || "";
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

  constructor() {
    // Always start in placeholder mode regardless of API key availability
    // This ensures we don't make API calls unless explicitly requested
    this.usePlaceholder = true;

    console.log("Starting in gradient mode for reduced network usage");

    if (!this.apiKey || this.apiKey.trim() === "") {
      console.log("No Freepik API key found - API mode will not be available");
    } else {
      console.log("Freepik API key configured - API mode available on demand");
    }
  }

  // Update the active notes being played
  public updateNotes(noteNames: string[], midiNumbers: number[] = []) {
    this.activeNotes.noteNames = noteNames;
    this.activeNotes.count = noteNames.length;

    if (midiNumbers.length > 0) {
      this.activeNotes.highestNote = Math.max(...midiNumbers);
      this.activeNotes.lowestNote = Math.min(...midiNumbers);
    }
  }

  // Update the weather data
  public updateWeather(weather: WeatherData) {
    this.weatherData = weather;
  }

  // Set use placeholder mode
  public setUsePlaceholder(value: boolean) {
    this.usePlaceholder = value;
  }

  // Generate a CSS gradient directly without attempting an API call
  public generateGradient(): string {
    const prompt = this.generatePrompt();
    const colors = this.getColorsFromPrompt(prompt);
    return this.generatePlaceholderImage(colors);
  }

  // Get the placeholder mode status
  public getUsePlaceholder(): boolean {
    return this.usePlaceholder;
  }

  // Generate a prompt based on current music and weather
  public generatePrompt(): string {
    // Start with a base prompt for a minimalist abstract sea of color
    let prompt = "Minimalist abstract sea of color";

    // Add color influence based on notes being played
    if (this.activeNotes.count > 0) {
      // Add color variation based on note range
      if (this.activeNotes.highestNote > 80) {
        // Higher notes
        prompt += ", with bright yellow and white colors in the upper areas";
      } else if (this.activeNotes.lowestNote < 48) {
        // Lower notes
        prompt += ", with deep blue and purple hues in the lower areas";
      } else {
        // Middle range
        prompt += ", with balanced green and cyan tones throughout";
      }

      // Add texture based on number of notes
      if (this.activeNotes.count > 4) {
        prompt += ", complex layered textures";
      } else if (this.activeNotes.count > 0) {
        prompt += ", simple flowing textures";
      }
    } else {
      // Default when no notes are playing
      prompt += ", calm and serene, minimal texture";
    }

    // Add weather influence if available
    if (this.weatherData) {
      // Temperature influence
      if (this.weatherData.temperature < 0) {
        prompt += ", cold blue and white tones";
      } else if (this.weatherData.temperature < 10) {
        prompt += ", cool cyan and light blue palette";
      } else if (this.weatherData.temperature > 30) {
        prompt += ", warm red and orange hues";
      } else if (this.weatherData.temperature > 20) {
        prompt += ", golden yellow and amber shades";
      }

      // Weather condition influence
      const code = this.weatherData.weatherCode;
      if ([0, 1].includes(code)) {
        // Clear
        prompt += ", clear and radiant, high contrast";
      } else if ([2, 3].includes(code)) {
        // Cloudy
        prompt += ", soft diffused light, gentle gradients";
      } else if (
        [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
      ) {
        // Rain
        prompt += ", vertical flowing lines, water-like reflections";
      } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
        // Snow
        prompt += ", delicate white particles, soft texture";
      } else if ([95, 96, 99].includes(code)) {
        // Thunderstorm
        prompt += ", dramatic contrasts, electric energy";
      }
    }

    // Add style qualifiers to ensure minimalist abstraction
    prompt +=
      ", ultra minimalist, color field painting style, rothko-inspired, digital art";

    this.lastPrompt = prompt;
    return prompt;
  }

  // Get the last generated prompt
  public getLastPrompt(): string {
    return this.lastPrompt;
  }

  // Get debug information about API requests
  public getDebugInfo(): Record<string, unknown> {
    return {
      apiConfigured: !!this.apiKey && this.apiKey.trim() !== "",
      usePlaceholder: this.usePlaceholder,
      requestStats: { ...this.requestStats },
      activeNotes: { ...this.activeNotes },
      weatherData: this.weatherData,
      lastPrompt: this.lastPrompt,
    };
  }

  // Generate an image using the Freepik API
  public async generateImage(): Promise<{
    imageUrl: string;
    isPlaceholder: boolean;
    prompt: string;
  }> {
    const prompt = this.generatePrompt();
    this.requestStats.totalRequests++;
    this.requestStats.lastRequestTime = Date.now();
    this.requestStats.pendingRequest = true;

    if (this.usePlaceholder || !this.apiKey) {
      console.log(`Using placeholder image with prompt: ${prompt}`);
      const colors = this.getColorsFromPrompt(prompt);

      // Simulate some delay to avoid instant changes
      await new Promise((resolve) => setTimeout(resolve, 500));

      this.requestStats.pendingRequest = false;
      const gradient = this.generatePlaceholderImage(colors);
      return {
        imageUrl: gradient,
        isPlaceholder: true,
        prompt: this.lastPrompt,
      };
    }

    try {
      // Create request body according to Freepik API documentation
      const requestBody: FreepikImageGenerationRequest = {
        prompt: prompt,
        resolution: "2k", // Default resolution
        aspect_ratio: "square_1_1", // Default aspect ratio
        realism: true, // Default value
        creative_detailing: 33, // Default value
        engine: "automatic", // Default engine
        fixed_generation: false, // Default value
      };

      // Customize some settings based on weather and notes
      if (this.weatherData) {
        // More creative and less realistic for extreme weather
        if ([95, 96, 99].includes(this.weatherData.weatherCode)) {
          // Thunderstorm
          requestBody.creative_detailing = 50;
          requestBody.realism = false;
        }

        // Better aspect ratio for displaying on the visualization canvas
        if (this.activeNotes.count > 3) {
          requestBody.aspect_ratio = "square_1_1"; // More complex visualization
        } else {
          requestBody.aspect_ratio = "horizontal_2_1"; // Wider landscape for simpler scenes
        }

        // Choose engine based on weather
        if ([0, 1].includes(this.weatherData.weatherCode)) {
          // Clear
          requestBody.engine = "magnific_sharpy"; // Sharper detail for clear days
        } else if (
          [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(
            this.weatherData.weatherCode,
          )
        ) {
          // Rain
          requestBody.engine = "magnific_illusio"; // Softer for rainy days
        } else {
          requestBody.engine = "magnific_sparkle"; // Middle ground for other conditions
        }
      }

      console.log("Requesting image generation from Freepik API...");

      // Step 1: Create the task
      const taskResponse = await this.createImageTask(requestBody);

      // Step 2: Poll for task completion
      const imageUrl = await this.pollTaskStatus(taskResponse.task_id);

      this.requestStats.successfulRequests++;
      this.requestStats.pendingRequest = false;

      return {
        imageUrl,
        isPlaceholder: false,
        prompt: this.lastPrompt,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error generating image with Freepik API:", errorMessage);

      // Update stats
      this.requestStats.failedRequests++;
      this.requestStats.lastError = errorMessage;
      this.requestStats.pendingRequest = false;

      // Fallback to placeholder image on error
      const colors = this.getColorsFromPrompt(prompt);
      return {
        imageUrl: this.generatePlaceholderImage(colors),
        isPlaceholder: true,
        prompt: this.lastPrompt,
      };
    }
  }

  // Create an image generation task
  private async createImageTask(
    requestBody: FreepikImageGenerationRequest,
  ): Promise<FreepikTaskResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-freepik-api-key": this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const statusDetail = `${response.status} ${response.statusText}`;
        const errorMessage = `Failed to create image task: ${statusDetail}. Details: ${errorText}`;
        this.requestStats.lastError = errorMessage;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Image task created successfully:", data);
      console.log(`Task created successfully: ${data.data.task_id}`);
      return data.data as FreepikTaskResponse;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.requestStats.lastError = `Task creation failed: ${errorMessage}`;
      throw error;
    }
  }

  // Poll for task completion
  private async pollTaskStatus(
    taskId: string,
    maxAttempts = 30,
    delayMs = 2000,
  ): Promise<string> {
    console.log(`Polling for task ${taskId} completion...`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/${taskId}`, {
          method: "GET",
          headers: {
            "x-freepik-api-key": this.apiKey,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          const statusDetail = `${response.status} ${response.statusText}`;
          console.warn(
            `Error checking task status: ${statusDetail}. Details: ${errorText}`,
          );
          // Continue polling despite error
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        const taskInfo = await response.json();

        if (taskInfo.data && taskInfo.data.status === "COMPLETED") {
          console.log("Task completed successfully");
          const completedResponse = taskInfo as FreepikCompletedTaskResponse;
          // Use the first image URL from the 'generated' array
          return completedResponse.data.generated[0];
        }

        if (taskInfo.data && taskInfo.data.status === "FAILED") {
          const errorMessage = `Task ${taskId} failed: ${JSON.stringify(taskInfo)}`;
          this.requestStats.lastError = errorMessage;
          throw new Error(errorMessage);
        }

        console.log(
          `Task status: ${taskInfo.task_status || "IN_PROGRESS"} (attempt ${attempt + 1}/${maxAttempts}), waiting...`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`Error polling task: ${errorMessage}`);
        this.requestStats.lastError = `Poll error: ${errorMessage}`;
        // Continue polling despite error
      }

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const timeoutError = `Task did not complete after ${maxAttempts} attempts`;
    this.requestStats.lastError = timeoutError;
    throw new Error(timeoutError);
  }

  // Extract dominant colors from the prompt to use for our placeholder
  private getColorsFromPrompt(prompt: string): string[] {
    const colorMap: { [key: string]: string } = {
      blue: "#0066cc",
      "deep blue": "#003366",
      "light blue": "#66ccff",
      purple: "#6600cc",
      yellow: "#ffcc00",
      "bright yellow": "#ffff00",
      white: "#ffffff",
      green: "#00cc66",
      cyan: "#00cccc",
      red: "#cc0000",
      orange: "#ff6600",
      golden: "#cc9900",
      amber: "#ffbf00",
    };

    // Extract colors mentioned in the prompt
    const colors: string[] = [];
    Object.keys(colorMap).forEach((color) => {
      if (prompt.includes(color)) {
        colors.push(colorMap[color]);
      }
    });

    // Add some defaults if no colors were found
    if (colors.length === 0) {
      colors.push("#0066cc", "#00cc66", "#ffcc00");
    }

    return colors;
  }

  // Generate a CSS gradient as a placeholder for the actual API image
  private generatePlaceholderImage(colors: string[]): string {
    // Ensure we have at least 2 colors for the gradient
    if (colors.length === 1) {
      colors.push("#000000");
    }

    // Create a CSS gradient based on the extracted colors
    let gradientType = "linear-gradient(";

    // Add different angles based on weather if available
    if (this.weatherData) {
      if (
        [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(
          this.weatherData.weatherCode,
        )
      ) {
        // Rain - vertical gradient
        gradientType += "180deg, ";
      } else if (this.weatherData.temperature > 25) {
        // Hot - diagonal gradient
        gradientType += "135deg, ";
      } else {
        // Default - radial gradient for other conditions
        gradientType = "radial-gradient(circle, ";
      }
    } else {
      // Random angle if no weather data
      const angle = Math.floor(Math.random() * 360);
      gradientType += `${angle}deg, `;
    }

    // Add color stops
    colors.forEach((color, index) => {
      const percentage = Math.floor((index / (colors.length - 1)) * 100);
      gradientType += `${color} ${percentage}%`;

      if (index < colors.length - 1) {
        gradientType += ", ";
      }
    });

    gradientType += ")";
    return gradientType;
  }
}

// Create a singleton instance
export const freepikService = new FreepikService();
