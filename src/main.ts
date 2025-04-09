import { Garage } from "./garage";
import { State, View } from "./types";
import { createElement, getURLParams } from "./utils";
import { Winners } from "./winners";
import { Tutorial } from "./tutorial";

// Initialize application state
const state: State = {
  view: "garage",
  viewStates: {
    garage: {
      page: 1,
    },
    winners: {
      page: 1,
    },
  },
  carForm: {
    name: "",
    color: "#3f51b5",
    isUpdate: false,
    selectedCarId: null,
  },
  race: {
    isRacing: false,
    winner: null,
  },
};

// Create main container
const app = createElement<HTMLDivElement>("div", "container");
document.body.appendChild(app);

// Create header
const header = createElement<HTMLDivElement>("header", "header");
const headerTitle = createElement<HTMLHeadingElement>(
  "h1",
  "",
  "Car Racing SPA"
);
header.appendChild(headerTitle);
app.appendChild(header);

// Create navigation
const nav = createElement<HTMLDivElement>("nav", "nav");
const garageButton = createElement<HTMLButtonElement>(
  "button",
  "nav-button",
  "Garage"
);
garageButton.setAttribute("data-view", "garage");
const winnersButton = createElement<HTMLButtonElement>(
  "button",
  "nav-button",
  "Winners"
);
winnersButton.setAttribute("data-view", "winners");

garageButton.addEventListener("click", () => switchView("garage"));
winnersButton.addEventListener("click", () => switchView("winners"));

nav.appendChild(garageButton);
nav.appendChild(winnersButton);
app.appendChild(nav);

// Create main content container
const mainContent = createElement<HTMLDivElement>("main", "main-content");
app.appendChild(mainContent);

// Create page managers
const garageManager = new Garage(mainContent);
const winnersManager = new Winners(mainContent);

// Function to switch between views
function switchView(view: View): void {
  state.view = view;

  // Update active button
  garageButton.classList.toggle("active", view === "garage");
  winnersButton.classList.toggle("active", view === "winners");

  // Render the selected view
  renderCurrentView();
}

// Function to render the current view
async function renderCurrentView(): Promise<void> {
  mainContent.innerHTML = "";

  if (state.view === "garage") {
    await garageManager.renderGarage(state);
  } else if (state.view === "winners") {
    await winnersManager.renderWinners(state);
  }
}

// Initialize the application
async function init(): Promise<void> {
  // Check URL parameters for initial view and page
  const { view, page } = getURLParams();

  // Set initial state based on URL
  state.view = view as View;
  if (view === "garage") {
    state.viewStates.garage.page = page;
  } else if (view === "winners") {
    state.viewStates.winners.page = page;
  }

  // Update active button
  garageButton.classList.toggle("active", state.view === "garage");
  winnersButton.classList.toggle("active", state.view === "winners");

  // Render initial view
  await renderCurrentView();

  // Check if we should show the tutorial for first-time users
  if (Tutorial.shouldShowTutorial()) {
    // Add Help button to the navigation
    const helpButton = createElement<HTMLButtonElement>(
      "button",
      "nav-button help-button",
      "?"
    );
    helpButton.title = "Show Tutorial";
    helpButton.style.borderRadius = "50%";
    helpButton.style.width = "30px";
    helpButton.style.height = "30px";
    helpButton.style.marginLeft = "auto";
    helpButton.addEventListener("click", () => {
      // Reset tutorial data and start it again on click
      Tutorial.resetTutorial();
      startTutorial();
    });
    nav.appendChild(helpButton);

    // Start the tutorial
    startTutorial();
  } else {
    // Just add the help button for returning users
    const helpButton = createElement<HTMLButtonElement>(
      "button",
      "nav-button help-button",
      "?"
    );
    helpButton.title = "Show Tutorial";
    helpButton.style.borderRadius = "50%";
    helpButton.style.width = "30px";
    helpButton.style.height = "30px";
    helpButton.style.marginLeft = "auto";
    helpButton.addEventListener("click", () => startTutorial());
    nav.appendChild(helpButton);
  }
}

// Function to start the tutorial
function startTutorial(): void {
  // Create and start the tutorial
  const tutorial = new Tutorial(
    // Skip callback
    () => {
      console.log("Tutorial skipped");
    },
    // Completion callback
    () => {
      console.log("Tutorial completed");
    }
  );

  tutorial.start();
}

// Start the application
init().catch((error) => {
  console.error("Error initializing application:", error);
});
