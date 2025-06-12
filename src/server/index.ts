import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { generateMidiEvent } from "./music-generator";
import { generateHauntedFurnitureEvent } from "./haunted-furniture-generator";
import { WeatherData } from "../shared/types";
import dotenv from "dotenv";
import { freepikService } from "./freepik-service";

// Interface for request stats
interface RequestStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastError: string;
  lastRequestTime: number;
  pendingRequest: boolean;
}

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Serve static files from the "dist/client" directory
app.use(express.static(path.join(__dirname, "../../client")));

// Send all requests to index.html so client-side routing works
// Use a RegExp route to bypass path-to-regexp's string parsing which has issues with colons
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/index.html"));
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Client connected");

  let playing = false;
  let intervalId: NodeJS.Timeout | null = null;
  let currentWeather: WeatherData | null = null;
  let freepikIntervalId: NodeJS.Timeout | null = null;

  // Start streaming MIDI events
  socket.on("start", () => {
    if (!playing) {
      playing = true;
      console.log("Starting MIDI stream");

      // Generate MIDI events at regular intervals
      intervalId = setInterval(() => {
        // Use the haunted furniture generator for issue #39
        const event = generateHauntedFurnitureEvent(currentWeather);
        socket.emit("midi", event);
      }, 120); // Slightly slower interval for more atmospheric timing
    }
  });

  // Handle weather updates from client
  socket.on("weather", (weatherData: WeatherData) => {
    console.log(
      `Weather update received: ${weatherData.temperature}°C, ${weatherData.weatherDescription}`,
    );
    currentWeather = weatherData;

    // Update Freepik service with weather data
    freepikService.updateWeather(weatherData);
  });

  // Handle notes updates for Freepik service
  socket.on(
    "notes-update",
    (data: { noteNames: string[]; midiNumbers: number[] }) => {
      freepikService.updateNotes(data.noteNames, data.midiNumbers);
    },
  );

  // Generate Freepik image
  socket.on("generate-image", async () => {
    try {
      console.log("Generating image from server...");

      // Check if there's already a pending request
      const debugInfo = freepikService.getDebugInfo();
      if ((debugInfo.requestStats as RequestStats).pendingRequest) {
        console.log(
          "Previous image generation still in progress, skipping this request",
        );
        socket.emit("image-error", {
          error:
            "A previous image generation is still in progress. Please wait for it to complete.",
        });
        return;
      }

      // Always check placeholder mode before doing anything
      // This prevents any accidental API calls when in gradient mode
      if (freepikService.getUsePlaceholder()) {
        console.log("Using gradient mode - no API call needed");
        const gradient = freepikService.generateGradient();
        const prompt = freepikService.getLastPrompt();
        socket.emit("image-generated", {
          imageUrl: gradient,
          isPlaceholder: true,
          prompt: prompt,
        });
        return;
      }

      // Only reaches this point if explicitly NOT in placeholder mode
      console.log("Using Freepik API mode - making external API request");
      const result = await freepikService.generateImage();
      socket.emit("image-generated", result);
    } catch (error) {
      console.error("Error generating image:", error);
      socket.emit("image-error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Generate gradient only (without API call)
  socket.on("generate-gradient", () => {
    const gradient = freepikService.generateGradient();
    const prompt = freepikService.getLastPrompt();
    socket.emit("image-generated", {
      imageUrl: gradient,
      isPlaceholder: true,
      prompt: prompt,
    });
  });

  // Start periodic image generation
  socket.on("start-image-generation", (interval = 105000) => {
    if (freepikIntervalId) {
      clearInterval(freepikIntervalId);
    }

    // Generate first image immediately - always check mode first
    if (freepikService.getUsePlaceholder()) {
      console.log(
        "Periodic generation starting in gradient mode - no API calls",
      );
      // In placeholder mode, always generate gradients without API calls
      const gradient = freepikService.generateGradient();
      const prompt = freepikService.getLastPrompt();
      socket.emit("image-generated", {
        imageUrl: gradient,
        isPlaceholder: true,
        prompt: prompt,
      });
    } else {
      console.log("Periodic generation starting in Freepik API mode");
      // Check if there's a pending request
      const debugInfo = freepikService.getDebugInfo();
      if ((debugInfo.requestStats as RequestStats).pendingRequest) {
        console.log(
          "Previous image generation still in progress, skipping immediate generation",
        );
      } else {
        freepikService
          .generateImage()
          .then((result) => socket.emit("image-generated", result))
          .catch((error) =>
            socket.emit("image-error", {
              error: error instanceof Error ? error.message : String(error),
            }),
          );
      }
    }

    // Set up interval for future generations
    freepikIntervalId = setInterval(async () => {
      try {
        // Check if there's a pending request - if so, skip this iteration
        const debugInfo = freepikService.getDebugInfo();
        if ((debugInfo.requestStats as RequestStats).pendingRequest) {
          console.log(
            "Previous image generation still in progress, skipping this interval",
          );
          return;
        }

        // Always check current mode before each interval
        if (freepikService.getUsePlaceholder()) {
          // Generate gradient without API call
          const gradient = freepikService.generateGradient();
          const prompt = freepikService.getLastPrompt();
          socket.emit("image-generated", {
            imageUrl: gradient,
            isPlaceholder: true,
            prompt: prompt,
          });
        } else {
          // Only use API when explicitly in API mode
          const result = await freepikService.generateImage();
          socket.emit("image-generated", result);
        }
      } catch (error) {
        socket.emit("image-error", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, interval);

    console.log(
      `Started periodic image generation with interval: ${interval}ms`,
    );
  });

  // Stop periodic image generation
  socket.on("stop-image-generation", () => {
    if (freepikIntervalId) {
      clearInterval(freepikIntervalId);
      freepikIntervalId = null;
      console.log("Stopped periodic image generation");
    }
  });

  // Get Freepik API debug info
  socket.on("get-freepik-debug", () => {
    const debugInfo = freepikService.getDebugInfo();
    socket.emit("freepik-debug", debugInfo);
  });

  // Toggle placeholder mode
  socket.on("set-use-placeholder", (value: boolean) => {
    console.log(`Setting placeholder mode to: ${value ? "ON" : "OFF"}`);
    const switchedToApiMode = freepikService.setUsePlaceholder(value);

    // If switching from placeholder to API mode, immediately generate an image
    if (switchedToApiMode) {
      console.log("Switched to API mode - immediately generating first image");
      // Only generate if there's no pending request
      const debugInfo = freepikService.getDebugInfo();
      if (!(debugInfo.requestStats as RequestStats).pendingRequest) {
        freepikService
          .generateImage()
          .then((result) => socket.emit("image-generated", result))
          .catch((error) =>
            socket.emit("image-error", {
              error: error instanceof Error ? error.message : String(error),
            }),
          );
      }
    }

    // Send updated debug info
    socket.emit("freepik-debug", freepikService.getDebugInfo());
  });

  // Stop streaming MIDI events
  socket.on("stop", () => {
    if (playing && intervalId) {
      clearInterval(intervalId);
      playing = false;
      console.log("Stopped MIDI stream");

      // Send all notes off message
      socket.emit("midi", { type: "allNotesOff" });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    if (freepikIntervalId) {
      clearInterval(freepikIntervalId);
    }
    console.log("Client disconnected");
  });

  // Handle weather data request from client (useful for Edge browser)
  socket.on("request-weather-data", () => {
    console.log("Weather data requested by client");
    if (currentWeather) {
      console.log("Sending cached weather data to client");
      socket.emit("weather", currentWeather);
    } else {
      console.log("No weather data available to send");
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});

export default server;
