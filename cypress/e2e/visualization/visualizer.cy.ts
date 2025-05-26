import "cypress-wait-until";

describe("Visualizer", () => {
  beforeEach(() => {
    // Visit the visualizer on port 5174
    cy.visit("http://localhost:5174");
  });

  it("should load the visualizer application", () => {
    cy.get(".fullscreen-container").should("be.visible");
  });

  it("should have the main visualization elements", () => {
    cy.waitUntil(() => cy.get("#fullscreen-btn").should("be.visible"));
    cy.waitUntil(() => cy.get("#current-image").should("be.visible"));
    cy.waitUntil(() => cy.get("#next-image").should("be.visible"));
  });

  it("should have working controls", () => {
    cy.get("#mode-toggle-btn").should("be.visible");
    cy.get("#mode-toggle-btn").should("contain", "Switch to API Images");
  });

  it("should display the color key", () => {
    cy.get("#color-key").should("be.visible");
    cy.get(".key-item").should("have.length", 3);
    cy.contains("High Notes").should("be.visible");
    cy.contains("Mid Notes").should("be.visible");
    cy.contains("Low Notes").should("be.visible");
  });

  it("should toggle mode when mode button is clicked", () => {
    cy.get("#mode-toggle-btn").click();
    cy.get("#mode-toggle-btn").should("contain", "Switch to Gradient Mode");
  });

  it("should show debug overlay when ? key is pressed", () => {
    cy.get("#debug-overlay").should("not.be.visible");
    cy.get("body").type("?");
    cy.get("#debug-overlay").should("be.visible");
    cy.contains("Debug Information").should("be.visible");
  });

  it("should hide debug overlay when ESC key is pressed", () => {
    // First show the debug overlay
    cy.get("body").type("?");
    cy.get("#debug-overlay").should("be.visible");

    // Then hide it with ESC
    cy.get("body").type("{esc}");
    cy.get("#debug-overlay").should("not.be.visible");
  });

  it("should display debug information sections", () => {
    cy.get("body").type("?");
    cy.get("#debug-overlay").should("be.visible");

    cy.contains("PROMPT:").should("be.visible");
    cy.contains("NOTES INFLUENCING:").should("be.visible");
    cy.contains("WEATHER:").should("be.visible");
    cy.contains("Keyboard Shortcuts").should("be.visible");
    cy.contains("Freepik API Status").should("be.visible");
  });

  it("should display keyboard shortcuts help", () => {
    cy.get("body").type("?");

    cy.contains("F key:").should("be.visible");
    cy.contains("Toggle fullscreen mode").should("be.visible");
    cy.contains("V key:").should("be.visible");
    cy.contains("Toggle between Gradient and Freepik mode").should(
      "be.visible",
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
    cy.get(".fullscreen-container").should("be.visible");

    // The visualizer should be ready to receive data
    cy.window().should("have.property", "io");
  });
});
