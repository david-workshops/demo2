import "cypress-axe";
import "cypress-wait-until";

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
