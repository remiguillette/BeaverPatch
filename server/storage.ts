import { users, type User, type InsertUser, 
         accidentReports, type AccidentReport, type InsertAccidentReport,
         violationReports, type ViolationReport, type InsertViolationReport,
         wantedPersons, type WantedPerson, type InsertWantedPerson,
         weatherData, type Weather, type InsertWeather } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations (kept from existing)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Weather operations
  getWeather(location: string): Promise<Weather | undefined>;
  updateWeather(weather: InsertWeather): Promise<Weather>;
  
  // Accident report operations
  createAccidentReport(report: InsertAccidentReport): Promise<AccidentReport>;
  getAccidentReports(): Promise<AccidentReport[]>;
  getAccidentReport(id: number): Promise<AccidentReport | undefined>;
  
  // Violation report operations
  createViolationReport(report: InsertViolationReport): Promise<ViolationReport>;
  getViolationReports(): Promise<ViolationReport[]>;
  getViolationReport(id: number): Promise<ViolationReport | undefined>;
  
  // Wanted person operations
  createWantedPerson(person: InsertWantedPerson): Promise<WantedPerson>;
  getWantedPersons(): Promise<WantedPerson[]>;
  getWantedPerson(id: number): Promise<WantedPerson | undefined>;
  getWantedPersonByPersonId(personId: string): Promise<WantedPerson | undefined>;
  searchWantedPersons(query: string): Promise<WantedPerson[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private weatherEntries: Map<string, Weather>;
  private accidentReports: Map<number, AccidentReport>;
  private violationReports: Map<number, ViolationReport>;
  private wantedPersons: Map<number, WantedPerson>;
  
  private currentUserId: number;
  private currentAccidentId: number;
  private currentViolationId: number;
  private currentWantedId: number;
  private currentWeatherId: number;

  constructor() {
    this.users = new Map();
    this.weatherEntries = new Map();
    this.accidentReports = new Map();
    this.violationReports = new Map();
    this.wantedPersons = new Map();
    
    this.currentUserId = 1;
    this.currentAccidentId = 1;
    this.currentViolationId = 1;
    this.currentWantedId = 1;
    this.currentWeatherId = 1;
    
    // Initialize with sample wanted persons
    this.initializeWantedPersons();
    this.initializeWeather();
  }

  private initializeWantedPersons() {
    const wantedPersons: InsertWantedPerson[] = [
      {
        personId: "TRE-78542",
        name: "Marc Tremblay",
        age: 34,
        height: 183,
        weight: 89,
        lastLocation: "Niagara Falls, Ontario",
        lastSeen: new Date("2023-04-12"),
        warrants: "Vol à main armée, Agression avec arme",
        dangerLevel: "Dangereux"
      },
      {
        personId: "LAN-45123",
        name: "Sophie Langlois",
        age: 29,
        height: 168,
        weight: 62,
        lastLocation: "Toronto, Ontario",
        lastSeen: new Date("2023-05-17"),
        warrants: "Fraude, Faux et usage de faux",
        dangerLevel: "Surveillance"
      }
    ];

    wantedPersons.forEach(person => {
      this.createWantedPerson(person);
    });
  }

  private initializeWeather() {
    const weatherData: InsertWeather[] = [
      {
        location: "Toronto, ON",
        temperature: 3,
        conditions: "Nuageux"
      },
      {
        location: "Niagara Falls, ON",
        temperature: 2,
        conditions: "Partiellement nuageux"
      }
    ];

    weatherData.forEach(weather => {
      this.updateWeather(weather);
    });
  }

  // User methods (from existing)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Weather methods
  async getWeather(location: string): Promise<Weather | undefined> {
    return Array.from(this.weatherEntries.values()).find(
      weather => weather.location === location
    );
  }

  async updateWeather(insertWeather: InsertWeather): Promise<Weather> {
    const existingWeather = await this.getWeather(insertWeather.location);
    
    if (existingWeather) {
      const updatedWeather: Weather = {
        ...existingWeather,
        ...insertWeather,
        updatedAt: new Date()
      };
      this.weatherEntries.set(existingWeather.id, updatedWeather);
      return updatedWeather;
    } else {
      const id = this.currentWeatherId++;
      const weather: Weather = {
        ...insertWeather,
        id,
        updatedAt: new Date()
      };
      this.weatherEntries.set(id, weather);
      return weather;
    }
  }

  // Accident report methods
  async createAccidentReport(insertReport: InsertAccidentReport): Promise<AccidentReport> {
    const id = this.currentAccidentId++;
    const now = new Date();
    const report: AccidentReport = {
      ...insertReport,
      id,
      createdAt: now
    };
    this.accidentReports.set(id, report);
    return report;
  }

  async getAccidentReports(): Promise<AccidentReport[]> {
    return Array.from(this.accidentReports.values());
  }

  async getAccidentReport(id: number): Promise<AccidentReport | undefined> {
    return this.accidentReports.get(id);
  }

  // Violation report methods
  async createViolationReport(insertReport: InsertViolationReport): Promise<ViolationReport> {
    const id = this.currentViolationId++;
    const now = new Date();
    const report: ViolationReport = {
      ...insertReport,
      id,
      createdAt: now
    };
    this.violationReports.set(id, report);
    return report;
  }

  async getViolationReports(): Promise<ViolationReport[]> {
    return Array.from(this.violationReports.values());
  }

  async getViolationReport(id: number): Promise<ViolationReport | undefined> {
    return this.violationReports.get(id);
  }

  // Wanted person methods
  async createWantedPerson(insertPerson: InsertWantedPerson): Promise<WantedPerson> {
    const id = this.currentWantedId++;
    const now = new Date();
    const person: WantedPerson = {
      ...insertPerson,
      id,
      createdAt: now
    };
    this.wantedPersons.set(id, person);
    return person;
  }

  async getWantedPersons(): Promise<WantedPerson[]> {
    return Array.from(this.wantedPersons.values());
  }

  async getWantedPerson(id: number): Promise<WantedPerson | undefined> {
    return this.wantedPersons.get(id);
  }

  async getWantedPersonByPersonId(personId: string): Promise<WantedPerson | undefined> {
    return Array.from(this.wantedPersons.values()).find(
      person => person.personId === personId
    );
  }

  async searchWantedPersons(query: string): Promise<WantedPerson[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.wantedPersons.values()).filter(person => {
      return (
        person.name.toLowerCase().includes(lowercaseQuery) ||
        person.personId.toLowerCase().includes(lowercaseQuery) ||
        person.warrants.toLowerCase().includes(lowercaseQuery) ||
        person.lastLocation.toLowerCase().includes(lowercaseQuery)
      );
    });
  }
}

export const storage = new MemStorage();
