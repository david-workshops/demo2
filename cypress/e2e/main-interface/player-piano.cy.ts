describe("Player Piano", () => {
  beforeEach(() => {
    cy.visit("http://localhost:5173");
  });

  it("should load the application", () => {
    cy.contains("PLAYER PIANO").should("be.visible");
    cy.contains("GENERATIVE MINIMALISM").should("be.visible");
  });

  it("should have working controls", () => {
    cy.get("#play-toggle-btn").should("be.visible");
    cy.get("#output-select").should("be.visible");
  });

  it("should show the console output", () => {
    cy.get("#console-output").should("be.visible");
    cy.get("#console-output").should("contain", "Player Piano initialized");
  });

  it("should have all required information panels", () => {
    cy.get("#current-key").should("be.visible");
    cy.get("#current-scale").should("be.visible");
    cy.get("#notes-playing").should("be.visible");
    cy.get("#pedals-status").should("be.visible");
  });

  it("should update console when start button is clicked", () => {
    cy.get("#play-toggle-btn").click();
    cy.get("#console-output").should("contain", "Starting MIDI stream");
  });

  it("should update console when stop button is clicked", () => {
    cy.get("#play-toggle-btn").click();
    // Wait for the button text to become "PAUSE"
    cy.get("#play-toggle-btn").should("have.text", "PAUSE");
    // Now click the button again
    cy.get("#play-toggle-btn").click();
    cy.get("#console-output").should("contain", "Stopping MIDI stream");
  });
});
