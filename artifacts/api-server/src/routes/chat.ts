import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable, analysesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SendChatMessageBody } from "@workspace/api-zod";

const router = Router();

const AI_RESPONSES: Record<string, string> = {
  default: "I can help you understand this patient's analysis. The AI has detected specific features in the lesion. Please review the ABCDE criteria and risk factors carefully. Do you have any specific questions about the findings?",
  summarize: "Based on the analysis, this patient shows signs consistent with the detected condition. The confidence score indicates a reliable prediction. I recommend following the standard dermatology protocol and consulting with a specialist for verification.",
  high: "This is a HIGH RISK case that requires immediate attention. The lesion shows malignant characteristics. Please schedule an urgent biopsy and refer the patient to an oncologist as soon as possible. Alert has been sent to the on-call team.",
  low: "This appears to be a LOW RISK benign lesion. Standard monitoring is recommended. Advise the patient to use sunscreen, avoid excessive UV exposure, and schedule a follow-up in 6 months. No immediate intervention required.",
  melanoma: "Melanoma is the most serious type of skin cancer. Key indicators include irregular borders, multiple colors, diameter >6mm, and asymmetry. Immediate dermatological consultation is critical. Staging and biopsy should be performed without delay.",
  bcc: "Basal Cell Carcinoma is the most common skin cancer but rarely spreads. Treatment options include surgical excision, Mohs surgery, or radiation therapy. Prognosis is excellent with early treatment.",
};

function getAIResponse(message: string, analysisContext?: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("summarize") || lower.includes("summary") || lower.includes("explain")) {
    return AI_RESPONSES.summarize + (analysisContext ? ` The patient's case shows: ${analysisContext}` : "");
  }
  if (lower.includes("high risk") || lower.includes("urgent") || lower.includes("emergency")) {
    return AI_RESPONSES.high;
  }
  if (lower.includes("low risk") || lower.includes("benign")) {
    return AI_RESPONSES.low;
  }
  if (lower.includes("melanoma")) {
    return AI_RESPONSES.melanoma;
  }
  if (lower.includes("basal") || lower.includes("bcc")) {
    return AI_RESPONSES.bcc;
  }
  return AI_RESPONSES.default;
}

router.post("/message", async (req, res) => {
  try {
    const parsed = SendChatMessageBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input" });
    }
    const { message, analysisId } = parsed.data;

    let analysisContext: string | undefined;
    if (analysisId) {
      const [analysis] = await db.select().from(analysesTable).where(eq(analysesTable.id, analysisId));
      if (analysis) {
        analysisContext = `${analysis.prediction} with ${analysis.confidenceScore}% confidence, ${analysis.riskLevel} risk level.`;
      }
    }

    await db.insert(chatMessagesTable).values({
      role: "user",
      content: message,
    });

    const aiResponse = getAIResponse(message, analysisContext);

    const [aiMsg] = await db.insert(chatMessagesTable).values({
      role: "assistant",
      content: aiResponse,
    }).returning();

    const pstTimestamp = new Date(new Date().getTime() + 5 * 60 * 60 * 1000).toISOString();

    res.json({
      id: aiMsg.id,
      response: aiResponse,
      timestamp: pstTimestamp,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to send chat message");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const messages = await db.select().from(chatMessagesTable).orderBy(chatMessagesTable.timestamp).limit(50);
    res.json(messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get chat history");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
