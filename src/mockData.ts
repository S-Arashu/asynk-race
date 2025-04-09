import {
  Car,
  EngineData,
  PaginatedResponse,
  SortOrder,
  Winner,
  WinnerWithCar,
} from "./types";
import { generateRandomCar } from "./utils";

// Initial mock data
const initialCars: Car[] = [
  { id: 1, name: "Tesla Model S", color: "#3f51b5" },
  { id: 2, name: "Ford Mustang", color: "#f44336" },
  { id: 3, name: "Chevrolet Camaro", color: "#ff9800" },
  { id: 4, name: "BMW X5", color: "#4caf50" },
  { id: 5, name: "Audi R8", color: "#2196f3" },
  { id: 6, name: "Porsche 911", color: "#9c27b0" },
  { id: 7, name: "Mercedes-Benz S-Class", color: "#607d8b" },
];

class MockData {
  private cars: Map<number, Car> = new Map();
  private winners: Map<number, Winner> = new Map();
  private nextCarId: number = 8; // Start after initial cars
  private nextWinnerId: number = 1;

  constructor() {
    // Initialize with some cars
    initialCars.forEach((car) => {
      this.cars.set(car.id, car);
    });
  }

  // Car methods
  getCars(page: number = 1, limit: number = 7): PaginatedResponse<Car> {
    const allCars = Array.from(this.cars.values());
    const startIdx = (page - 1) * limit;
    const items = allCars.slice(startIdx, startIdx + limit);
    return {
      items,
      count: allCars.length,
    };
  }

  getCar(id: number): Car | undefined {
    return this.cars.get(id);
  }

  createCar(car: { name: string; color: string }): Car {
    const id = this.nextCarId++;
    const newCar: Car = { ...car, id };
    this.cars.set(id, newCar);
    return newCar;
  }

  updateCar(id: number, car: { name: string; color: string }): Car | undefined {
    const existingCar = this.cars.get(id);
    if (!existingCar) return undefined;

    const updatedCar: Car = { ...existingCar, ...car };
    this.cars.set(id, updatedCar);
    return updatedCar;
  }

  deleteCar(id: number): boolean {
    // Also delete any winners for this car
    this.winners.forEach((winner, winnerId) => {
      if (winner.carId === id) {
        this.winners.delete(winnerId);
      }
    });
    return this.cars.delete(id);
  }

  // Engine methods
  startEngine(_id: number): EngineData {
    // Generate random velocity and distance
    const velocity = Math.floor(Math.random() * 150) + 50; // 50-200
    const distance = Math.floor(Math.random() * 1000) + 500; // 500-1500
    return { velocity, distance };
  }

  driveEngine(_id: number): { success: boolean } {
    // 20% chance of engine failure
    return { success: Math.random() > 0.2 };
  }

  // Winners methods
  getWinners(
    page: number = 1,
    limit: number = 10,
    sort: string = "id",
    order: SortOrder = "ASC"
  ): PaginatedResponse<WinnerWithCar> {
    let allWinners = Array.from(this.winners.values());

    // Sort winners
    allWinners.sort((a, b) => {
      let comparison = 0;
      if (sort === "id") {
        comparison = a.id - b.id;
      } else if (sort === "wins") {
        comparison = a.wins - b.wins;
      } else if (sort === "time") {
        comparison = a.bestTime - b.bestTime;
      }
      return order === "ASC" ? comparison : -comparison;
    });

    // Paginate
    const startIdx = (page - 1) * limit;
    const items = allWinners.slice(startIdx, startIdx + limit);

    // Add car data
    const winnersWithCar: WinnerWithCar[] = items.map((winner) => {
      const car = this.cars.get(winner.carId);
      if (!car) throw new Error(`Car not found for winner: ${winner.id}`);
      return { ...winner, car };
    });

    return {
      items: winnersWithCar,
      count: allWinners.length,
    };
  }

  getWinner(id: number): WinnerWithCar | undefined {
    const winner = this.winners.get(id);
    if (!winner) return undefined;

    const car = this.cars.get(winner.carId);
    if (!car) return undefined;

    return { ...winner, car };
  }

  getWinnerByCarId(carId: number): Winner | undefined {
    // Convert to array to avoid iteration issues
    const allWinners = Array.from(this.winners.values());
    return allWinners.find((winner) => winner.carId === carId);
  }

  createWinner(winner: { carId: number; time: number }): Winner {
    // Try to find existing winner by carId
    const existingWinner = this.getWinnerByCarId(winner.carId);

    if (existingWinner) {
      // Update existing winner
      return this.updateWinner(existingWinner.id, {
        wins: existingWinner.wins + 1,
        bestTime: Math.min(existingWinner.bestTime, winner.time),
      }) as Winner;
    }

    // Create new winner
    const id = this.nextWinnerId++;
    const newWinner: Winner = {
      id,
      carId: winner.carId,
      wins: 1,
      bestTime: winner.time,
    };
    this.winners.set(id, newWinner);
    return newWinner;
  }

  updateWinner(
    id: number,
    winner: { wins?: number; bestTime?: number }
  ): Winner | undefined {
    const existingWinner = this.winners.get(id);
    if (!existingWinner) return undefined;

    const updatedWinner: Winner = { ...existingWinner };
    if (winner.wins !== undefined) updatedWinner.wins = winner.wins;
    if (winner.bestTime !== undefined) updatedWinner.bestTime = winner.bestTime;

    this.winners.set(id, updatedWinner);
    return updatedWinner;
  }

  deleteWinner(id: number): boolean {
    return this.winners.delete(id);
  }

  // Utility methods
  generateRandomCars(count: number = 100): void {
    for (let i = 0; i < count; i++) {
      const randomCar = generateRandomCar();
      this.createCar(randomCar);
    }
  }
}

// Singleton instance
export const mockData = new MockData();
