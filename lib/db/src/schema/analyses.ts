import { pgTable, serial, text, integer, real, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  condition: text("condition"),
  conditionDetails: text("condition_details"),
  prediction: text("prediction").notNull(),
  riskLevel: text("risk_level").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  cancerType: text("cancer_type"),
  abcdeScore: text("abcde_score"),
  lesionArea: text("lesion_area"),
  recommendations: text("recommendations"),
  imageUrl: text("image_url"),
  segmentedImageUrl: text("segmented_image_url"),
  heatmapImageUrl: text("heatmap_image_url"),
  riskFactors: jsonb("risk_factors"),
  riskProgressData: jsonb("risk_progress_data"),
  explainableAiReasons: jsonb("explainable_ai_reasons"),
  reportId: text("report_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, createdAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
