export interface Car {
  id: number;
  name: string;
  color: string;
}

export interface Winner {
  id: number;
  carId: number;
  wins: number;
  bestTime: number;
}

export interface WinnerWithCar extends Winner {
  car: Car;
}

export interface PaginatedResponse<T> {
  items: T[];
  count: number;
}

export interface EngineData {
  velocity: number;
  distance: number;
}

export type SortOrder = "ASC" | "DESC";

export type View = "garage" | "winners";

export interface ViewState {
  page: number;
}

export interface State {
  view: View;
  viewStates: Record<View, ViewState>;
  carForm: {
    name: string;
    color: string;
    isUpdate: boolean;
    selectedCarId: number | null;
  };
  race: {
    isRacing: boolean;
    winner: {
      car: Car;
      time: number;
    } | null;
  };
}

// Page managers
export interface GarageManager {
  renderGarage(state: State): void;
  handleCreateCar(state: State, name: string, color: string): Promise<void>;
  handleUpdateCar(
    state: State,
    carId: number,
    name: string,
    color: string
  ): Promise<void>;
  handleDeleteCar(state: State, carId: number): Promise<void>;
  handleStartEngine(state: State, carId: number): Promise<EngineData>;
  handleStopEngine(state: State, carId: number): Promise<void>;
  handleStartRace(state: State): void;
  handleResetRace(state: State): void;
  handleGenerateCars(state: State): Promise<void>;
  handleNextPage(state: State): void;
  handlePrevPage(state: State): void;
}

export interface WinnersManager {
  renderWinners(state: State): void;
  handleSort(state: State, sort: string, order: SortOrder): void;
  handleNextPage(state: State): void;
  handlePrevPage(state: State): void;
}
