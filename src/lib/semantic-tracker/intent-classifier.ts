// lib/semantic-tracker/intent-classifier.ts
import { GoogleGenAI } from "@google/genai";

export class IntentClassifier {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY in environment variables");
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  // lib/semantic-tracker/intent-classifier.ts
  async classifyIntent(
    text: string,
    keywords: string[]
  ): Promise<{
    intent: "positive" | "negative" | "neutral";
    confidence: number;
    explanation: string;
  }> {
    const prompt = `
Analyze the following text and determine the intent regarding the mentioned keywords: ${keywords.join(
      ", "
    )}

Text: "${text}"

Classify the intent as:
- positive: Shows interest, asking for help, praising, or looking for solutions
- negative: Complaining, criticizing, or expressing dissatisfaction
- neutral: Just mentioning without clear positive/negative sentiment

Respond only in JSON format without markdown code fences:
{
  "intent": "positive|negative|neutral",
  "confidence": 0.85,
  "explanation": "Brief one line explanation of why you classified it this way"
}
`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
          maxOutputTokens: 200,
        },
      });

      let output = response.text ?? "";

      // Remove ```json and ``` fences if they exist
      output = output
        .trim()
        .replace(/^```json\s*/, "")
        .replace(/```$/, "");

      const parsed = JSON.parse(output);

      return {
        intent: parsed.intent || "neutral",
        confidence: parsed.confidence ?? 0.5,
        explanation: parsed.explanation || "Unable to classify intent",
      };
    } catch (error) {
      console.error("Error classifying intent:", error);
      return {
        intent: "neutral",
        confidence: 0.5,
        explanation: "Error in classification",
      };
    }
  }
}
