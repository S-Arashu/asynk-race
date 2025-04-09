import {
  createCar,
  createWinner,
  deleteCar,
  driveEngine,
  fetchCars,
  generateRandomCars,
  startEngine,
  stopEngine,
  updateCar,
} from "./api";
import { Car, EngineData, GarageManager, State } from "./types";
import {
  appendChildren,
  calculateTimeToFinish,
  createCarElement,
  createElement,
  createPaginationElement,
  showModal,
  showNotification,
  updateURL,
} from "./utils";

export class Garage implements GarageManager {
  private container: HTMLElement;
  private carsContainer: HTMLElement;
  private racingCars: Map<
    number,
    {
      element: HTMLElement;
      animationId: number | null;
    }
  >;

  constructor(container: HTMLElement) {
    this.container = container;
    this.carsContainer = createElement<HTMLDivElement>("div", "car-list");
    this.racingCars = new Map();
  }

  public async renderGarage(state: State): Promise<void> {
    this.container.innerHTML = "";
    this.racingCars.clear();

    const pageTitle = createElement<HTMLDivElement>("div", "page-info");
    const title = createElement<HTMLHeadingElement>("h2", "");

    try {
      const { items, count } = await fetchCars(state.viewStates.garage.page, 7);
      title.innerHTML = `Garage <span class="count-badge">${count}</span>`;

      const pageInfo = createElement<HTMLParagraphElement>(
        "p",
        "",
        `Page ${state.viewStates.garage.page}`
      );
      appendChildren(pageTitle, [title, pageInfo]);

      // Create car form
      const createFormSection = this.createCarForm(state, false);

      // Update car form (visible only when a car is selected for update)
      const updateFormSection = this.createCarForm(state, true);

      // Race controls
      const raceControls = this.createRaceControls(state);

      // Cars list
      this.carsContainer.innerHTML = "";

      if (items.length === 0) {
        const emptyMessage = createElement<HTMLDivElement>(
          "div",
          "empty-message",
          "No cars available. Create one!"
        );
        this.carsContainer.appendChild(emptyMessage);
      } else {
        items.forEach((car) => {
          const carItem = this.createCarItem(car, state);
          this.carsContainer.appendChild(carItem);
        });
      }

      // Pagination
      // Calculate if there are more pages based on total count and current page
      const totalPages = Math.ceil(count / 7);
      const hasNextPage = state.viewStates.garage.page < totalPages;

      const pagination = createPaginationElement(
        state.viewStates.garage.page,
        hasNextPage,
        () => this.handlePrevPage(state),
        () => this.handleNextPage(state),
        totalPages
      );

      // Append all sections to the container
      appendChildren(this.container, [
        pageTitle,
        createFormSection,
        updateFormSection,
        raceControls,
        this.carsContainer,
        pagination,
      ]);

      // Update URL
      updateURL("garage", state.viewStates.garage.page);
    } catch (error) {
      console.error("Error loading garage:", error);
      title.textContent = "Garage";

      const errorMsg = createElement<HTMLDivElement>(
        "div",
        "error-message",
        "Failed to load cars. Please try again."
      );
      appendChildren(this.container, [pageTitle, errorMsg]);
    }
  }

  private createCarForm(state: State, isUpdate: boolean): HTMLElement {
    const formSection = createElement<HTMLDivElement>("div", "form-section");
    const formTitle = createElement<HTMLHeadingElement>(
      "h3",
      "",
      isUpdate ? "Update car" : "Create car"
    );

    const form = createElement<HTMLFormElement>("form", "car-form");

    const formRow = createElement<HTMLDivElement>("div", "form-row");

    const nameGroup = createElement<HTMLDivElement>("div", "input-group");
    const nameLabel = createElement<HTMLLabelElement>("label", "", "Car name");
    nameLabel.htmlFor = isUpdate ? "update-car-name" : "create-car-name";

    const nameInput = createElement<HTMLInputElement>("input", "");
    nameInput.type = "text";
    nameInput.id = isUpdate ? "update-car-name" : "create-car-name";
    nameInput.required = true;
    nameInput.value =
      isUpdate && state.carForm.selectedCarId !== null
        ? state.carForm.name
        : "";

    appendChildren(nameGroup, [nameLabel, nameInput]);

    const colorGroup = createElement<HTMLDivElement>("div", "input-group");
    const colorLabel = createElement<HTMLLabelElement>(
      "label",
      "",
      "Car color"
    );
    colorLabel.htmlFor = isUpdate ? "update-car-color" : "create-car-color";

    const colorInput = createElement<HTMLInputElement>("input", "");
    colorInput.type = "color";
    colorInput.id = isUpdate ? "update-car-color" : "create-car-color";
    colorInput.value =
      isUpdate && state.carForm.selectedCarId !== null
        ? state.carForm.color
        : "#3f51b5";

    appendChildren(colorGroup, [colorLabel, colorInput]);

    appendChildren(formRow, [nameGroup, colorGroup]);

    const submitButton = createElement<HTMLButtonElement>(
      "button",
      "",
      isUpdate ? "Update" : "Create"
    );
    submitButton.type = "submit";
    submitButton.disabled = isUpdate && state.carForm.selectedCarId === null;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = (
        document.getElementById(
          isUpdate ? "update-car-name" : "create-car-name"
        ) as HTMLInputElement
      ).value;
      const color = (
        document.getElementById(
          isUpdate ? "update-car-color" : "create-car-color"
        ) as HTMLInputElement
      ).value;

      if (isUpdate && state.carForm.selectedCarId !== null) {
        await this.handleUpdateCar(
          state,
          state.carForm.selectedCarId,
          name,
          color
        );
      } else {
        await this.handleCreateCar(state, name, color);
      }

      // Reset forms
      if (!isUpdate) {
        nameInput.value = "";
        colorInput.value = "#3f51b5";
      }
    });

    appendChildren(form, [formRow, submitButton]);
    appendChildren(formSection, [formTitle, form]);

    // Hide update form if no car is selected
    if (isUpdate && state.carForm.selectedCarId === null) {
      formSection.style.display = "none";
    }

    return formSection;
  }

  private createRaceControls(state: State): HTMLElement {
    const raceControls = createElement<HTMLDivElement>("div", "race-controls");

    const raceButton = createElement<HTMLButtonElement>(
      "button",
      "button-success",
      "Race"
    );
    raceButton.disabled = state.race.isRacing;
    raceButton.addEventListener("click", () => this.handleStartRace(state));

    const resetButton = createElement<HTMLButtonElement>(
      "button",
      "button-secondary",
      "Reset"
    );
    resetButton.disabled = !state.race.isRacing;
    resetButton.addEventListener("click", () => this.handleResetRace(state));

    const generateButton = createElement<HTMLButtonElement>(
      "button",
      "",
      "Generate Cars"
    );
    generateButton.addEventListener("click", () =>
      this.handleGenerateCars(state)
    );

    appendChildren(raceControls, [raceButton, resetButton, generateButton]);

    return raceControls;
  }

  private createCarItem(car: Car, state: State): HTMLElement {
    const carItem = createElement<HTMLDivElement>("div", "car-item");
    carItem.dataset.carId = car.id.toString();

    // Car header with name and controls
    const carHeader = createElement<HTMLDivElement>("div", "car-header");

    const carInfo = createElement<HTMLDivElement>("div", "car-info");
    const carName = createElement<HTMLHeadingElement>("h3", "", car.name);
    const carId = createElement<HTMLParagraphElement>(
      "p",
      "car-id",
      `#${car.id}`
    );
    appendChildren(carInfo, [carName, carId]);

    const carButtons = createElement<HTMLDivElement>("div", "car-buttons");

    const updateButton = createElement<HTMLButtonElement>(
      "button",
      "button-secondary",
      "Edit"
    );
    updateButton.addEventListener("click", () => {
      // Update the car form state
      state.carForm.selectedCarId = car.id;
      state.carForm.name = car.name;
      state.carForm.color = car.color;
      state.carForm.isUpdate = true;

      // Re-render the garage to show the update form
      this.renderGarage(state);
    });

    const deleteButton = createElement<HTMLButtonElement>(
      "button",
      "button-danger",
      "Delete"
    );
    deleteButton.addEventListener("click", () =>
      this.handleDeleteCar(state, car.id)
    );

    appendChildren(carButtons, [updateButton, deleteButton]);
    appendChildren(carHeader, [carInfo, carButtons]);

    // Car race track
    const track = createElement<HTMLDivElement>("div", "track");

    // Engine controls
    const engineControls = createElement<HTMLDivElement>(
      "div",
      "engine-controls car-controls"
    );

    const startButton = createElement<HTMLButtonElement>(
      "button",
      "button-success",
      "Start"
    );
    startButton.addEventListener("click", () =>
      this.startCarEngine(state, car.id)
    );

    const stopButton = createElement<HTMLButtonElement>(
      "button",
      "button-danger",
      "Stop"
    );
    stopButton.disabled = true;
    stopButton.addEventListener("click", () =>
      this.stopCarEngine(state, car.id)
    );

    appendChildren(engineControls, [startButton, stopButton]);

    // Car element for animation
    const carElement = createCarElement(car);

    // Finish line
    const finishLine = createElement<HTMLDivElement>("div", "finish-line");

    appendChildren(track, [engineControls, carElement, finishLine]);
    appendChildren(carItem, [carHeader, track]);

    // Store the car element for animation
    this.racingCars.set(car.id, {
      element: carElement,
      animationId: null,
    });

    return carItem;
  }

  public async handleCreateCar(
    state: State,
    name: string,
    color: string
  ): Promise<void> {
    try {
      await createCar({ name, color });
      showNotification("Car created successfully!", "success");
      this.renderGarage(state);
    } catch (error) {
      console.error("Error creating car:", error);
      showNotification("Failed to create car", "error");
    }
  }

  public async handleUpdateCar(
    state: State,
    carId: number,
    name: string,
    color: string
  ): Promise<void> {
    try {
      await updateCar(carId, { name, color });

      // Reset car form state
      state.carForm.selectedCarId = null;
      state.carForm.name = "";
      state.carForm.color = "";
      state.carForm.isUpdate = false;

      showNotification("Car updated successfully!", "success");
      this.renderGarage(state);
    } catch (error) {
      console.error("Error updating car:", error);
      showNotification("Failed to update car", "error");
    }
  }

  public async handleDeleteCar(state: State, carId: number): Promise<void> {
    try {
      await deleteCar(carId);

      // If the deleted car was selected for update, reset the form
      if (state.carForm.selectedCarId === carId) {
        state.carForm.selectedCarId = null;
        state.carForm.name = "";
        state.carForm.color = "";
        state.carForm.isUpdate = false;
      }

      showNotification("Car deleted successfully!", "success");
      this.renderGarage(state);
    } catch (error) {
      console.error("Error deleting car:", error);
      showNotification("Failed to delete car", "error");
    }
  }

  private async startCarEngine(state: State, carId: number): Promise<void> {
    const carData = this.racingCars.get(carId);
    if (!carData) return;

    try {
      // Get engine data
      const engineData = await this.handleStartEngine(state, carId);

      // Update UI controls
      const carItem = document.querySelector(
        `.car-item[data-car-id="${carId}"]`
      );
      if (!carItem) return;

      const startButton = carItem.querySelector(
        ".engine-controls button:first-child"
      ) as HTMLButtonElement;
      const stopButton = carItem.querySelector(
        ".engine-controls button:last-child"
      ) as HTMLButtonElement;

      if (startButton && stopButton) {
        startButton.disabled = true;
        stopButton.disabled = false;
      }

      // Animate car
      this.animateCar(state, carId, engineData);
    } catch (error) {
      console.error(`Error starting engine for car ${carId}:`, error);
      showNotification(`Failed to start engine for car ${carId}`, "error");
    }
  }

  private async stopCarEngine(state: State, carId: number): Promise<void> {
    const carData = this.racingCars.get(carId);
    if (!carData) return;

    try {
      await this.handleStopEngine(state, carId);

      // Update UI controls
      const carItem = document.querySelector(
        `.car-item[data-car-id="${carId}"]`
      );
      if (!carItem) return;

      const startButton = carItem.querySelector(
        ".engine-controls button:first-child"
      ) as HTMLButtonElement;
      const stopButton = carItem.querySelector(
        ".engine-controls button:last-child"
      ) as HTMLButtonElement;

      if (startButton && stopButton) {
        startButton.disabled = false;
        stopButton.disabled = true;
      }

      // Reset car position
      this.resetCarPosition(carId);
    } catch (error) {
      console.error(`Error stopping engine for car ${carId}:`, error);
      showNotification(`Failed to stop engine for car ${carId}`, "error");
    }
  }

  private animateCar(
    state: State,
    carId: number,
    engineData: EngineData
  ): void {
    const carData = this.racingCars.get(carId);
    if (!carData || !carData.element) return;

    // Calculate animation parameters
    const { velocity, distance } = engineData;
    const timeToFinish = calculateTimeToFinish(velocity, distance);

    // Calculate finish position based on track width
    const track = carData.element.closest(".track");
    if (!track) return;

    const trackWidth = track.clientWidth;
    const carWidth = carData.element.clientWidth;
    const finishPosition = trackWidth - carWidth - 20; // 20px is offset for the finish line

    console.log(
      `Car ${carId} animating with velocity: ${velocity}, distance: ${distance}, time: ${timeToFinish}s`
    );

    // Set transition on the car element
    carData.element.style.transition = `transform ${timeToFinish}s linear`;
    carData.element.style.transform = `translateX(${finishPosition}px)`;

    // Record start time for calculating actual time
    const startTime = Date.now();

    // Get car item for UI updates
    const carItem = document.querySelector(`.car-item[data-car-id="${carId}"]`);
    const carName =
      carItem?.querySelector(".car-info h3")?.textContent || `Car ${carId}`;

    // Send drive request
    driveEngine(carId).then(({ success }) => {
      if (!success) {
        // Engine broke down, stop the animation
        console.log(`Car ${carId} engine broke down!`);

        // Show notification that engine broke down
        showNotification(`${carName}'s engine broke down!`, "error");

        // Add visual indicator to the car element
        if (carItem) {
          const brokenIndicator = createElement<HTMLDivElement>(
            "div",
            "broken-engine-indicator",
            "⚠️ Engine failure"
          );
          brokenIndicator.style.color = "red";
          brokenIndicator.style.fontWeight = "bold";
          brokenIndicator.style.position = "absolute";
          brokenIndicator.style.bottom = "5px";
          brokenIndicator.style.left = "50px";

          track?.appendChild(brokenIndicator);

          // Remove the indicator after 3 seconds
          setTimeout(() => {
            track.removeChild(brokenIndicator);
          }, 3000);
        }

        this.stopCarAnimation(carId);
        return;
      }

      // Set timeout to handle race finish
      carData.animationId = window.setTimeout(() => {
        // Calculate actual time
        const finishTime = (Date.now() - startTime) / 1000;

        console.log(`Car ${carId} finished in ${finishTime.toFixed(2)}s`);

        // If this is a race and no winner yet, handle winner
        if (state.race.isRacing && !state.race.winner) {
          this.handleRaceFinish(state, carId, finishTime);
        }

        carData.animationId = null;
      }, timeToFinish * 1000);
    });
  }

  private stopCarAnimation(carId: number): void {
    const carData = this.racingCars.get(carId);
    if (!carData) return;

    // Clear timeout if exists
    if (carData.animationId !== null) {
      clearTimeout(carData.animationId);
      carData.animationId = null;
    }

    // Stop the animation by removing the transition and setting current position
    if (carData.element) {
      const currentTransform = window.getComputedStyle(
        carData.element
      ).transform;
      carData.element.style.transition = "none";
      carData.element.style.transform = currentTransform;
    }
  }

  private resetCarPosition(carId: number): void {
    const carData = this.racingCars.get(carId);
    if (!carData || !carData.element) return;

    // Reset car position
    carData.element.style.transition = "transform 0.3s ease-out";
    carData.element.style.transform = "translateX(0)";
  }

  private async handleRaceFinish(
    state: State,
    carId: number,
    time: number
  ): Promise<void> {
    try {
      console.log(`Race finished: Car ${carId} with time ${time.toFixed(2)}s`);

      // Instead of fetching car data from the API, use the car element from the DOM
      const carItem = document.querySelector(
        `.car-item[data-car-id="${carId}"]`
      );
      const carName =
        carItem?.querySelector(".car-info h3")?.textContent || `Car ${carId}`;
      const carColor =
        document
          .querySelector(`[data-car-id="${carId}"] .car-svg`)
          ?.getAttribute("fill") || "#000000";

      // Create a car object with the information we have
      const winningCar: Car = {
        id: carId,
        name: carName,
        color: carColor,
      };

      console.log("Winning car found:", winningCar);

      if (winningCar) {
        // Set winner in state
        state.race.winner = {
          car: winningCar,
          time,
        };

        // Record winner in database
        try {
          console.log(
            `Attempting to record winner: Car ${carId} with time ${time}`
          );
          const winner = await createWinner(carId, time);
          console.log(`Successfully recorded winner:`, winner);
        } catch (error) {
          console.error("Failed to record winner:", error);
        }

        // Show winner modal
        const winnerModal = createElement<HTMLDivElement>(
          "div",
          "modal winner-modal"
        );
        const modalContent = createElement<HTMLDivElement>(
          "div",
          "modal-content"
        );

        const modalHeader = createElement<HTMLDivElement>(
          "div",
          "modal-header"
        );
        const modalTitle = createElement<HTMLHeadingElement>(
          "h2",
          "winner-title",
          "Winner!"
        );
        const closeButton = createElement<HTMLButtonElement>(
          "button",
          "close-button",
          "X"
        );
        closeButton.addEventListener("click", () => {
          winnerModal.classList.remove("open");
          document.body.removeChild(winnerModal);
        });
        appendChildren(modalHeader, [modalTitle, closeButton]);

        const modalBody = createElement<HTMLDivElement>("div", "modal-body");
        const winnerInfo = createElement<HTMLDivElement>("div", "winner-info");

        const carPreview = createElement<HTMLDivElement>(
          "div",
          "car-preview winner-animation"
        );
        carPreview.innerHTML = `
          <div class="car-body" style="background-color: ${winningCar.color};"></div>
          <div class="car-window"></div>
        `;

        const winnerName = createElement<HTMLParagraphElement>(
          "p",
          "winner-name",
          `${winningCar.name} won the race!`
        );
        const winnerTime = createElement<HTMLParagraphElement>(
          "p",
          "winner-time",
          `Time: ${time.toFixed(2)}s`
        );

        appendChildren(winnerInfo, [carPreview, winnerName, winnerTime]);
        modalBody.appendChild(winnerInfo);

        const modalFooter = createElement<HTMLDivElement>(
          "div",
          "modal-footer"
        );
        const okButton = createElement<HTMLButtonElement>("button", "", "OK");
        okButton.addEventListener("click", () => {
          winnerModal.classList.remove("open");
          document.body.removeChild(winnerModal);
        });
        modalFooter.appendChild(okButton);

        appendChildren(modalContent, [modalHeader, modalBody, modalFooter]);
        winnerModal.appendChild(modalContent);

        showModal(winnerModal);
      }
    } catch (error) {
      console.error("Error handling race finish:", error);
    }
  }

  public async handleStartEngine(
    _state: State,
    carId: number
  ): Promise<EngineData> {
    try {
      return await startEngine(carId);
    } catch (error) {
      console.error(`Error starting engine for car ${carId}:`, error);
      throw error;
    }
  }

  public async handleStopEngine(_state: State, carId: number): Promise<void> {
    try {
      // Stop animation
      this.stopCarAnimation(carId);

      // Stop engine
      await stopEngine(carId);

      // Reset car position
      this.resetCarPosition(carId);
    } catch (error) {
      console.error(`Error stopping engine for car ${carId}:`, error);
      throw error;
    }
  }

  public async handleStartRace(state: State): Promise<void> {
    try {
      // Set racing state
      state.race.isRacing = true;
      state.race.winner = null;

      // Get all cars on the current page
      const { items } = await fetchCars(state.viewStates.garage.page, 7);

      // Disable race button and enable reset button
      const raceButton = document.querySelector(
        ".race-controls button:first-child"
      ) as HTMLButtonElement;
      const resetButton = document.querySelector(
        ".race-controls button:nth-child(2)"
      ) as HTMLButtonElement;

      if (raceButton && resetButton) {
        raceButton.disabled = true;
        resetButton.disabled = false;
      }

      // Start engines for all cars
      const startPromises = items.map(async (car) => {
        try {
          // Start engine
          const engineData = await this.handleStartEngine(state, car.id);

          // Update UI
          const carItem = document.querySelector(
            `.car-item[data-car-id="${car.id}"]`
          );
          if (!carItem) return;

          const startButton = carItem.querySelector(
            ".engine-controls button:first-child"
          ) as HTMLButtonElement;
          const stopButton = carItem.querySelector(
            ".engine-controls button:last-child"
          ) as HTMLButtonElement;

          if (startButton && stopButton) {
            startButton.disabled = true;
            stopButton.disabled = false;
          }

          // Animate car
          this.animateCar(state, car.id, engineData);
        } catch (error) {
          console.error(
            `Error starting engine for car ${car.id} during race:`,
            error
          );
        }
      });

      await Promise.all(startPromises);
    } catch (error) {
      console.error("Error starting race:", error);
      state.race.isRacing = false;
      showNotification("Failed to start race", "error");
    }
  }

  public async handleResetRace(state: State): Promise<void> {
    try {
      // Reset race state
      state.race.isRacing = false;
      state.race.winner = null;

      // Get all cars on the current page
      const { items } = await fetchCars(state.viewStates.garage.page, 7);

      // Enable race button and disable reset button
      const raceButton = document.querySelector(
        ".race-controls button:first-child"
      ) as HTMLButtonElement;
      const resetButton = document.querySelector(
        ".race-controls button:nth-child(2)"
      ) as HTMLButtonElement;

      if (raceButton && resetButton) {
        raceButton.disabled = false;
        resetButton.disabled = true;
      }

      // Stop engines for all cars
      const stopPromises = items.map(async (car) => {
        try {
          await this.handleStopEngine(state, car.id);

          // Update UI
          const carItem = document.querySelector(
            `.car-item[data-car-id="${car.id}"]`
          );
          if (!carItem) return;

          const startButton = carItem.querySelector(
            ".engine-controls button:first-child"
          ) as HTMLButtonElement;
          const stopButton = carItem.querySelector(
            ".engine-controls button:last-child"
          ) as HTMLButtonElement;

          if (startButton && stopButton) {
            startButton.disabled = false;
            stopButton.disabled = true;
          }
        } catch (error) {
          console.error(
            `Error stopping engine for car ${car.id} during reset:`,
            error
          );
        }
      });

      await Promise.all(stopPromises);
    } catch (error) {
      console.error("Error resetting race:", error);
      showNotification("Failed to reset race", "error");
    }
  }

  public async handleGenerateCars(state: State): Promise<void> {
    try {
      await generateRandomCars();
      showNotification("Successfully generated 100 cars!", "success");
      this.renderGarage(state);
    } catch (error) {
      console.error("Error generating cars:", error);
      showNotification("Failed to generate cars", "error");
    }
  }

  public handleNextPage(state: State): void {
    state.viewStates.garage.page += 1;
    // Update URL to reflect page change
    updateURL("garage", state.viewStates.garage.page);
    this.renderGarage(state);
  }

  public handlePrevPage(state: State): void {
    if (state.viewStates.garage.page > 1) {
      state.viewStates.garage.page -= 1;
      // Update URL to reflect page change
      updateURL("garage", state.viewStates.garage.page);
      this.renderGarage(state);
    }
  }
}
