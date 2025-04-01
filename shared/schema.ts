import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base users schema (kept from existing)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Weather information
export const weatherData = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  location: text("location").notNull(),
  temperature: integer("temperature").notNull(),
  conditions: text("conditions").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWeatherSchema = createInsertSchema(weatherData).omit({
  id: true,
  updatedAt: true
});

export type InsertWeather = z.infer<typeof insertWeatherSchema>;
export type Weather = typeof weatherData.$inferSelect;

// Accident reports
export const accidentReports = pgTable("accident_reports", {
  id: serial("id").primaryKey(),
  dateTime: timestamp("date_time").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  weatherConditions: text("weather_conditions").notNull(),
  roadConditions: text("road_conditions").notNull(),
  vehicle1: jsonb("vehicle1").notNull(),
  vehicle2: jsonb("vehicle2"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accidentVehicleSchema = z.object({
  licensePlate: z.string().min(1, "La plaque d'immatriculation est requise"),
  makeModel: z.string().min(1, "La marque et le modèle sont requis"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(1, "La couleur est requise")
});

export const insertAccidentReportSchema = createInsertSchema(accidentReports)
  .omit({
    id: true,
    createdAt: true
  })
  .extend({
    vehicle1: accidentVehicleSchema,
    vehicle2: accidentVehicleSchema.optional()
  });

export type InsertAccidentReport = z.infer<typeof insertAccidentReportSchema>;
export type AccidentReport = typeof accidentReports.$inferSelect;

// Traffic violation reports
export const violationReports = pgTable("violation_reports", {
  id: serial("id").primaryKey(),
  dateTime: timestamp("date_time").notNull(),
  location: text("location").notNull(),
  violationType: text("violation_type").notNull(),
  severity: text("severity").notNull(),
  description: text("description").notNull(),
  licensePlate: text("license_plate").notNull(),
  makeModel: text("make_model").notNull(),
  driverName: text("driver_name").notNull(),
  licenseNumber: text("license_number").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertViolationReportSchema = createInsertSchema(violationReports)
  .omit({
    id: true,
    createdAt: true
  });

export type InsertViolationReport = z.infer<typeof insertViolationReportSchema>;
export type ViolationReport = typeof violationReports.$inferSelect;

// Wanted persons
export const wantedPersons = pgTable("wanted_persons", {
  id: serial("id").primaryKey(),
  personId: text("person_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  height: integer("height").notNull(), // in cm
  weight: integer("weight").notNull(), // in kg
  lastLocation: text("last_location").notNull(),
  lastSeen: timestamp("last_seen").notNull(),
  warrants: text("warrants").notNull(),
  dangerLevel: text("danger_level").notNull(), // 'Dangereux' or 'Surveillance'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWantedPersonSchema = createInsertSchema(wantedPersons)
  .omit({
    id: true,
    createdAt: true
  });

export type InsertWantedPerson = z.infer<typeof insertWantedPersonSchema>;
export type WantedPerson = typeof wantedPersons.$inferSelect;
