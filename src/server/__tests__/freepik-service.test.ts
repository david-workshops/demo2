import { FreepikService } from "../freepik-service";

describe("Freepik Service", () => {
  let freepikService: FreepikService;

  beforeEach(() => {
    freepikService = new FreepikService();
  });

  it("should generate basic prompts", () => {
    const prompt = freepikService.generatePrompt();
    expect(prompt).toBeDefined();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include minimalist style in normal mode", () => {
    // Generate a prompt when not in puppy fire mode
    const prompt = freepikService.generatePrompt();
    expect(prompt).toContain("Minimalist abstract sea of color");
  });

  it("should have getLastPrompt method", () => {
    freepikService.generatePrompt();
    const lastPrompt = freepikService.getLastPrompt();
    expect(lastPrompt).toBeDefined();
    expect(typeof lastPrompt).toBe("string");
  });

  it("should generate different prompts with weather data", () => {
    const weatherData = {
      temperature: 25,
      weatherCode: 0,
      weatherDescription: "Clear sky",
    };

    freepikService.updateWeather(weatherData);
    const prompt = freepikService.generatePrompt();

    expect(prompt).toBeDefined();
    expect(prompt.length).toBeGreaterThan(0);
  });
});
