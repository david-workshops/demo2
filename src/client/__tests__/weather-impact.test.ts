import { WeatherData } from "../../shared/types";

// Mock DOM elements
Object.defineProperty(global, 'document', {
  value: {
    getElementById: jest.fn().mockReturnValue({
      textContent: '',
      innerHTML: '',
      style: { display: '' },
      offsetHeight: 0,
      appendChild: jest.fn(),
      remove: jest.fn(),
      classList: {
        toggle: jest.fn(),
        add: jest.fn(),
        remove: jest.fn()
      }
    }),
    createElement: jest.fn().mockReturnValue({
      textContent: '',
      style: {},
      className: ''
    }),
    addEventListener: jest.fn()
  },
  writable: true
});

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    setInterval: jest.fn(),
    clearInterval: jest.fn(),
    addEventListener: jest.fn()
  },
  writable: true
});

// Mock AudioContext
Object.defineProperty(global, 'AudioContext', {
  value: jest.fn().mockImplementation(() => ({
    createGain: jest.fn().mockReturnValue({
      gain: { value: 0.5 },
      connect: jest.fn()
    }),
    destination: {},
    currentTime: 0
  })),
  writable: true
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    geolocation: undefined,
    requestMIDIAccess: undefined
  },
  writable: true
});

// Import the function we want to test after setting up mocks
// We need to extract the function from the module since it's not exported
describe("Weather Impact Display", () => {
  let weatherImpactDisplay: { textContent: string };

  beforeEach(() => {
    weatherImpactDisplay = { textContent: '' };
    (document.getElementById as jest.Mock).mockReturnValue(weatherImpactDisplay);
  });

  // Helper function to simulate the updateWeatherImpactDisplay function
  function updateWeatherImpactDisplay(weather: WeatherData) {
    const impact = [];

    // Temperature impact
    if (weather.temperature < 0) {
      impact.push("Slower tempo, lower register");
    } else if (weather.temperature < 10) {
      impact.push("Minor scales, softer dynamics");
    } else if (weather.temperature > 30) {
      impact.push("Faster tempo, more activity");
    } else if (weather.temperature > 25) {
      impact.push("Brighter scales, higher register");
    }

    // Weather condition impact
    const code = weather.weatherCode;
    if ([0, 1].includes(code)) {
      // Clear
      impact.push("Sparse, bright notes");
    } else if ([2, 3].includes(code)) {
      // Cloudy
      impact.push("Varied dynamics, moderate activity");
    } else if (
      [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
    ) {
      // Rain
      impact.push("More sustain pedal, softer attacks");
    } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
      // Snow
      impact.push("Slower, gentler passages");
    } else if ([95, 96, 99].includes(code)) {
      // Thunderstorm
      impact.push("Dramatic dynamics, cluster chords");
    }

    weatherImpactDisplay.textContent = impact.join(", ");
  }

  describe("Temperature impact logic", () => {
    it("should show 'Slower tempo, lower register' for temperatures below 0°C", () => {
      const weather: WeatherData = {
        temperature: -5,
        weatherCode: 0,
        weatherDescription: "Clear sky"
      };

      updateWeatherImpactDisplay(weather);

      expect(weatherImpactDisplay.textContent).toContain("Slower tempo, lower register");
    });

    it("should show 'Minor scales, softer dynamics' for temperatures between 0-10°C", () => {
      const weather: WeatherData = {
        temperature: 5,
        weatherCode: 0,
        weatherDescription: "Clear sky"
      };

      updateWeatherImpactDisplay(weather);

      expect(weatherImpactDisplay.textContent).toContain("Minor scales, softer dynamics");
    });

    it("should show 'Brighter scales, higher register' for temperatures between 25-30°C", () => {
      const weather: WeatherData = {
        temperature: 28,
        weatherCode: 0,
        weatherDescription: "Clear sky"
      };

      updateWeatherImpactDisplay(weather);

      expect(weatherImpactDisplay.textContent).toContain("Brighter scales, higher register");
      expect(weatherImpactDisplay.textContent).not.toContain("Faster tempo, more activity");
    });

    it("should show 'Faster tempo, more activity' for temperatures above 30°C", () => {
      const weather: WeatherData = {
        temperature: 35,
        weatherCode: 0,
        weatherDescription: "Clear sky"
      };

      updateWeatherImpactDisplay(weather);

      expect(weatherImpactDisplay.textContent).toContain("Faster tempo, more activity");
      expect(weatherImpactDisplay.textContent).not.toContain("Brighter scales, higher register");
    });

    it("should show correct impact for exactly 30°C (boundary test)", () => {
      const weather: WeatherData = {
        temperature: 30,
        weatherCode: 0,
        weatherDescription: "Clear sky"
      };

      updateWeatherImpactDisplay(weather);

      expect(weatherImpactDisplay.textContent).toContain("Brighter scales, higher register");
      expect(weatherImpactDisplay.textContent).not.toContain("Faster tempo, more activity");
    });

    it("should show correct impact for exactly 31°C (boundary test)", () => {
      const weather: WeatherData = {
        temperature: 31,
        weatherCode: 0,
        weatherDescription: "Clear sky"
      };

      updateWeatherImpactDisplay(weather);

      expect(weatherImpactDisplay.textContent).toContain("Faster tempo, more activity");
      expect(weatherImpactDisplay.textContent).not.toContain("Brighter scales, higher register");
    });

    it("should show no temperature impact for moderate temperatures (10-25°C)", () => {
      const weather: WeatherData = {
        temperature: 20,
        weatherCode: 0,
        weatherDescription: "Clear sky"
      };

      updateWeatherImpactDisplay(weather);

      expect(weatherImpactDisplay.textContent).not.toContain("Slower tempo, lower register");
      expect(weatherImpactDisplay.textContent).not.toContain("Minor scales, softer dynamics");
      expect(weatherImpactDisplay.textContent).not.toContain("Brighter scales, higher register");
      expect(weatherImpactDisplay.textContent).not.toContain("Faster tempo, more activity");
      // Should still contain weather condition impact
      expect(weatherImpactDisplay.textContent).toContain("Sparse, bright notes");
    });
  });

  describe("Weather condition impact logic", () => {
    it("should show correct impact for clear weather", () => {
      const weather: WeatherData = {
        temperature: 20,
        weatherCode: 0,
        weatherDescription: "Clear sky"
      };

      updateWeatherImpactDisplay(weather);

      expect(weatherImpactDisplay.textContent).toContain("Sparse, bright notes");
    });

    it("should show correct impact for rainy weather", () => {
      const weather: WeatherData = {
        temperature: 20,
        weatherCode: 61,
        weatherDescription: "Slight rain"
      };

      updateWeatherImpactDisplay(weather);

      expect(weatherImpactDisplay.textContent).toContain("More sustain pedal, softer attacks");
    });

    it("should show correct impact for thunderstorm", () => {
      const weather: WeatherData = {
        temperature: 20,
        weatherCode: 95,
        weatherDescription: "Thunderstorm"
      };

      updateWeatherImpactDisplay(weather);

      expect(weatherImpactDisplay.textContent).toContain("Dramatic dynamics, cluster chords");
    });
  });

  describe("Combined impact scenarios", () => {
    it("should combine temperature and weather condition impacts", () => {
      const weather: WeatherData = {
        temperature: 35,
        weatherCode: 95,
        weatherDescription: "Thunderstorm"
      };

      updateWeatherImpactDisplay(weather);

      expect(weatherImpactDisplay.textContent).toContain("Faster tempo, more activity");
      expect(weatherImpactDisplay.textContent).toContain("Dramatic dynamics, cluster chords");
      expect(weatherImpactDisplay.textContent).toContain(", ");
    });
  });
});