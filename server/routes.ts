import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocketServer } from "./websocket";
import { insertAccidentReportSchema, insertViolationReportSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  setupWebSocketServer(httpServer);
  
  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  
  // Weather routes
  app.get("/api/weather/:location", async (req, res) => {
    try {
      const { location } = req.params;
      const weather = await storage.getWeather(location);
      
      if (!weather) {
        return res.status(404).json({ message: "Weather data not found for this location" });
      }
      
      res.json(weather);
    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });
  
  // Accident report routes
  app.post("/api/accident-reports", async (req, res) => {
    try {
      // Préparer les données pour la validation
      // Assurons-nous que dateTime est converti en Date si c'est une chaîne
      const data = {
        ...req.body,
        dateTime: req.body.dateTime ? new Date(req.body.dateTime) : undefined
      };
      
      console.log("Accident report data to validate:", data);
      
      const validationResult = insertAccidentReportSchema.safeParse(data);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        console.error("Validation error:", errorMessage);
        return res.status(400).json({ message: errorMessage });
      }
      
      const newReport = await storage.createAccidentReport(validationResult.data);
      res.status(201).json(newReport);
    } catch (error) {
      console.error("Error creating accident report:", error);
      res.status(500).json({ message: "Failed to create accident report" });
    }
  });
  
  app.get("/api/accident-reports", async (_req, res) => {
    try {
      const reports = await storage.getAccidentReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching accident reports:", error);
      res.status(500).json({ message: "Failed to fetch accident reports" });
    }
  });
  
  app.get("/api/accident-reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const report = await storage.getAccidentReport(id);
      
      if (!report) {
        return res.status(404).json({ message: "Accident report not found" });
      }
      
      res.json(report);
    } catch (error) {
      console.error("Error fetching accident report:", error);
      res.status(500).json({ message: "Failed to fetch accident report" });
    }
  });
  
  // Violation report routes
  app.post("/api/violation-reports", async (req, res) => {
    try {
      const validationResult = insertViolationReportSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const newReport = await storage.createViolationReport(validationResult.data);
      res.status(201).json(newReport);
    } catch (error) {
      console.error("Error creating violation report:", error);
      res.status(500).json({ message: "Failed to create violation report" });
    }
  });
  
  app.get("/api/violation-reports", async (_req, res) => {
    try {
      const reports = await storage.getViolationReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching violation reports:", error);
      res.status(500).json({ message: "Failed to fetch violation reports" });
    }
  });
  
  app.get("/api/violation-reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const report = await storage.getViolationReport(id);
      
      if (!report) {
        return res.status(404).json({ message: "Violation report not found" });
      }
      
      res.json(report);
    } catch (error) {
      console.error("Error fetching violation report:", error);
      res.status(500).json({ message: "Failed to fetch violation report" });
    }
  });
  
  // Wanted persons routes
  app.get("/api/wanted-persons", async (req, res) => {
    try {
      const { query } = req.query;
      let wantedPersons;
      
      if (query && typeof query === "string") {
        wantedPersons = await storage.searchWantedPersons(query);
      } else {
        wantedPersons = await storage.getWantedPersons();
      }
      
      res.json(wantedPersons);
    } catch (error) {
      console.error("Error fetching wanted persons:", error);
      res.status(500).json({ message: "Failed to fetch wanted persons" });
    }
  });
  
  app.get("/api/wanted-persons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const person = await storage.getWantedPerson(id);
      
      if (!person) {
        return res.status(404).json({ message: "Wanted person not found" });
      }
      
      res.json(person);
    } catch (error) {
      console.error("Error fetching wanted person:", error);
      res.status(500).json({ message: "Failed to fetch wanted person" });
    }
  });

  return httpServer;
}
