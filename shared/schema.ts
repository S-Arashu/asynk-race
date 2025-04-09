import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  varchar,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Car model
export const cars = pgTable("cars", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
});

export const insertCarSchema = createInsertSchema(cars).pick({
  name: true,
  color: true,
});

// Winner model
export const winners = pgTable("winners", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull(),
  wins: integer("wins").notNull().default(1),
  bestTime: numeric("best_time").notNull(),
});

export const insertWinnerSchema = createInsertSchema(winners)
  .pick({
    carId: true,
    bestTime: true,
  })
  .extend({
    wins: z.number().optional().default(1), // Make wins optional with default value of 1
  });

export const updateWinnerSchema = createInsertSchema(winners).pick({
  wins: true,
  bestTime: true,
});

// Engine status model for API - not stored in DB
export const engineSchema = z.object({
  velocity: z.number(),
  distance: z.number(),
});

// Sort order type
export type SortOrder = "ASC" | "DESC";

// Types
export type InsertCar = z.infer<typeof insertCarSchema>;
export type Car = typeof cars.$inferSelect;

export type InsertWinner = z.infer<typeof insertWinnerSchema>;
export type UpdateWinner = z.infer<typeof updateWinnerSchema>;
export type Winner = typeof winners.$inferSelect;

export type WinnerWithCar = Winner & {
  car: Car;
};

export type EngineData = z.infer<typeof engineSchema>;
