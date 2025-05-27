// Import both JavaScript and TypeScript commands
// The TypeScript commands come first so they can override any JS declarations if needed
import "./commands.js";
import "./commands";

// Explicitly import cypress-wait-until and cypress-axe directly to ensure they're available
import "cypress-wait-until";
import "cypress-axe";

// Add type definitions for waitUntil if needed
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Wait until a condition is met
       * @param condition The condition to wait for
       * @param options Additional options for the wait
       */
      waitUntil: (
        condition: () => boolean | Chainable<any>,
        options?: {
          timeout?: number;
          interval?: number;
          errorMsg?: string;
        }
      ) => Chainable<any>;
    }
  }
}
