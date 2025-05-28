import { MusicStateEvent, musicState } from "../shared/music-state";
import { FreepikService } from "./freepik-service";

// DOM elements
const currentImageElement = document.getElementById(
  "current-image",
) as HTMLDivElement;
const nextImageElement = document.getElementById(
  "next-image",
) as HTMLDivElement;
const promptInfoElement = document.getElementById("prompt-info") as HTMLElement;
const notesInfoElement = document.getElementById("notes-info") as HTMLElement;
const weatherInfoElement = document.getElementById(
  "weather-info",
) as HTMLElement;
const consoleOutput = document.getElementById("console-output") as HTMLElement;
const debugOverlay = document.getElementById("debug-overlay") as HTMLDivElement;
const fullscreenButton = document.getElementById(
  "fullscreen-btn",
) as HTMLButtonElement;
const modeToggleButton = document.getElementById(
  "mode-toggle-btn",
) as HTMLButtonElement;
const colorKey = document.getElementById("color-key") as HTMLDivElement;

// API debug elements
const apiConfiguredElement = document.getElementById(
  "api-configured",
) as HTMLElement;
const apiStatusElement = document.getElementById("api-status") as HTMLElement;
const apiRequestsElement = document.getElementById(
  "api-requests",
) as HTMLElement;
const apiErrorElement = document.getElementById("api-error") as HTMLElement;

// Initialize the service
const freepikService = new FreepikService();

// State variables
let isPlaying = false;
let fadeInProgress = false;
let mouseActivityTimeout: number | null = null;

// Constants
const IMAGE_UPDATE_INTERVAL = 45 * 1000; // 45 seconds
const FADE_TRANSITION_DURATION = 3000; // 3 seconds
const MOUSE_ACTIVITY_TIMEOUT = 3000; // 3 seconds

// Initialize visualization
async function initVisualization() {
  try {
    // Generate the first image via the server
    const imageUrl = await freepikService.generateImage();

    // Use the result either as a direct URL or as a CSS gradient
    currentImageElement.style.backgroundImage = imageUrl;
    if (imageUrl.startsWith("url(")) {
      logToConsole("Using real Freepik API image");
    } else {
      logToConsole("Using placeholder gradient image");
    }

    currentImageElement.style.opacity = "1";
    nextImageElement.style.opacity = "0";

    // Update the prompt info
    promptInfoElement.textContent = freepikService.getLastPrompt();

    logToConsole("Visualization initialized");
    return true;
  } catch (error) {
    logToConsole(`Error initializing visualization: ${error}`);
    return false;
  }
}

// Start the visualization automatically
function startVisualization() {
  if (isPlaying) return;

  isPlaying = true;
  logToConsole("Starting visualization");

  // Initialize the first image and start refresh cycle
  initVisualization().then(() => {
    // Start periodic image generation on the server
    freepikService.startPeriodicGeneration(IMAGE_UPDATE_INTERVAL);
  });

  // Tell the server we're starting
  musicState.start();
}

// Stop the visualization
function stopVisualization() {
  if (!isPlaying) return;

  isPlaying = false;
  freepikService.stopPeriodicGeneration();
  musicState.stop();
  logToConsole("Visualization stopped");
}

// Update API debug information
function updateApiDebugInfo() {
  const debugInfo = freepikService.getDebugInfo();

  // Update API configuration status
  apiConfiguredElement.textContent = debugInfo.apiConfigured ? "YES" : "NO";
  apiConfiguredElement.className =
    "info-value " + (debugInfo.apiConfigured ? "success" : "error");

  // Update current API status
  if (debugInfo.usePlaceholder) {
    apiStatusElement.textContent = "USING PLACEHOLDER (CSS GRADIENTS)";
    apiStatusElement.className = "info-value warning";
  } else if (debugInfo.requestStats.pendingRequest) {
    apiStatusElement.textContent = "REQUEST IN PROGRESS...";
    apiStatusElement.className = "info-value pending";
  } else {
    apiStatusElement.textContent = "READY";
    apiStatusElement.className = "info-value success";
  }

  // Update request statistics
  apiRequestsElement.textContent =
    `Total: ${debugInfo.requestStats.totalRequests}, ` +
    `Success: ${debugInfo.requestStats.successfulRequests}, ` +
    `Failed: ${debugInfo.requestStats.failedRequests}`;

  // Update last error if any
  if (debugInfo.requestStats.lastError) {
    apiErrorElement.textContent = debugInfo.requestStats.lastError;
    apiErrorElement.className = "info-value error";
  } else {
    apiErrorElement.textContent = "None";
    apiErrorElement.className = "info-value";
  }
}

// Toggle debug overlay visibility
function toggleDebugOverlay() {
  debugOverlay.classList.toggle("visible");
  updateApiDebugInfo(); // Update API debug info when overlay is shown
  logToConsole("Debug overlay toggled");
}

// Update the notes info display
function updateNotesInfo() {
  const notesPlaying = musicState.getNotesPlaying();

  if (notesPlaying.length > 0) {
    const noteNames = notesPlaying
      .map((n) => `${n.name}${n.octave}`)
      .join(", ");
    const midiNumbers = notesPlaying.map((n) => n.midiNumber);

    // Always set the content, the CSS will handle ensuring it's two lines
    notesInfoElement.textContent = noteNames;

    // Update the Freepik service with current notes
    freepikService.updateNotes(noteNames.split(", "), midiNumbers);
  } else {
    notesInfoElement.textContent = "--";
    freepikService.updateNotes([], []);
  }
}

// Update weather info
function updateWeatherInfo() {
  const weather = musicState.getWeatherData();
  if (!weather) {
    console.log("Weather data not available yet");
    return;
  }

  console.log(
    `Updating weather info: ${weather.temperature}°C, ${weather.weatherDescription}`,
  );

  // Update DOM in a way that works consistently across browsers
  try {
    // Use innerHTML rather than textContent which can have issues in some browsers
    weatherInfoElement.innerHTML = `${weather.temperature}°C, ${weather.weatherDescription}`;

    // Force a DOM update in Edge (can help with rendering issues)
    weatherInfoElement.style.display = "none";
    void weatherInfoElement.offsetHeight; // Force a reflow
    weatherInfoElement.style.display = "";
  } catch (error) {
    console.error("Error updating weather display:", error);
  }

  // Update the Freepik service with weather data
  freepikService.updateWeather(weather);
}

// Toggle fullscreen mode
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    // Enter fullscreen
    document.documentElement.requestFullscreen().catch((err) => {
      logToConsole(`Error attempting to enter fullscreen: ${err.message}`);
    });
    logToConsole("Entered fullscreen mode");
  } else {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
      logToConsole("Exited fullscreen mode");
    }
  }
}

// Toggle between gradient and Freepik API mode
function toggleVisualizationMode() {
  const isPlaceholder = freepikService.togglePlaceholderMode();

  // Update button to clearly show which mode is active
  if (isPlaceholder) {
    modeToggleButton.innerHTML = "<span>Switch to API Images</span>";
    modeToggleButton.classList.remove("api-mode");
    modeToggleButton.classList.add("gradient-mode");
    colorKey.style.display = "flex"; // Show color key in gradient mode
    logToConsole("Switched to gradient mode (lower bandwidth)");
  } else {
    modeToggleButton.innerHTML = "<span>Switch to Gradients</span>";
    modeToggleButton.classList.remove("gradient-mode");
    modeToggleButton.classList.add("api-mode");
    colorKey.style.display = "none"; // Hide color key in API mode
    logToConsole("Switched to Freepik API mode");
  }

  // Make the color key visible when in gradient mode
  if (isPlaceholder) {
    colorKey.classList.add("visible");
  } else {
    colorKey.classList.remove("visible");
  }

  // Force a new image generation to reflect the mode change
  freepikService.stopPeriodicGeneration();
  freepikService.startPeriodicGeneration(IMAGE_UPDATE_INTERVAL);
}

// Show fullscreen button on mouse activity
function handleMouseActivity() {
  // Show all UI elements
  fullscreenButton.classList.add("visible");
  document.querySelector(".controls-container")?.classList.add("visible");
  colorKey.classList.add("visible");

  // Clear existing timeout
  if (mouseActivityTimeout !== null) {
    window.clearTimeout(mouseActivityTimeout);
  }

  // Set new timeout to hide the button after inactivity
  mouseActivityTimeout = window.setTimeout(() => {
    fullscreenButton.classList.remove("visible");
    document.querySelector(".controls-container")?.classList.remove("visible");
    colorKey.classList.remove("visible");
  }, MOUSE_ACTIVITY_TIMEOUT);
}

// Log message to console
function logToConsole(message: string) {
  const timestamp = new Date().toISOString().substring(11, 19);
  consoleOutput.innerHTML += `[${timestamp}] ${message}\n`;
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Handle server-generated images
musicState
  .getSocket()
  .on(
    "image-generated",
    (result: {
      imageUrl: string;
      isPlaceholder: boolean;
      prompt: string;
      backgroundPositionX?: string;
      backgroundPositionY?: string;
    }) => {
      if (fadeInProgress) return;

      // Start transition to new image
      fadeInProgress = true;

      // Prepare the image URL for CSS use
      const imageUrl = result.isPlaceholder
        ? result.imageUrl
        : `url(${result.imageUrl})`;

      // Update the next image container (currently hidden)
      nextImageElement.style.backgroundImage = imageUrl;

      // Start the fade transition
      nextImageElement.style.opacity = "1";
      currentImageElement.style.opacity = "0";

      // Update the prompt info
      promptInfoElement.textContent = result.prompt;

      // After transition completes, swap the layers
      setTimeout(() => {
        // Swap the z-index of the layers
        const tempZIndex = currentImageElement.style.zIndex;
        currentImageElement.style.zIndex = nextImageElement.style.zIndex;
        nextImageElement.style.zIndex = tempZIndex;

        // Reset opacity for next transition
        currentImageElement.style.opacity = "1";
        nextImageElement.style.opacity = "0";

        // Copy the image to the current layer
        currentImageElement.style.backgroundImage = imageUrl;

        fadeInProgress = false;
        logToConsole("Image updated from server with fade transition");

        // Update debug info
        updateApiDebugInfo();
      }, FADE_TRANSITION_DURATION);
    },
  );

// Subscribe to music state events
musicState.subscribe((event: MusicStateEvent) => {
  switch (event.type) {
    case "notes-updated":
      updateNotesInfo();
      break;

    case "weather-updated":
      updateWeatherInfo();
      break;

    case "all-notes-off":
      // Update display to show no notes
      updateNotesInfo();
      break;
  }
});

// Socket connection events
const socket = musicState.getSocket();

socket.on("connect", () => {
  logToConsole("Connected to server");

  // Auto-start the visualization on connection
  startVisualization();
});

socket.on("disconnect", () => {
  logToConsole("Disconnected from server");

  // Auto-stop the visualization on disconnect
  stopVisualization();
});

// Cleanup function
window.addEventListener("beforeunload", () => {
  freepikService.stopPeriodicGeneration();
});

// Initialize the UI layers
currentImageElement.style.zIndex = "2";
nextImageElement.style.zIndex = "1";

// Add event listeners for fullscreen button and mouse activity
fullscreenButton.addEventListener("click", toggleFullscreen);
document
  .querySelector(".fullscreen-container")
  ?.addEventListener("mousemove", handleMouseActivity);

// Initially trigger mouse activity to show controls briefly on page load
handleMouseActivity();

// Add event listener for mode toggle button
modeToggleButton.addEventListener("click", toggleVisualizationMode);

// Add event listener for keyboard events (? or ESC for debug overlay, F for fullscreen, V for gradient/Freepik mode)
document.addEventListener("keydown", (event) => {
  if (event.key === "?" || event.key === "Escape") {
    toggleDebugOverlay();
  } else if (event.key === "f" || event.key === "F") {
    toggleFullscreen();
  } else if (event.key === "v" || event.key === "V") {
    toggleVisualizationMode();
  }
});

// Set fullscreen button initially visible
fullscreenButton.classList.add("visible");

// Set initial visualization mode state
modeToggleButton.innerHTML = "<span>Switch to API Images</span>";
modeToggleButton.classList.add("gradient-mode");
colorKey.style.display = "flex"; // Always start with color key visible
// Initially visible, will fade out with mouse inactivity
colorKey.classList.add("visible");

// Make controls initially visible and then fade out after a delay
document.querySelector(".controls-container")?.classList.add("visible");

// Set timeout to hide controls after initial display
setTimeout(() => {
  document.querySelector(".controls-container")?.classList.remove("visible");
}, MOUSE_ACTIVITY_TIMEOUT);

// Initialization message
logToConsole("Piano Visualizer initialized");
logToConsole("Auto-starting visualization");

// Ensure weather display is initialized at startup
setTimeout(() => {
  // Request fresh weather data if possible
  musicState.getSocket().emit("request-weather-data");

  // Try to display any existing weather data
  updateWeatherInfo();

  logToConsole("Weather display initialization check completed");
}, 1000);

// Add missing property to Note interface for tracking
declare module "../shared/types" {
  interface Note {
    _startTime?: number;
  }
}
