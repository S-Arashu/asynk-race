import { Car } from "./types";

// DOM Helper Functions
export function createElement<T extends HTMLElement>(
  tagName: string,
  className?: string,
  content?: string
): T {
  const element = document.createElement(tagName) as T;
  if (className) {
    element.className = className;
  }
  if (content) {
    element.textContent = content;
  }
  return element;
}

export function appendChildren(
  parent: HTMLElement,
  children: HTMLElement[]
): void {
  children.forEach((child) => parent.appendChild(child));
}

// Car Generator
const CAR_BRANDS = [
  "Tesla",
  "Ford",
  "Toyota",
  "Honda",
  "Chevrolet",
  "BMW",
  "Mercedes",
  "Audi",
  "Volkswagen",
  "Porsche",
];

const CAR_MODELS = [
  "Model S",
  "Model 3",
  "Mustang",
  "Camry",
  "Civic",
  "Corvette",
  "X5",
  "E-Class",
  "A4",
  "911",
];

export function generateRandomCar(): { name: string; color: string } {
  const brand = CAR_BRANDS[Math.floor(Math.random() * CAR_BRANDS.length)];
  const model = CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)];
  const name = `${brand} ${model}`;

  // Generate random color
  const r = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");
  const g = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");
  const b = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");
  const color = `#${r}${g}${b}`;

  return { name, color };
}

// Animation Utils
export function calculateTimeToFinish(
  velocity: number,
  distance: number
): number {
  // Time = distance / velocity (in seconds)
  return distance / velocity;
}

// Event handling
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return (...args: Parameters<T>): void => {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      window.clearTimeout(timeout);
    }
    timeout = window.setTimeout(later, wait);
  };
}

// Format time to display
export function formatTime(time: number): string {
  return time.toFixed(2);
}

// Render car SVG
export function renderCarSVG(color: string): string {
  return `
    <svg width="50" height="20" viewBox="0 0 50 20" xmlns="http://www.w3.org/2000/svg">
      <rect class="car-body" width="50" height="20" rx="6" fill="${color}" />
      <rect class="car-window" x="20" y="3" width="15" height="8" rx="2" fill="#e0e0e0" />
      <circle class="car-wheel" cx="10" cy="20" r="4" fill="#333" />
      <circle class="car-wheel" cx="40" cy="20" r="4" fill="#333" />
    </svg>
  `;
}

// Create a car element
export function createCarElement(car: Car): HTMLElement {
  const carElement = createElement<HTMLDivElement>("div", "car");
  carElement.innerHTML = renderCarSVG(car.color);
  carElement.style.transform = "translateX(0)";
  carElement.dataset.carId = car.id.toString();
  return carElement;
}

// Create pagination element
export function createPaginationElement(
  currentPage: number,
  hasNextPage: boolean,
  onPrev: () => void,
  onNext: () => void,
  totalPages?: number
): HTMLElement {
  const pagination = createElement<HTMLDivElement>("div", "pagination");

  const prevButton = createElement<HTMLButtonElement>("button", "", "Previous");
  prevButton.disabled = currentPage <= 1;
  prevButton.addEventListener("click", onPrev);

  const pagesDisplay = totalPages
    ? `${currentPage} of ${totalPages}`
    : hasNextPage
    ? `${currentPage}+`
    : currentPage.toString();

  const pageInfo = createElement<HTMLSpanElement>(
    "span",
    "",
    `Page ${pagesDisplay}`
  );

  const nextButton = createElement<HTMLButtonElement>("button", "", "Next");
  nextButton.disabled = !hasNextPage;
  nextButton.addEventListener("click", onNext);

  appendChildren(pagination, [prevButton, pageInfo, nextButton]);

  return pagination;
}

// Show notification
export function showNotification(
  message: string,
  type: "success" | "error" = "success"
): void {
  const notification = createElement<HTMLDivElement>(
    "div",
    `notification ${type}`
  );
  notification.textContent = message;

  document.body.appendChild(notification);

  // Automatically remove notification after 3 seconds
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 3000);
}

// Create modal
export function createModal(title: string, content: string): HTMLElement {
  const modal = createElement<HTMLDivElement>("div", "modal");
  const modalContent = createElement<HTMLDivElement>("div", "modal-content");

  const modalHeader = createElement<HTMLDivElement>("div", "modal-header");
  const modalTitle = createElement<HTMLHeadingElement>("h2", "", title);
  const closeButton = createElement<HTMLButtonElement>(
    "button",
    "close-button",
    "X"
  );
  closeButton.addEventListener("click", () => {
    modal.classList.remove("open");
  });
  appendChildren(modalHeader, [modalTitle, closeButton]);

  const modalBody = createElement<HTMLDivElement>("div", "modal-body");
  modalBody.innerHTML = content;

  const modalFooter = createElement<HTMLDivElement>("div", "modal-footer");
  const okButton = createElement<HTMLButtonElement>("button", "", "OK");
  okButton.addEventListener("click", () => {
    modal.classList.remove("open");
  });
  modalFooter.appendChild(okButton);

  appendChildren(modalContent, [modalHeader, modalBody, modalFooter]);
  modal.appendChild(modalContent);

  return modal;
}

// Show modal
export function showModal(modal: HTMLElement): void {
  document.body.appendChild(modal);

  // Use setTimeout to ensure the modal is in the DOM before adding the open class
  setTimeout(() => {
    modal.classList.add("open");
  }, 10);
}

// Update URL without page reload
export function updateURL(view: string, page: number): void {
  const url = new URL(window.location.href);
  url.searchParams.set("view", view);
  url.searchParams.set("page", page.toString());
  window.history.pushState({}, "", url.toString());
}

// Extract parameters from URL
export function getURLParams(): { view: string; page: number } {
  const params = new URLSearchParams(window.location.search);
  return {
    view: params.get("view") || "garage",
    page: parseInt(params.get("page") || "1", 10),
  };
}
