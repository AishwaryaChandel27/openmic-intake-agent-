import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface SentimentAnalysis {
  score: number; // -1 to 1, where -1 is very negative, 1 is very positive
  label: string; // "positive", "neutral", "distress", "crisis"
  confidence: number; // 0 to 1
  flags: CrisisFlag[];
}

export interface CrisisFlag {
  type: string; // "self-harm", "suicide", "hopeless", etc.
  severity: "low" | "medium" | "high";
  content: string; // the specific text that triggered the flag
}

export async function analyzeSentiment(transcript: string, crisisKeywords: string[] = []): Promise<SentimentAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a mental health sentiment analysis expert. Analyze the conversation transcript for:
          1. Overall sentiment score (-1 to 1, where -1 is severely distressed, 1 is very positive)
          2. Sentiment label (positive, neutral, distress, crisis)
          3. Confidence level (0-1)
          4. Crisis flags for any concerning language

          Crisis keywords to watch for: ${crisisKeywords.join(', ')}
          
          Look for indicators of:
          - Self-harm intentions
          - Suicidal ideation
          - Hopelessness
          - Immediate danger
          - Substance abuse mentions
          - Violent thoughts

          Respond with JSON in this format:
          {
            "score": number,
            "label": string,
            "confidence": number,
            "flags": [
              {
                "type": string,
                "severity": "low|medium|high",
                "content": string
              }
            ]
          }`,
        },
        {
          role: "user",
          content: `Analyze this mental health conversation transcript:\n\n${transcript}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      score: Math.max(-1, Math.min(1, result.score || 0)),
      label: result.label || "neutral",
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
      flags: result.flags || [],
    };
  } catch (error) {
    console.error("Failed to analyze sentiment:", error);
    
    // Fallback analysis for critical keywords
    const flags: CrisisFlag[] = [];
    const lowerTranscript = transcript.toLowerCase();
    
    crisisKeywords.forEach(keyword => {
      if (lowerTranscript.includes(keyword.toLowerCase())) {
        flags.push({
          type: keyword,
          severity: "high",
          content: `Keyword "${keyword}" detected in transcript`,
        });
      }
    });

    return {
      score: flags.length > 0 ? -0.8 : 0,
      label: flags.length > 0 ? "crisis" : "neutral",
      confidence: 0.5,
      flags,
    };
  }
}

export async function generateCallSummary(transcript: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a mental health professional. Create a concise, professional summary of this patient interaction. Focus on key concerns, emotional state, resources provided, and any follow-up needs. Keep it under 200 words.",
        },
        {
          role: "user",
          content: `Summarize this mental health call transcript:\n\n${transcript}`,
        },
      ],
    });

    return response.choices[0].message.content || "Unable to generate summary";
  } catch (error) {
    console.error("Failed to generate call summary:", error);
    return "Summary generation failed";
  }
}
