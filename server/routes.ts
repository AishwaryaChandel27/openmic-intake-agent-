import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeSentiment, generateCallSummary } from "./services/openai";
import { openMicClient } from "./services/openmic";
import { insertBotSchema, insertCallSchema, insertPatientSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Pre-call webhook - Returns patient data for OpenMic
  app.post("/api/precall", async (req, res) => {
    try {
      const { patientId } = req.body;
      
      if (!patientId) {
        return res.status(400).json({ error: "Patient ID is required" });
      }

      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      res.json({
        patientId: patient.id,
        name: patient.name,
        lastAppointment: patient.lastAppointment,
        lastTopic: patient.lastTopic,
      });
    } catch (error) {
      console.error("Pre-call webhook error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // In-call function - Get patient info during call
  app.post("/api/getPatientInfo", async (req, res) => {
    try {
      const { patientId, callId } = req.body;
      
      if (!patientId) {
        return res.status(400).json({ error: "Patient ID is required" });
      }

      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // Log this API call
      if (callId) {
        await storage.createApiCall({
          callId,
          endpoint: "/api/getPatientInfo",
          requestData: { patientId },
          responseData: { patient },
        });
      }

      const resources = [
        {
          type: "article",
          title: "Coping with Anxiety",
          link: "https://www.nimh.nih.gov/health/topics/anxiety-disorders"
        },
        {
          type: "hotline",
          title: "24x7 Crisis Hotline",
          phone: "+1-800-273-8255"
        }
      ];

      res.json({
        patientId: patient.id,
        name: patient.name,
        resources,
      });
    } catch (error) {
      console.error("Get patient info error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Post-call webhook - Process call data and analyze
  app.post("/api/postcall", async (req, res) => {
    try {
      const { callId, patientId, botId, transcript, duration, metadata } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ error: "Transcript is required" });
      }

      // Get bot to access crisis keywords
      const bot = botId ? await storage.getBot(botId) : null;
      const crisisKeywords = bot?.crisisKeywords || ["suicidal", "harm", "hopeless"];

      // Analyze sentiment
      const analysis = await analyzeSentiment(transcript, crisisKeywords);
      
      // Create call record
      const call = await storage.createCall({
        patientId,
        botId,
        openmicCallId: callId,
        duration,
        transcript,
        sentimentScore: analysis.score.toString(),
        sentimentLabel: analysis.label,
        status: analysis.label === "crisis" ? "crisis" : "completed",
      });

      // Create flags for any crisis indicators
      for (const flag of analysis.flags) {
        await storage.createCallFlag({
          callId: call.id,
          flagType: flag.type,
          severity: flag.severity,
          content: flag.content,
        });
      }

      res.json({
        callId: call.id,
        analysis: {
          sentiment: analysis.label,
          score: analysis.score,
          confidence: analysis.confidence,
          flags: analysis.flags,
        },
        message: "Call processed successfully",
      });
    } catch (error) {
      console.error("Post-call webhook error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Bot Management API Routes
  app.get("/api/bots", async (req, res) => {
    try {
      const bots = await storage.getAllBots();
      res.json(bots);
    } catch (error) {
      console.error("Get bots error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/bots", async (req, res) => {
    try {
      const validatedData = insertBotSchema.parse(req.body);
      
      // Create bot in OpenMic
      const openmicBot = await openMicClient.createBot({
        name: validatedData.name,
        personality: validatedData.personality as string[] || [],
        greeting: validatedData.greeting || "",
      });

      // Store bot locally with OpenMic ID
      const bot = await storage.createBot({
        ...validatedData,
        openmicBotId: openmicBot.id,
      });

      res.status(201).json(bot);
    } catch (error) {
      console.error("Create bot error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/bots/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const bot = await storage.updateBot(id, updates);
      
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }

      res.json(bot);
    } catch (error) {
      console.error("Update bot error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/bots/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const bot = await storage.getBot(id);
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }

      // Delete from OpenMic if has external ID
      if (bot.openmicBotId) {
        try {
          await openMicClient.deleteBot(bot.openmicBotId);
        } catch (error) {
          console.error("Failed to delete from OpenMic:", error);
        }
      }

      const deleted = await storage.deleteBot(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Bot not found" });
      }

      res.json({ message: "Bot deleted successfully" });
    } catch (error) {
      console.error("Delete bot error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Call Logs API Routes
  app.get("/api/calls", async (req, res) => {
    try {
      const calls = await storage.getAllCalls();
      res.json(calls);
    } catch (error) {
      console.error("Get calls error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/calls/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const call = await storage.getCallWithDetails(id);
      
      if (!call) {
        return res.status(404).json({ error: "Call not found" });
      }

      res.json(call);
    } catch (error) {
      console.error("Get call details error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Patient API Routes
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      console.error("Get patients error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      console.error("Create patient error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const calls = await storage.getAllCalls();
      const bots = await storage.getAllBots();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCalls = calls.filter(call => 
        call.timestamp && new Date(call.timestamp) >= today
      );

      const crisisFlags = calls.reduce((count, call) => 
        count + call.flags.filter(flag => flag.severity === "high").length, 0
      );

      const avgDuration = calls.length > 0 
        ? calls.reduce((sum, call) => sum + (call.duration || 0), 0) / calls.length
        : 0;

      res.json({
        activeCalls: todayCalls.length,
        crisisFlags,
        avgResponseTime: "1.2s", // Mock value
        activeBots: bots.filter(bot => bot.isActive).length,
        avgDuration: Math.round(avgDuration),
      });
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
