# Piano Visualizer Frontend

This service provides AI-generated visual representations of the piano music being played on the main piano interface. It uses the Freepik API to create abstract visual imagery that evolves based on the notes being played and local weather conditions.

## Requirements

- Node.js 14+
- NPM 6+
- Freepik API key (for production use)

## Configuration

### Freepik API Integration

This application integrates with the [Freepik Mystic AI API](https://docs.freepik.com/mystic) to generate images. To use the real API (instead of the fallback placeholder gradients):

1. Sign up for a Freepik API account at https://www.freepik.com/developers/dashboard/api-key
2. Generate an API key
3. Add a payment method to upgrade to a premium plan in the Billing section
4. Update the `apiKey` variable in `src/visual-client/index.ts` with your Freepik API key

### API Features Used

The visualizer uses the following Freepik Mystic API features:

- **Prompt-based Generation**: Creates images based on prompts generated from the piano music and weather data
- **Resolution Control**: Uses 2K resolution for optimal performance
- **Aspect Ratio**: Dynamically selects aspect ratios based on the complexity of the scene
- **Engine Selection**: Chooses different engines based on the weather conditions:
  - `magnific_sharpy`: For clear weather (sharper details)
  - `magnific_illusio`: For rainy conditions (softer, flowing textures)
  - `magnific_sparkle`: For other weather conditions (balanced approach)
- **Creative Detailing**: Adjusts detail levels based on music complexity and weather intensity

### Rate Limiting

The Freepik API has the following limits to be aware of:
- 450 requests per day (RPD) for each 2K and 4K resolutions
- General rate per second (RPS) limitations

The application refreshes images every 45 seconds, which keeps well within these limits.

## Running the Visualizer

To run only the visualizer frontend:

```bash
npm run dev:visual
```

This will start the visualizer on http://localhost:5174.

To run both the piano interface and visualizer:

```bash
npm run dev:all
```

This starts:
- Piano backend: http://localhost:3000
- Piano frontend: http://localhost:5173
- Visualizer frontend: http://localhost:5174

## How It Works

1. The visualizer connects to the same WebSocket server as the piano interface
2. It listens for note events and weather updates
3. It generates prompts based on the notes being played and weather conditions
4. It sends these prompts to the Freepik API to generate images
5. Images are refreshed every 45 seconds with a smooth fade transition
6. When no API key is provided, the application falls back to generated CSS gradients

## Troubleshooting

- If you encounter rate limiting issues, adjust the `IMAGE_UPDATE_INTERVAL` constant in `src/visual-client/index.ts`
- For API errors, check the console logs in the visualizer interface