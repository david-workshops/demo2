import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
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
