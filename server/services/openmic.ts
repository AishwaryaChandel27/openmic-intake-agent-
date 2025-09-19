export interface OpenMicBot {
  id: string;
  name: string;
  personality: string[];
  greeting: string;
  functions?: OpenMicFunction[];
}

export interface OpenMicFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface OpenMicCallData {
  callId: string;
  transcript: string;
  duration: number;
  metadata: Record<string, any>;
}

// OpenMic API client
class OpenMicClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.OPENMIC_API_URL || "https://api.openmic.ai";
    this.apiKey = process.env.OPENMIC_API_KEY || process.env.OPENMIC_API_KEY_ENV_VAR || "default_key";
  }

  async createBot(bot: Omit<OpenMicBot, "id">): Promise<OpenMicBot> {
    try {
      const response = await fetch(`${this.baseUrl}/bots`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: bot.name,
          personality: bot.personality,
          greeting: bot.greeting,
          functions: [
            {
              name: "getPatientInfo",
              description: "Retrieve patient information by ID",
              parameters: {
                type: "object",
                properties: {
                  patientId: {
                    type: "string",
                    description: "The patient's unique ID"
                  }
                },
                required: ["patientId"]
              }
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenMic API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to create OpenMic bot:", error);
      // Return mock response for development
      return {
        id: `bot_${Date.now()}`,
        name: bot.name,
        personality: bot.personality,
        greeting: bot.greeting,
        functions: bot.functions,
      };
    }
  }

  async updateBot(botId: string, updates: Partial<OpenMicBot>): Promise<OpenMicBot> {
    try {
      const response = await fetch(`${this.baseUrl}/bots/${botId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`OpenMic API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to update OpenMic bot:", error);
      throw error;
    }
  }

  async deleteBot(botId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/bots/${botId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`OpenMic API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to delete OpenMic bot:", error);
      throw error;
    }
  }

  async getBots(): Promise<OpenMicBot[]> {
    try {
      const response = await fetch(`${this.baseUrl}/bots`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`OpenMic API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch OpenMic bots:", error);
      return [];
    }
  }
}

export const openMicClient = new OpenMicClient();
