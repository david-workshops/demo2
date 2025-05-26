import "cypress-wait-until";
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

  it("should update console when start button is clicked, and stop when stopped", () => {
    cy.get("#play-toggle-btn").should("contain", "PLAY");
    cy.get("#play-toggle-btn").click();
    cy.waitUntil(() =>
      cy.get("#play-toggle-btn").should("contain", "STARTING..."),
    );
  });
});
