import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173", // Default to main interface
    supportFile: "cypress/support/e2e.ts",
    defaultCommandTimeout: 8000, // Increase from default 4000ms
    setupNodeEvents(on, _config) {
      // implement node event listeners here
      on("task", {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
      });
    },
  },
});
