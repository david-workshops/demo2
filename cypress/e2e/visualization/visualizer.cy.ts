// Remove the direct import since we're importing in support/e2e.ts
describe("Visualizer", () => {
  beforeEach(() => {
    // Visit the visualizer on port 5174
    cy.visit("http://localhost:5174");
  });

  it("should load the visualizer application", () => {
    cy.get(".fullscreen-container").should("be.visible");
  });

  it("should have the main visualization elements", () => {
    cy.waitUntil(() =>
      cy.get("#fullscreen-btn").then(($btn) => {
        return Cypress.Promise.resolve($btn.length > 0 && $btn.is(":visible"));
      }),
    );
    cy.waitUntil(() =>
      cy.get("#current-image").then(($img) => {
        return Cypress.Promise.resolve($img.length > 0 && $img.is(":visible"));
      }),
    );
    cy.waitUntil(() =>
      cy.get("#next-image").then(($img) => {
        return Cypress.Promise.resolve($img.length > 0 && $img.is(":visible"));
      }),
    );
  });

  it("should have working controls", () => {
    cy.waitUntil(() =>
      cy.get("#mode-toggle-btn").then(($btn) => {
        return Cypress.Promise.resolve($btn.length > 0 && $btn.is(":visible"));
      }),
    );
    cy.waitUntil(() =>
      cy.get("#mode-toggle-btn").then(($btn) => {
        return Cypress.Promise.resolve(
          $btn.text().includes("Switch to API Images"),
        );
      }),
    );
  });

  it("should display the color key", () => {
    cy.waitUntil(() =>
      cy.get("#color-key").then(($key) => {
        return Cypress.Promise.resolve($key.length > 0 && $key.is(":visible"));
      }),
    );
    cy.get(".key-item").should("have.length", 3);
    cy.waitUntil(() =>
      cy.contains("High Notes").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
    cy.waitUntil(() =>
      cy.contains("Mid Notes").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
    cy.waitUntil(() =>
      cy.contains("Low Notes").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
  });

  it("should toggle mode when mode button is clicked", () => {
    cy.waitUntil(() =>
      cy.get("#mode-toggle-btn").then(($btn) => {
        return Cypress.Promise.resolve($btn.length > 0 && $btn.is(":visible"));
      }),
    );
    cy.get("#mode-toggle-btn").click();
    cy.waitUntil(() =>
      cy.get("#mode-toggle-btn").then(($btn) => {
        return Cypress.Promise.resolve(
          $btn.text().includes("Switch to Gradient Mode"),
        );
      }),
    );
  });

  it("should show debug overlay when ? key is pressed", () => {
    cy.waitUntil(() =>
      cy.get("#debug-overlay").then(($overlay) => {
        return Cypress.Promise.resolve($overlay.length > 0);
      }),
    );
    cy.get("body").type("?");
    cy.waitUntil(() =>
      cy.get("#debug-overlay").then(($overlay) => {
        return Cypress.Promise.resolve(
          $overlay.length > 0 && $overlay.is(":visible"),
        );
      }),
    );
    cy.waitUntil(() =>
      cy.contains("Debug Information").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
  });

  it("should hide debug overlay when ESC key is pressed", () => {
    // First show the debug overlay
    cy.waitUntil(() =>
      cy.get("#debug-overlay").then(($overlay) => {
        return Cypress.Promise.resolve($overlay.length > 0);
      }),
    );
    cy.get("body").type("?");
    cy.waitUntil(() =>
      cy.get("#debug-overlay").then(($overlay) => {
        return Cypress.Promise.resolve(
          $overlay.length > 0 && $overlay.is(":visible"),
        );
      }),
    );

    // Then hide it with ESC
    cy.get("body").type("{esc}");
    // Wait for it to be hidden - we need to catch this differently
    cy.waitUntil(() =>
      cy.get("#debug-overlay").then(($overlay) => {
        return Cypress.Promise.resolve(
          $overlay.length > 0 && !$overlay.is(":visible"),
        );
      }),
    );
  });

  it("should display debug information sections", () => {
    cy.waitUntil(() =>
      cy.get("#debug-overlay").then(($overlay) => {
        return Cypress.Promise.resolve($overlay.length > 0);
      }),
    );
    cy.get("body").type("?");
    cy.waitUntil(() =>
      cy.get("#debug-overlay").then(($overlay) => {
        return Cypress.Promise.resolve(
          $overlay.length > 0 && $overlay.is(":visible"),
        );
      }),
    );

    cy.waitUntil(() =>
      cy.contains("PROMPT:").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
    cy.waitUntil(() =>
      cy.contains("NOTES INFLUENCING:").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
    cy.waitUntil(() =>
      cy.contains("WEATHER:").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
    cy.waitUntil(() =>
      cy.contains("Keyboard Shortcuts").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
    cy.waitUntil(() =>
      cy.contains("Freepik API Status").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
  });

  it("should display keyboard shortcuts help", () => {
    cy.waitUntil(() =>
      cy.get("#debug-overlay").then(($overlay) => {
        return Cypress.Promise.resolve($overlay.length > 0);
      }),
    );
    cy.get("body").type("?");
    cy.waitUntil(() =>
      cy.get("#debug-overlay").then(($overlay) => {
        return Cypress.Promise.resolve(
          $overlay.length > 0 && $overlay.is(":visible"),
        );
      }),
    );

    cy.waitUntil(() =>
      cy.contains("F key:").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
    cy.waitUntil(() =>
      cy.contains("Toggle fullscreen mode").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
    cy.waitUntil(() =>
      cy.contains("V key:").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
    cy.waitUntil(() =>
      cy.contains("Toggle between Gradient and Freepik mode").then(($el) => {
        return Cypress.Promise.resolve($el.length > 0 && $el.is(":visible"));
      }),
    );
  });

  it("should have fullscreen button with accessibility label", () => {
    cy.get("#fullscreen-btn").should(
      "have.attr",
      "aria-label",
      "Toggle fullscreen",
    );
  });

  it("should connect to the socket server", () => {
    // Check if the page loads without connection errors
    cy.waitUntil(() =>
      cy.get(".fullscreen-container").then(($container) => {
        return Cypress.Promise.resolve(
          $container.length > 0 && $container.is(":visible"),
        );
      }),
    );

    // The visualizer should be ready to receive data
    // Use waitUntil with a higher timeout since socket connections might take longer
    cy.waitUntil(
      () =>
        cy.window().then((win) => {
          return Cypress.Promise.resolve(win.hasOwnProperty("io"));
        }),
      { timeout: 10000, interval: 500 }, // Increased timeout and interval
    );
  });
});
