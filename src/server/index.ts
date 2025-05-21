import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { generateMidiEvent } from "./music-generator";
import { WeatherData } from "../shared/types";
import dotenv from "dotenv";
import { freepikService } from "./freepik-service";

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
app.get("*", (_req, res) => {
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
        const event = generateMidiEvent(currentWeather);
        socket.emit("midi", event);
      }, 100); // Generate events every 100ms (adjust as needed)
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
      const result = await freepikService.generateImage();
      socket.emit("image-generated", result);
    } catch (error) {
      console.error("Error generating image:", error);
      socket.emit("image-error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Start periodic image generation
  socket.on("start-image-generation", (interval = 45000) => {
    if (freepikIntervalId) {
      clearInterval(freepikIntervalId);
    }

    // Generate first image immediately
    freepikService
      .generateImage()
      .then((result) => socket.emit("image-generated", result))
      .catch((error) =>
        socket.emit("image-error", {
          error: error instanceof Error ? error.message : String(error),
        }),
      );

    // Set up interval for future generations
    freepikIntervalId = setInterval(async () => {
      try {
        const result = await freepikService.generateImage();
        socket.emit("image-generated", result);
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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});

export default server;
