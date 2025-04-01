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
    this.users = new Map<number, User>();
    this.weatherEntries = new Map<string, Weather>();
    this.accidentReports = new Map<number, AccidentReport>();
    this.violationReports = new Map<number, ViolationReport>();
    this.wantedPersons = new Map<number, WantedPerson>();
    
    this.currentUserId = 1;
    this.currentAccidentId = 1;
    this.currentViolationId = 1;
    this.currentWantedId = 1;
    this.currentWeatherId = 1;
    
    // Initialize with sample data
    this.initializeWantedPersons();
    this.initializeWeather();
    this.initializeAccidentReports();
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

  private initializeAccidentReports() {
    // Créer des exemples de rapports d'accident
    const sampleReports: InsertAccidentReport[] = [
      {
        dateTime: new Date("2025-03-15T14:30:00"),
        location: "Intersection Rue King et Avenue Queen, Niagara Falls",
        description: "Collision latérale à une intersection",
        weatherConditions: "Pluie légère",
        roadConditions: "Chaussée mouillée",
        vehicle1: {
          licensePlate: "ABCD 123",
          makeModel: "Honda Civic",
          year: 2020,
          color: "Bleu"
        },
        vehicle2: {
          licensePlate: "WXYZ 789",
          makeModel: "Toyota Corolla",
          year: 2018,
          color: "Rouge"
        }
      },
      {
        dateTime: new Date("2025-03-20T09:15:00"),
        location: "Autoroute QEW, km 35, direction Toronto",
        description: "Collision arrière dans le trafic dense",
        weatherConditions: "Ensoleillé",
        roadConditions: "Sec",
        vehicle1: {
          licensePlate: "EFGH 456",
          makeModel: "Ford F-150",
          year: 2021,
          color: "Noir"
        },
        vehicle2: {
          licensePlate: "LMNO 321",
          makeModel: "Hyundai Tucson",
          year: 2019,
          color: "Blanc"
        }
      }
    ];

    // Ajouter les rapports d'exemple à la base de données
    sampleReports.forEach(report => {
      this.createAccidentReport(report);
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
      // Utiliser le bon typage pour la clé
      this.weatherEntries.set(String(existingWeather.id), updatedWeather);
      return updatedWeather;
    } else {
      const id = this.currentWeatherId++;
      const weather: Weather = {
        ...insertWeather,
        id,
        updatedAt: new Date()
      };
      // Utiliser le bon typage pour la clé
      this.weatherEntries.set(String(id), weather);
      return weather;
    }
  }

  // Accident report methods
  async createAccidentReport(insertReport: InsertAccidentReport): Promise<AccidentReport> {
    const id = this.currentAccidentId++;
    const now = new Date();
    
    // Créer explicitement l'objet en respectant la structure requise du type AccidentReport
    const report: AccidentReport = {
      id,
      dateTime: insertReport.dateTime,
      location: insertReport.location,
      description: insertReport.description,
      weatherConditions: insertReport.weatherConditions,
      roadConditions: insertReport.roadConditions,
      vehicle1: insertReport.vehicle1,
      vehicle2: insertReport.vehicle2 || null,
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
    
    // Créer explicitement l'objet en respectant la structure requise du type ViolationReport
    const report: ViolationReport = {
      id,
      dateTime: insertReport.dateTime,
      location: insertReport.location,
      description: insertReport.description,
      violationType: insertReport.violationType,
      severity: insertReport.severity,
      licensePlate: insertReport.licensePlate,
      makeModel: insertReport.makeModel,
      driverName: insertReport.driverName,
      licenseNumber: insertReport.licenseNumber,
      notes: insertReport.notes || null,
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
