import { type Patient, type InsertPatient, type Bot, type InsertBot, type Call, type InsertCall, type CallFlag, type InsertCallFlag, type ApiCall, type InsertApiCall, type CallWithDetails } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Patients
  getPatient(id: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  getAllPatients(): Promise<Patient[]>;

  // Bots
  getBot(id: string): Promise<Bot | undefined>;
  getBotByOpenmicId(openmicBotId: string): Promise<Bot | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined>;
  deleteBot(id: string): Promise<boolean>;
  getAllBots(): Promise<Bot[]>;

  // Calls
  getCall(id: string): Promise<Call | undefined>;
  getCallWithDetails(id: string): Promise<CallWithDetails | undefined>;
  createCall(call: InsertCall): Promise<Call>;
  updateCall(id: string, updates: Partial<Call>): Promise<Call | undefined>;
  getAllCalls(): Promise<CallWithDetails[]>;
  getCallsByPatient(patientId: string): Promise<Call[]>;

  // Call Flags
  createCallFlag(flag: InsertCallFlag): Promise<CallFlag>;
  getFlagsByCall(callId: string): Promise<CallFlag[]>;

  // API Calls
  createApiCall(apiCall: InsertApiCall): Promise<ApiCall>;
  getApiCallsByCall(callId: string): Promise<ApiCall[]>;
}

export class MemStorage implements IStorage {
  private patients: Map<string, Patient> = new Map();
  private bots: Map<string, Bot> = new Map();
  private calls: Map<string, Call> = new Map();
  private callFlags: Map<string, CallFlag> = new Map();
  private apiCalls: Map<string, ApiCall> = new Map();

  constructor() {
    // Initialize with some sample data for demonstration
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample patients
    const patient1: Patient = {
      id: "P123",
      name: "John Doe",
      lastAppointment: "2025-08-12",
      lastTopic: "anxiety management",
      riskLevel: "high",
      createdAt: new Date(),
    };
    
    const patient2: Patient = {
      id: "P456",
      name: "Sarah Miller",
      lastAppointment: "2025-09-10",
      lastTopic: "depression support",
      riskLevel: "low",
      createdAt: new Date(),
    };

    this.patients.set(patient1.id, patient1);
    this.patients.set(patient2.id, patient2);

    // Sample bot
    const bot1: Bot = {
      id: randomUUID(),
      name: "Mental Wellness Assistant v2.1",
      openmicBotId: "bot_123456",
      personality: ["empathetic", "calm", "non-judgmental"],
      greeting: "Hello, thank you for calling. This is your Mental Wellness Assistant. To protect your privacy, this call is not being recorded for human review. Please provide your unique Patient ID to get started.",
      crisisKeywords: ["suicidal", "harm", "hopeless", "end it all"],
      isActive: true,
      createdAt: new Date(),
    };

    this.bots.set(bot1.id, bot1);
  }

  // Patient methods
  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const newPatient: Patient = {
      ...patient,
      lastAppointment: patient.lastAppointment ?? null,
      lastTopic: patient.lastTopic ?? null,
      riskLevel: patient.riskLevel ?? null,
      createdAt: new Date(),
    };
    this.patients.set(newPatient.id, newPatient);
    return newPatient;
  }

  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  // Bot methods
  async getBot(id: string): Promise<Bot | undefined> {
    return this.bots.get(id);
  }

  async getBotByOpenmicId(openmicBotId: string): Promise<Bot | undefined> {
    return Array.from(this.bots.values()).find(bot => bot.openmicBotId === openmicBotId);
  }

  async createBot(bot: InsertBot): Promise<Bot> {
    const id = randomUUID();
    const newBot: Bot = {
      ...bot,
      id,
      openmicBotId: bot.openmicBotId ?? null,
      personality: (bot.personality as string[]) ?? null,
      greeting: bot.greeting ?? null,
      crisisKeywords: (bot.crisisKeywords as string[]) ?? null,
      isActive: bot.isActive ?? null,
      createdAt: new Date(),
    };
    this.bots.set(id, newBot);
    return newBot;
  }

  async updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined> {
    const bot = this.bots.get(id);
    if (!bot) return undefined;
    
    const updatedBot = { ...bot, ...updates };
    this.bots.set(id, updatedBot);
    return updatedBot;
  }

  async deleteBot(id: string): Promise<boolean> {
    return this.bots.delete(id);
  }

  async getAllBots(): Promise<Bot[]> {
    return Array.from(this.bots.values());
  }

  // Call methods
  async getCall(id: string): Promise<Call | undefined> {
    return this.calls.get(id);
  }

  async getCallWithDetails(id: string): Promise<CallWithDetails | undefined> {
    const call = this.calls.get(id);
    if (!call) return undefined;

    const patient = call.patientId ? await this.getPatient(call.patientId) : undefined;
    const bot = call.botId ? await this.getBot(call.botId) : undefined;
    const flags = await this.getFlagsByCall(id);
    const apiCalls = await this.getApiCallsByCall(id);

    return {
      ...call,
      patient,
      bot,
      flags,
      apiCalls,
    };
  }

  async createCall(call: InsertCall): Promise<Call> {
    const id = randomUUID();
    const newCall: Call = {
      ...call,
      id,
      status: call.status ?? null,
      duration: call.duration ?? null,
      patientId: call.patientId ?? null,
      botId: call.botId ?? null,
      openmicCallId: call.openmicCallId ?? null,
      transcript: call.transcript ?? null,
      sentimentScore: call.sentimentScore ?? null,
      sentimentLabel: call.sentimentLabel ?? null,
      timestamp: new Date(),
    };
    this.calls.set(id, newCall);
    return newCall;
  }

  async updateCall(id: string, updates: Partial<Call>): Promise<Call | undefined> {
    const call = this.calls.get(id);
    if (!call) return undefined;
    
    const updatedCall = { ...call, ...updates };
    this.calls.set(id, updatedCall);
    return updatedCall;
  }

  async getAllCalls(): Promise<CallWithDetails[]> {
    const calls = Array.from(this.calls.values());
    const callsWithDetails: CallWithDetails[] = [];

    for (const call of calls) {
      const patient = call.patientId ? await this.getPatient(call.patientId) : undefined;
      const bot = call.botId ? await this.getBot(call.botId) : undefined;
      const flags = await this.getFlagsByCall(call.id);
      const apiCalls = await this.getApiCallsByCall(call.id);

      callsWithDetails.push({
        ...call,
        patient,
        bot,
        flags,
        apiCalls,
      });
    }

    return callsWithDetails.sort((a, b) => 
      new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
    );
  }

  async getCallsByPatient(patientId: string): Promise<Call[]> {
    return Array.from(this.calls.values()).filter(call => call.patientId === patientId);
  }

  // Call Flag methods
  async createCallFlag(flag: InsertCallFlag): Promise<CallFlag> {
    const id = randomUUID();
    const newFlag: CallFlag = {
      ...flag,
      id,
      content: flag.content ?? null,
      callId: flag.callId ?? null,
      severity: flag.severity ?? null,
      createdAt: new Date(),
    };
    this.callFlags.set(id, newFlag);
    return newFlag;
  }

  async getFlagsByCall(callId: string): Promise<CallFlag[]> {
    return Array.from(this.callFlags.values()).filter(flag => flag.callId === callId);
  }

  // API Call methods
  async createApiCall(apiCall: InsertApiCall): Promise<ApiCall> {
    const id = randomUUID();
    const newApiCall: ApiCall = {
      ...apiCall,
      id,
      callId: apiCall.callId ?? null,
      requestData: apiCall.requestData ?? null,
      responseData: apiCall.responseData ?? null,
      timestamp: new Date(),
    };
    this.apiCalls.set(id, newApiCall);
    return newApiCall;
  }

  async getApiCallsByCall(callId: string): Promise<ApiCall[]> {
    return Array.from(this.apiCalls.values()).filter(apiCall => apiCall.callId === callId);
  }
}

export const storage = new MemStorage();
