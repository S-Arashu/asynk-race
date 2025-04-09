import { createWinner, fetchWinners } from "./api";
import { SortOrder, State, WinnersManager } from "./types";
import {
  appendChildren,
  createElement,
  createPaginationElement,
  updateURL,
} from "./utils";

export class Winners implements WinnersManager {
  private container: HTMLElement;
  private sortColumn: string = "id";
  private sortOrder: SortOrder = "ASC";

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async renderWinners(state: State): Promise<void> {
    this.container.innerHTML = "";

    const pageTitle = createElement<HTMLDivElement>("div", "page-info");
    const title = createElement<HTMLHeadingElement>("h2", "");

    try {
      console.log("Fetching winners with params:", {
        page: state.viewStates.winners.page,
        limit: 10,
        sort: this.sortColumn,
        order: this.sortOrder,
      });

      const winnersResponse = await fetchWinners(
        state.viewStates.winners.page,
        10,
        this.sortColumn,
        this.sortOrder
      );

      console.log("Winners response:", winnersResponse);
      const { items, count } = winnersResponse;

      title.innerHTML = `Winners <span class="count-badge">${count}</span>`;

      const pageInfo = createElement<HTMLParagraphElement>(
        "p",
        "",
        `Page ${state.viewStates.winners.page}`
      );
      appendChildren(pageTitle, [title, pageInfo]);

      // Create winners table
      const tableContainer = createElement<HTMLDivElement>(
        "div",
        "table-container"
      );

      if (items.length === 0) {
        const emptyMessage = createElement<HTMLDivElement>(
          "div",
          "empty-message",
          "No winners yet!"
        );
        tableContainer.appendChild(emptyMessage);
      } else {
        const table = createElement<HTMLTableElement>("table", "table");

        // Table header
        const thead = createElement<HTMLTableSectionElement>("thead", "");
        const headerRow = createElement<HTMLTableRowElement>("tr", "");

        const createHeaderCell = (text: string, column: string) => {
          const th = createElement<HTMLTableCellElement>("th", "");

          const headerContent = createElement<HTMLDivElement>(
            "div",
            "table-header-sortable"
          );
          headerContent.textContent = text;

          if (column === "wins" || column === "bestTime") {
            const sortIcon = createElement<HTMLSpanElement>(
              "span",
              `sort-icon ${
                this.sortColumn === column ? this.sortOrder.toLowerCase() : ""
              }`
            );
            headerContent.appendChild(sortIcon);

            th.addEventListener("click", () => {
              // Toggle sort order if already sorting by this column
              const newOrder =
                this.sortColumn === column && this.sortOrder === "ASC"
                  ? "DESC"
                  : "ASC";
              this.handleSort(state, column, newOrder);
            });
          }

          th.appendChild(headerContent);
          return th;
        };

        const headers = [
          createHeaderCell("№", "id"),
          createHeaderCell("Car", ""),
          createHeaderCell("Name", "name"),
          createHeaderCell("Wins", "wins"),
          createHeaderCell("Best Time (s)", "bestTime"),
        ];

        appendChildren(headerRow, headers);
        thead.appendChild(headerRow);

        // Table body
        const tbody = createElement<HTMLTableSectionElement>("tbody", "");

        items.forEach((winner, index) => {
          const row = createElement<HTMLTableRowElement>("tr", "");

          const indexCell = createElement<HTMLTableCellElement>(
            "td",
            "",
            `${(state.viewStates.winners.page - 1) * 10 + index + 1}`
          );

          const carCell = createElement<HTMLTableCellElement>("td", "");
          const carPreview = createElement<HTMLDivElement>(
            "div",
            "car-preview"
          );
          carPreview.innerHTML = `
            <div class="car-body" style="background-color: ${winner.car.color};"></div>
            <div class="car-window"></div>
          `;
          carCell.appendChild(carPreview);

          const nameCell = createElement<HTMLTableCellElement>(
            "td",
            "",
            winner.car.name
          );
          const winsCell = createElement<HTMLTableCellElement>(
            "td",
            "",
            winner.wins.toString()
          );
          // Handle bestTime which can be string type from the server
          const bestTimeStr =
            typeof winner.bestTime === "string"
              ? parseFloat(winner.bestTime).toFixed(2)
              : (winner.bestTime as number).toFixed(2);

          const timeCell = createElement<HTMLTableCellElement>(
            "td",
            "",
            bestTimeStr
          );

          appendChildren(row, [
            indexCell,
            carCell,
            nameCell,
            winsCell,
            timeCell,
          ]);
          tbody.appendChild(row);
        });

        appendChildren(table, [thead, tbody]);
        tableContainer.appendChild(table);
      }

      // Pagination
      // Calculate if there are more pages based on total count and current page
      const totalPages = Math.ceil(count / 10);
      const hasNextPage = state.viewStates.winners.page < totalPages;

      const pagination = createPaginationElement(
        state.viewStates.winners.page,
        hasNextPage,
        () => this.handlePrevPage(state),
        () => this.handleNextPage(state),
        totalPages
      );

      // Append all sections to the container
      appendChildren(this.container, [pageTitle, tableContainer, pagination]);

      // Update URL
      updateURL("winners", state.viewStates.winners.page);
    } catch (error) {
      console.error("Error loading winners:", error);
      title.textContent = "Winners";

      const errorMsg = createElement<HTMLDivElement>(
        "div",
        "error-message",
        "Failed to load winners. Please try again."
      );
      appendChildren(this.container, [pageTitle, errorMsg]);
    }
  }

  public handleSort(state: State, sort: string, order: SortOrder): void {
    this.sortColumn = sort;
    this.sortOrder = order;
    this.renderWinners(state);
  }

  public handleNextPage(state: State): void {
    state.viewStates.winners.page += 1;
    // Update URL to reflect page change
    updateURL("winners", state.viewStates.winners.page);
    this.renderWinners(state);
  }

  public handlePrevPage(state: State): void {
    if (state.viewStates.winners.page > 1) {
      state.viewStates.winners.page -= 1;
      // Update URL to reflect page change
      updateURL("winners", state.viewStates.winners.page);
      this.renderWinners(state);
    }
  }

  // Record a winner
  public async recordWinner(
    _state: State,
    carId: number,
    time: number
  ): Promise<void> {
    try {
      await createWinner(carId, time);
    } catch (error) {
      console.error("Error recording winner:", error);
    }
  }
}
