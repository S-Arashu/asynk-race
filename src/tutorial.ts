import { createElement } from "./utils";

// Tutorial steps definition
const tutorialSteps = [
  {
    title: "Welcome to Car Racing SPA!",
    content:
      "This quick tutorial will guide you through the main features of the application. Click Next to continue or Skip to exit the tutorial.",
    target: "h1",
    position: "bottom",
    highlightTarget: true,
  },
  {
    title: "Navigation",
    content:
      "Use these buttons to switch between the Garage view and the Winners view.",
    target: "nav",
    position: "bottom",
    highlightTarget: true,
  },
  {
    title: "Garage View",
    content:
      "The Garage view allows you to create, update, and delete cars, as well as race them.",
    target: '[data-view="garage"]',
    position: "bottom",
    highlightTarget: true,
  },
  {
    title: "Winners View",
    content:
      "The Winners view shows the statistics of all races, including the best time and number of wins for each car.",
    target: '[data-view="winners"]',
    position: "bottom",
    highlightTarget: true,
  },
  {
    title: "Create Car",
    content:
      "Use this form to create a new car. Enter a name and pick a color, then click Create.",
    target: ".car-form:first-child",
    position: "right",
    highlightTarget: true,
  },
  {
    title: "Update Car",
    content:
      'To update a car, click the "Edit" button next to a car. This will populate the update form with the car\'s details.',
    target: ".button-secondary",
    position: "right",
    highlightTarget: false,
  },
  {
    title: "Race Controls",
    content:
      "These buttons allow you to start a race with all cars, reset all cars to their starting positions, or generate random cars.",
    target: ".race-controls",
    position: "bottom",
    highlightTarget: true,
  },
  {
    title: "Car Controls",
    content:
      "Each car has its own controls. You can start the engine, stop it, select the car for updates, or delete it.",
    target: ".engine-controls",
    position: "right",
    highlightTarget: true,
  },
  {
    title: "Pagination",
    content: "Use these buttons to navigate between pages of cars or winners.",
    target: ".pagination",
    position: "top",
    highlightTarget: true,
  },
  {
    title: "That's it!",
    content:
      'You\'re all set to use the Car Racing SPA! Click Finish to close this tutorial. You can access it again anytime by clicking the "?" button in the navigation.',
    target: ".help-button",
    position: "bottom",
    highlightTarget: true,
  },
];

export class Tutorial {
  private currentStep: number = 0;
  private overlay: HTMLElement;
  private tooltip: HTMLElement;
  private skipCallback: () => void;
  private completionCallback: () => void;

  constructor(skipCallback: () => void, completionCallback: () => void) {
    this.skipCallback = skipCallback;
    this.completionCallback = completionCallback;

    // Create overlay
    this.overlay = createElement<HTMLDivElement>("div", "tutorial-overlay");
    document.body.appendChild(this.overlay);

    // Create tooltip
    this.tooltip = createElement<HTMLDivElement>("div", "tutorial-tooltip");
    document.body.appendChild(this.tooltip);
  }

  public start(): void {
    // Show the overlay
    this.overlay.classList.add("active");

    // Show the first step
    this.showStep(0);
  }

  public end(): void {
    // Hide the overlay and tooltip
    this.overlay.classList.remove("active");
    this.tooltip.classList.remove("active");

    // Remove them from the DOM after transition completes
    setTimeout(() => {
      this.overlay.remove();
      this.tooltip.remove();
    }, 300);

    // Store in localStorage that the user has seen the tutorial
    localStorage.setItem("tutorialCompleted", "true");

    // Call the completion callback
    this.completionCallback();
  }

  private showStep(stepIndex: number): void {
    // Save the current step
    this.currentStep = stepIndex;

    // Get the step data
    const step = tutorialSteps[stepIndex];

    // Clear the tooltip content
    this.tooltip.innerHTML = "";
    this.tooltip.className = "tutorial-tooltip"; // Reset classes

    // Create the title
    const title = createElement<HTMLDivElement>(
      "div",
      "tutorial-title",
      step.title
    );

    // Create the content
    const content = createElement<HTMLDivElement>(
      "div",
      "tutorial-content",
      step.content
    );

    // Create buttons container
    const buttonsContainer = createElement<HTMLDivElement>(
      "div",
      "tutorial-buttons"
    );

    // Create Skip button
    const skipButton = createElement<HTMLButtonElement>(
      "button",
      "tutorial-button tutorial-skip",
      "Skip"
    );
    skipButton.addEventListener("click", () => this.skip());

    // Create navigation buttons container
    const navButtons = createElement<HTMLDivElement>(
      "div",
      "tutorial-nav-buttons"
    );

    // Create Prev button (disabled on first step)
    const prevButton = createElement<HTMLButtonElement>(
      "button",
      "tutorial-button tutorial-prev",
      "Prev"
    );
    prevButton.disabled = stepIndex === 0;
    prevButton.addEventListener("click", () =>
      this.showStep(this.currentStep - 1)
    );

    // Create Next/Finish button
    const isLastStep = stepIndex === tutorialSteps.length - 1;
    const nextButton = createElement<HTMLButtonElement>(
      "button",
      `tutorial-button ${isLastStep ? "tutorial-finish" : "tutorial-next"}`,
      isLastStep ? "Finish" : "Next"
    );
    nextButton.addEventListener("click", () => {
      if (isLastStep) {
        this.end();
      } else {
        this.showStep(this.currentStep + 1);
      }
    });

    // Add buttons to nav container
    navButtons.appendChild(prevButton);
    navButtons.appendChild(nextButton);

    // Add all buttons to buttons container
    buttonsContainer.appendChild(skipButton);
    buttonsContainer.appendChild(navButtons);

    // Create progress indicators
    const progressContainer = createElement<HTMLDivElement>(
      "div",
      "tutorial-progress"
    );

    // Add indicator dots
    for (let i = 0; i < tutorialSteps.length; i++) {
      const indicator = createElement<HTMLDivElement>(
        "div",
        `tutorial-indicator ${i === stepIndex ? "active" : ""}`
      );
      progressContainer.appendChild(indicator);
    }

    // Add all elements to tooltip
    this.tooltip.appendChild(title);
    this.tooltip.appendChild(content);
    this.tooltip.appendChild(buttonsContainer);
    this.tooltip.appendChild(progressContainer);

    // Add position class
    this.tooltip.classList.add(`position-${step.position}`);

    // Make tooltip visible
    this.tooltip.classList.add("active");

    // Position the tooltip next to the target element
    this.positionTooltip(step);

    // Add highlight if needed
    if (step.highlightTarget) {
      // Remove any existing highlight
      const existingHighlight = document.querySelector(".tutorial-highlight");
      if (existingHighlight) {
        existingHighlight.remove();
      }

      // Find target element
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        try {
          // Create highlight element
          const highlight = createElement<HTMLDivElement>(
            "div",
            "tutorial-highlight"
          );

          // Position highlight over target
          const rect = targetElement.getBoundingClientRect();

          // Check if we have valid dimensions
          if (rect.width > 0 && rect.height > 0) {
            highlight.style.top = `${rect.top}px`;
            highlight.style.left = `${rect.left}px`;
            highlight.style.width = `${rect.width}px`;
            highlight.style.height = `${rect.height}px`;

            // Add to DOM
            document.body.appendChild(highlight);
          } else {
            console.warn(
              `Tutorial target ${step.target} has invalid dimensions`
            );
          }
        } catch (error) {
          console.error(`Error creating highlight for ${step.target}:`, error);
        }
      }
    }
  }

  private positionTooltip(step: (typeof tutorialSteps)[0]): void {
    // Find the target element
    const targetElement = document.querySelector(step.target);

    if (!targetElement) {
      console.warn(`Tutorial target not found: ${step.target}`);

      // If we're on the first step and target isn't found, try to find a generic target
      if (this.currentStep === 0) {
        // Try to target the header instead
        const headerElement = document.querySelector("header");
        if (headerElement) {
          const rect = headerElement.getBoundingClientRect();
          this.tooltip.style.top = `${rect.bottom + 15}px`;
          this.tooltip.style.left = "50%";
          this.tooltip.style.transform = "translateX(-50%)";
          return;
        }
      }

      // Center the tooltip if target is not found
      this.tooltip.style.top = "50%";
      this.tooltip.style.left = "50%";
      this.tooltip.style.transform = "translate(-50%, -50%)";
      return;
    }

    // Get the target's position and dimensions
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    // Calculate position based on the specified position
    let top = 0;
    let left = 0;

    switch (step.position) {
      case "top":
        // Position above the target
        top = targetRect.top - tooltipRect.height - 15;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;

      case "bottom":
        // Position below the target
        top = targetRect.bottom + 15;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;

      case "left":
        // Position to the left of the target
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - 15;
        break;

      case "right":
        // Position to the right of the target
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.right + 15;
        break;
    }

    // Ensure tooltip stays within viewport
    // Check top edge
    if (top < 10) {
      top = 10;
    }

    // Check bottom edge
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = window.innerHeight - tooltipRect.height - 10;
    }

    // Check left edge
    if (left < 10) {
      left = 10;
    }

    // Check right edge
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    // Apply position
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
  }

  private skip(): void {
    // End the tutorial
    this.end();

    // Call the skip callback
    this.skipCallback();
  }

  // Static method to check if we should show the tutorial (first-time users)
  public static shouldShowTutorial(): boolean {
    // Get tutorial status from localStorage
    const tutorialCompleted = localStorage.getItem("tutorialCompleted");

    // Show tutorial if it has not been completed before
    return tutorialCompleted !== "true";
  }

  // Static method to reset tutorial status
  public static resetTutorial(): void {
    // Remove the tutorial completed flag from localStorage
    localStorage.removeItem("tutorialCompleted");
  }
}
