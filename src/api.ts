import {
  Car,
  EngineData,
  PaginatedResponse,
  SortOrder,
  Winner,
  WinnerWithCar,
} from "./types";
import { mockData } from "./mockData.ts";

const BASE_URL = "/api";

// Determine if we're using mock data or real API
// When running with Vite standalone, there's no backend server
const USE_MOCK_DATA =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }

  try {
    // Get the content type to check if it's actually JSON
    const contentType = response.headers.get("content-type");

    // Try to get the text first to debug
    const text = await response.text();

    // Log for debugging
    console.log("API Response:", {
      url: response.url,
      status: response.status,
      contentType,
      textLength: text.length,
      textPreview: text.substring(0, 100), // Show just the first 100 chars
    });

    // Check if it's HTML instead of JSON
    if (
      text.trim().startsWith("<!DOCTYPE") ||
      text.trim().startsWith("<html")
    ) {
      console.error(
        "Error: Received HTML instead of JSON",
        text.substring(0, 200)
      );
      throw new Error(
        "Received HTML instead of JSON. The server may be returning an error page."
      );
    }

    // Parse manually since we already consumed the body as text
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("Error parsing API response:", error);
    throw new Error(
      `Failed to parse response: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Car API endpoints
export async function fetchCars(
  page: number = 1,
  limit: number = 7
): Promise<PaginatedResponse<Car>> {
  console.log(`Fetching cars for page ${page} with limit ${limit}`);

  // Use mock data if running locally
  if (USE_MOCK_DATA) {
    console.log("Using mock data for cars");
    return mockData.getCars(page, limit);
  }

  const response = await fetch(
    `${BASE_URL}/garage?page=${page}&limit=${limit}`
  );
  return handleResponse<PaginatedResponse<Car>>(response);
}

export async function fetchCar(id: number): Promise<Car> {
  if (USE_MOCK_DATA) {
    const car = mockData.getCar(id);
    if (!car) throw new Error(`Car with id ${id} not found`);
    return car;
  }

  const response = await fetch(`${BASE_URL}/garage/${id}`);
  return handleResponse<Car>(response);
}

export async function createCar(car: {
  name: string;
  color: string;
}): Promise<Car> {
  if (USE_MOCK_DATA) {
    return mockData.createCar(car);
  }

  const response = await fetch(`${BASE_URL}/garage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(car),
  });
  return handleResponse<Car>(response);
}

export async function updateCar(
  id: number,
  car: { name: string; color: string }
): Promise<Car> {
  if (USE_MOCK_DATA) {
    const updatedCar = mockData.updateCar(id, car);
    if (!updatedCar) throw new Error(`Car with id ${id} not found`);
    return updatedCar;
  }

  const response = await fetch(`${BASE_URL}/garage/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(car),
  });
  return handleResponse<Car>(response);
}

export async function deleteCar(id: number): Promise<void> {
  if (USE_MOCK_DATA) {
    const success = mockData.deleteCar(id);
    if (!success) throw new Error(`Car with id ${id} not found`);
    return;
  }

  const response = await fetch(`${BASE_URL}/garage/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(response);
}

export async function generateRandomCars(count: number = 100): Promise<void> {
  if (USE_MOCK_DATA) {
    mockData.generateRandomCars(count);
    return;
  }

  const response = await fetch(`${BASE_URL}/garage/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ count }),
  });
  return handleResponse<void>(response);
}

// Engine API endpoints
export async function startEngine(id: number): Promise<EngineData> {
  if (USE_MOCK_DATA) {
    return mockData.startEngine(id);
  }

  const response = await fetch(`${BASE_URL}/engine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, status: "started" }),
  });
  return handleResponse<EngineData>(response);
}

export async function driveEngine(id: number): Promise<{ success: boolean }> {
  if (USE_MOCK_DATA) {
    return mockData.driveEngine(id);
  }

  try {
    const response = await fetch(`${BASE_URL}/engine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status: "drive" }),
    });

    // Handle 500 error specifically for engine broke down scenario
    if (response.status === 500) {
      return { success: false };
    }

    return handleResponse<{ success: boolean }>(response);
  } catch (error) {
    console.error("Drive engine error:", error);
    return { success: false };
  }
}

export async function stopEngine(id: number): Promise<void> {
  if (USE_MOCK_DATA) {
    // Mock implementation is a no-op
    return;
  }

  const response = await fetch(`${BASE_URL}/engine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, status: "stopped" }),
  });
  return handleResponse<void>(response);
}

// Winners API endpoints
export async function fetchWinners(
  page: number = 1,
  limit: number = 10,
  sort: string = "id",
  order: SortOrder = "ASC"
): Promise<PaginatedResponse<WinnerWithCar>> {
  console.log(
    `Fetching winners for page ${page} with limit ${limit}, sort=${sort}, order=${order}`
  );

  if (USE_MOCK_DATA) {
    console.log("Using mock data for winners");
    return mockData.getWinners(page, limit, sort, order);
  }

  const response = await fetch(
    `${BASE_URL}/winners?page=${page}&limit=${limit}&sort=${sort}&order=${order}`
  );
  return handleResponse<PaginatedResponse<WinnerWithCar>>(response);
}

export async function fetchWinner(id: number): Promise<Winner> {
  if (USE_MOCK_DATA) {
    const winner = mockData.getWinner(id);
    if (!winner) throw new Error(`Winner with id ${id} not found`);
    return winner;
  }

  const response = await fetch(`${BASE_URL}/winners/${id}`);
  return handleResponse<Winner>(response);
}

export async function createWinner(
  carId: number,
  time: number
): Promise<Winner> {
  if (USE_MOCK_DATA) {
    // We'll handle the existingWinner check in the mock implementation
    return mockData.createWinner({ carId, time });
  }

  // First check if the winner already exists
  try {
    const existingWinner = await fetchWinnerByCarId(carId);

    if (existingWinner) {
      // Update existing winner
      return updateWinner(existingWinner.id, {
        wins: existingWinner.wins + 1,
        bestTime: Math.min(existingWinner.bestTime, time),
      });
    }
  } catch (error) {
    // If winner doesn't exist, continue to create
    console.log("No existing winner found, creating new one");
  }

  // Create new winner
  const response = await fetch(`${BASE_URL}/winners`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ carId, time }),
  });
  return handleResponse<Winner>(response);
}

export async function updateWinner(
  id: number,
  data: { wins?: number; bestTime?: number }
): Promise<Winner> {
  if (USE_MOCK_DATA) {
    const updatedWinner = mockData.updateWinner(id, data);
    if (!updatedWinner) throw new Error(`Winner with id ${id} not found`);
    return updatedWinner;
  }

  const response = await fetch(`${BASE_URL}/winners/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Winner>(response);
}

export async function deleteWinner(id: number): Promise<void> {
  if (USE_MOCK_DATA) {
    const success = mockData.deleteWinner(id);
    if (!success) throw new Error(`Winner with id ${id} not found`);
    return;
  }

  const response = await fetch(`${BASE_URL}/winners/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(response);
}

export async function fetchWinnerByCarId(
  carId: number
): Promise<Winner | null> {
  if (USE_MOCK_DATA) {
    const winner = mockData.getWinnerByCarId(carId);
    return winner || null;
  }

  const response = await fetch(`${BASE_URL}/winners?carId=${carId}`);
  const winners = await handleResponse<Winner[]>(response);
  console.log(`Found ${winners.length} winners for carId ${carId}:`, winners);
  return winners.length > 0 ? winners[0] : null;
}
