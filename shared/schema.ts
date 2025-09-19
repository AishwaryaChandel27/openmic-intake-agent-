import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  lastAppointment: text("last_appointment"),
  lastTopic: text("last_topic"),
  riskLevel: text("risk_level").default("low"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bots = pgTable("bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  openmicBotId: text("openmic_bot_id").unique(),
  personality: jsonb("personality").$type<string[]>(),
  greeting: text("greeting"),
  crisisKeywords: jsonb("crisis_keywords").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const calls = pgTable("calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  botId: varchar("bot_id").references(() => bots.id),
  openmicCallId: text("openmic_call_id"),
  duration: integer("duration"), // in seconds
  transcript: text("transcript"),
  sentimentScore: text("sentiment_score"), // e.g., "-0.7"
  sentimentLabel: text("sentiment_label"), // e.g., "distress", "positive", "neutral"
  status: text("status").default("completed"), // completed, crisis, follow-up
  timestamp: timestamp("timestamp").defaultNow(),
});

export const callFlags = pgTable("call_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callId: varchar("call_id").references(() => calls.id),
  flagType: text("flag_type").notNull(), // crisis, harm, hopeless, etc.
  severity: text("severity").default("medium"), // low, medium, high
  content: text("content"), // the specific text that triggered the flag
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiCalls = pgTable("api_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callId: varchar("call_id").references(() => calls.id),
  endpoint: text("endpoint").notNull(), // /api/getPatientInfo, etc.
  requestData: jsonb("request_data"),
  responseData: jsonb("response_data"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertPatientSchema = createInsertSchema(patients).omit({
  createdAt: true,
});

export const insertBotSchema = createInsertSchema(bots).omit({
  id: true,
  createdAt: true,
});

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  timestamp: true,
});

export const insertCallFlagSchema = createInsertSchema(callFlags).omit({
  id: true,
  createdAt: true,
});

export const insertApiCallSchema = createInsertSchema(apiCalls).omit({
  id: true,
  timestamp: true,
});

// Types
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Bot = typeof bots.$inferSelect;
export type InsertBot = z.infer<typeof insertBotSchema>;

export type Call = typeof calls.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;

export type CallFlag = typeof callFlags.$inferSelect;
export type InsertCallFlag = z.infer<typeof insertCallFlagSchema>;

export type ApiCall = typeof apiCalls.$inferSelect;
export type InsertApiCall = z.infer<typeof insertApiCallSchema>;

// Response types for API
export type CallWithDetails = Call & {
  patient?: Patient;
  bot?: Bot;
  flags: CallFlag[];
  apiCalls: ApiCall[];
};
