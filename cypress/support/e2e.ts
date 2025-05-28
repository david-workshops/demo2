// Import both JavaScript and TypeScript commands
// The TypeScript commands come first so they can override any JS declarations if needed
import "./commands.js";
import "./commands";

// Explicitly import cypress-wait-until and cypress-axe directly to ensure they're available
import "cypress-wait-until";
import "cypress-axe";

// Set default options for waitUntil
// Note: waitUntil is a parent command, so it only takes checkFunction and options
Cypress.Commands.overwrite(
  "waitUntil",
  (originalFn, subject, checkFunction, options = {}) => {
    // Set higher default timeout and interval
    const defaultOptions = {
      timeout: 8000, // Default to 8 seconds
      interval: 300, // Check every 300ms
      ...options, // Override with any passed options
    };

    return originalFn(subject, checkFunction, defaultOptions);
  },
);

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
        },
      ) => Chainable<any>;
    }
  }
}
