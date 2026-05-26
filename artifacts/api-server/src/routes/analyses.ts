import { Router } from "express";
import { db } from "@workspace/db";
import { analysesTable } from "@workspace/db";
import { eq, ilike, or, gte, lte, desc } from "drizzle-orm";
import { UploadImageBody, GetAnalysisParams, DownloadReportParams, GetSimilarCasesParams, ListAnalysesQueryParams, CreateAnalysisBody } from "@workspace/api-zod";
import { createHash } from "crypto";

const router = Router();

// Only 4 canonical types
const FOUR_TYPES = ["Melanoma", "Basal Cell Carcinoma", "Benign Keratosis", "Nevus"] as const;
type SkinType = typeof FOUR_TYPES[number];
const MALIGNANT: SkinType[] = ["Melanoma", "Basal Cell Carcinoma"];

function generatePatientId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `PMS-${year}-${num.toString().padStart(5, "0")}`;
}

function generateReportId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `REP-${year}-${num.toString().padStart(5, "0")}`;
}

function getPSTTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + 5 * 60 * 60 * 1000);
}

function simulateAnalysis(_imageData?: string) {
  const idx = Math.floor(Math.random() * FOUR_TYPES.length);
  const condition = FOUR_TYPES[idx];
  const isMalignant = MALIGNANT.includes(condition as any);

  // Main confidence 85-98%
  const mainConf = parseFloat((isMalignant ? 85 + Math.random() * 13 : 88 + Math.random() * 10).toFixed(1));
  const riskLevel = isMalignant ? "High" : (Math.random() > 0.6 ? "Low" : "Medium");
  const abcdeScore = `${(Math.random() * 4 + 5).toFixed(1)} / 10`;
  const lesionArea = `${(Math.random() * 3 + 0.5).toFixed(2)} cm²`;
  const category = isMalignant ? "Malignant" : "Non-Cancerous";

  // Generate type probabilities — main type gets mainConf, rest share the remainder
  const remainder = 100 - mainConf;
  const otherTypes = FOUR_TYPES.filter(t => t !== condition);
  const splits = [
    parseFloat((remainder * 0.55).toFixed(1)),
    parseFloat((remainder * 0.30).toFixed(1)),
    parseFloat((remainder * 0.15).toFixed(1)),
  ];
  const typeProbs: Record<string, number> = { [condition]: mainConf };
  otherTypes.forEach((t, i) => { typeProbs[t] = splits[i]; });

  const months = ["May 2024","Jun 2024","Jul 2024","Aug 2024","Sep 2024","Oct 2024","Nov 2024","Dec 2024","Jan 2025","Feb 2025","Mar 2025"];
  const baseRisk = isMalignant ? 45 : 15;
  const riskProgressData = months.map((month, i) => ({
    month,
    riskScore: Math.min(95, baseRisk + i * (isMalignant ? 4.5 : 1.2) + (Math.random() * 8 - 4)),
  }));

  const explainableAiReasons = isMalignant
    ? ["Irregular border detected","Asymmetry in shape","Multiple color variations","Diameter > 6mm","Evolution in recent months"]
    : ["Regular border detected","Symmetrical shape","Uniform coloration","Diameter < 6mm","Stable appearance"];

  const recommendations = isMalignant
    ? "It is recommended to consult a dermatologist as soon as possible for further evaluation and possible biopsy."
    : "Routine skin check-up advised. No immediate treatment required. Monitor for any changes. Use sunscreen regularly.";

  return {
    condition,
    riskLevel,
    confidenceScore: mainConf,
    cancerType: condition,
    category,
    abcdeScore,
    lesionArea,
    recommendations,
    riskProgressData,
    explainableAiReasons,
    typeProbs,
  };
}

router.get("/", async (req, res) => {
  try {
    const parsed = ListAnalysesQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const conditions: any[] = [];

    if (params.search) {
      conditions.push(or(
        ilike(analysesTable.patientName, `%${params.search}%`),
        ilike(analysesTable.patientId, `%${params.search}%`)
      ));
    }
    if (params.patientId) conditions.push(ilike(analysesTable.patientId, `%${params.patientId}%`));
    if (params.dateFrom) conditions.push(gte(analysesTable.createdAt, new Date(params.dateFrom)));
    if (params.dateTo) conditions.push(lte(analysesTable.createdAt, new Date(params.dateTo)));

    const results = conditions.length > 0
      ? await db.select().from(analysesTable).where(conditions.length === 1 ? conditions[0] : conditions.reduce((a, b) => ({ ...a, ...b }))).orderBy(desc(analysesTable.createdAt))
      : await db.select().from(analysesTable).orderBy(desc(analysesTable.createdAt));

    res.json(results.map(formatAnalysis));
  } catch (err) {
    req.log.error({ err }, "Failed to list analyses");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/upload", async (_req, res) => {
  res.status(405).json({ error: "Method not allowed, use POST" });
});

router.post("/upload", async (req, res) => {
  try {
    const parsed = UploadImageBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error });
    }
    const { patientName, conditionDetails, age, gender, riskFactors, imageData } = parsed.data;
    const analysis = simulateAnalysis(imageData);
    const patientId = generatePatientId();
    const reportId = generateReportId();

    const [inserted] = await db.insert(analysesTable).values({
      patientId,
      patientName,
      age: age ?? null,
      gender: gender ?? null,
      condition: analysis.condition,
      conditionDetails: conditionDetails ?? null,
      prediction: analysis.condition,
      riskLevel: analysis.riskLevel,
      confidenceScore: analysis.confidenceScore,
      cancerType: analysis.cancerType,
      abcdeScore: analysis.abcdeScore,
      lesionArea: analysis.lesionArea,
      recommendations: analysis.recommendations,
      imageUrl: imageData ? `data:image/jpeg;base64,${imageData.replace(/^data:image\/\w+;base64,/, "")}` : null,
      segmentedImageUrl: null,
      heatmapImageUrl: null,
      riskFactors: riskFactors ?? {},
      riskProgressData: analysis.riskProgressData,
      explainableAiReasons: analysis.explainableAiReasons,
      reportId,
    }).returning();

    const similarCases = await db.select().from(analysesTable)
      .where(eq(analysesTable.prediction, analysis.condition))
      .orderBy(desc(analysesTable.createdAt))
      .limit(5);

    res.json({
      analysisId: inserted.id,
      prediction: inserted.prediction,
      riskLevel: inserted.riskLevel,
      confidenceScore: inserted.confidenceScore,
      cancerType: inserted.cancerType,
      category: analysis.category,
      abcdeScore: inserted.abcdeScore,
      lesionArea: inserted.lesionArea,
      recommendations: inserted.recommendations,
      imageUrl: inserted.imageUrl,
      segmentedImageUrl: null,
      heatmapImageUrl: null,
      riskProgressData: inserted.riskProgressData,
      explainableAiReasons: inserted.explainableAiReasons,
      typeProbs: analysis.typeProbs,
      similarCases: similarCases.map(formatSimilarCase),
      reportId: inserted.reportId,
      isHighRisk: inserted.riskLevel === "High",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to process image upload");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = CreateAnalysisBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const { patientName, age, gender, conditionDetails, riskFactors } = parsed.data;
    const analysis = simulateAnalysis();
    const patientId = generatePatientId();
    const reportId = generateReportId();

    const [inserted] = await db.insert(analysesTable).values({
      patientId, patientName,
      age: age ?? null, gender: gender ?? null,
      condition: analysis.condition, conditionDetails: conditionDetails ?? null,
      prediction: analysis.condition, riskLevel: analysis.riskLevel,
      confidenceScore: analysis.confidenceScore, cancerType: analysis.cancerType,
      abcdeScore: analysis.abcdeScore, lesionArea: analysis.lesionArea,
      recommendations: analysis.recommendations,
      riskFactors: riskFactors ?? {}, riskProgressData: analysis.riskProgressData,
      explainableAiReasons: analysis.explainableAiReasons, reportId,
    }).returning();

    res.status(201).json(formatAnalysis(inserted));
  } catch (err) {
    req.log.error({ err }, "Failed to create analysis");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/similar/:id", async (req, res) => {
  try {
    const parsed = GetSimilarCasesParams.safeParse({ id: parseInt(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
    const [analysis] = await db.select().from(analysesTable).where(eq(analysesTable.id, parsed.data.id));
    if (!analysis) return res.status(404).json({ error: "Not found" });
    const similar = await db.select().from(analysesTable)
      .where(eq(analysesTable.prediction, analysis.prediction))
      .orderBy(desc(analysesTable.createdAt)).limit(5);
    res.json(similar.map(formatSimilarCase));
  } catch (err) {
    req.log.error({ err }, "Failed to get similar cases");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/report", async (req, res) => {
  try {
    const parsed = DownloadReportParams.safeParse({ id: parseInt(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
    const [analysis] = await db.select().from(analysesTable).where(eq(analysesTable.id, parsed.data.id));
    if (!analysis) return res.status(404).json({ error: "Not found" });
    const reportId = analysis.reportId ?? generateReportId();
    const hash = createHash("sha256").update(`${reportId}-${analysis.id}-${analysis.patientId}`).digest("hex").slice(0, 16);
    res.json({ reportId, downloadUrl: `/api/analyses/${analysis.id}/report/pdf`, qrCodeData: `https://dermaai.pk/verify/${hash}`, generatedAt: getPSTTime().toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get report info");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const parsed = GetAnalysisParams.safeParse({ id: parseInt(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
    const [analysis] = await db.select().from(analysesTable).where(eq(analysesTable.id, parsed.data.id));
    if (!analysis) return res.status(404).json({ error: "Not found" });
    res.json(formatAnalysis(analysis));
  } catch (err) {
    req.log.error({ err }, "Failed to get analysis");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatAnalysis(a: any) {
  return {
    id: a.id, patientId: a.patientId, patientName: a.patientName,
    age: a.age, gender: a.gender, condition: a.condition, conditionDetails: a.conditionDetails,
    prediction: a.prediction, riskLevel: a.riskLevel,
    confidenceScore: typeof a.confidenceScore === "number" ? a.confidenceScore : parseFloat(a.confidenceScore),
    cancerType: a.cancerType, abcdeScore: a.abcdeScore, lesionArea: a.lesionArea,
    recommendations: a.recommendations, imageUrl: a.imageUrl,
    segmentedImageUrl: a.segmentedImageUrl, heatmapImageUrl: a.heatmapImageUrl,
    riskFactors: a.riskFactors, riskProgressData: a.riskProgressData,
    explainableAiReasons: a.explainableAiReasons, reportId: a.reportId,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
  };
}

function formatSimilarCase(a: any) {
  return {
    id: a.id, patientName: a.patientName, prediction: a.prediction,
    riskLevel: a.riskLevel,
    confidenceScore: typeof a.confidenceScore === "number" ? a.confidenceScore : parseFloat(a.confidenceScore),
    outcome: a.riskLevel === "High" ? "Referred for biopsy" : "Monitoring advised",
    imageUrl: a.imageUrl,
    date: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
  };
}

export default router;
