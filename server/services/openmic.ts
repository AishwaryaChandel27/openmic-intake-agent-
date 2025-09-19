export interface OpenMicBot {
  id: string;
  name: string;
  personality: string[];
  greeting: string;
  functions?: OpenMicFunction[];
}

// Raw API response from OpenMic service
interface OpenMicApiResponse {
  id?: string;
  bot_id?: string;
  uid?: string;
  name?: string;
  description?: string;
  personality?: string;
  system_prompt?: string;
  greeting?: string;
  functions?: any[];
  created_at?: string;
  updated_at?: string;
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
  private isConfigured: boolean;

  constructor() {
    this.baseUrl = process.env.OPENMIC_API_URL || "https://chat.openmic.ai/api";
    this.apiKey = process.env.OPENMIC_API_KEY || "";
    this.isConfigured = !!this.apiKey && this.apiKey !== "demo_key";
  }

  // Map OpenMic API response to our internal OpenMicBot interface
  private mapApiResponseToBot(apiResponse: OpenMicApiResponse, fallback?: Partial<OpenMicBot>): OpenMicBot {
    return {
      id: apiResponse.id || apiResponse.bot_id || apiResponse.uid || fallback?.id || `bot_${Date.now()}`,
      name: apiResponse.name || fallback?.name || "Unknown Bot",
      personality: apiResponse.personality 
        ? apiResponse.personality.split(',').map(p => p.trim()) 
        : fallback?.personality || [],
      greeting: apiResponse.system_prompt || apiResponse.greeting || fallback?.greeting || "",
      functions: apiResponse.functions || fallback?.functions || [],
    };
  }

  // Check if OpenMic integration is properly configured
  private checkConfiguration(): { configured: boolean; error?: string } {
    if (!this.isConfigured) {
      return {
        configured: false,
        error: "OpenMic API key not configured. Please set OPENMIC_API_KEY environment variable."
      };
    }
    return { configured: true };
  }

  async createBot(bot: Omit<OpenMicBot, "id">): Promise<OpenMicBot> {
    const configCheck = this.checkConfiguration();
    
    if (!configCheck.configured) {
      console.warn(`OpenMic integration not configured: ${configCheck.error}`);
      throw new Error(`OpenMic integration error: ${configCheck.error}`);
    }

    try {
      const botPayload = {
        name: bot.name,
        description: `Mental health triage bot: ${bot.name}`,
        personality: bot.personality.join(", "),
        system_prompt: bot.greeting,
        functions: [
          {
            name: "getPatientInfo",
            description: "Retrieve patient information by ID for mental health triage",
            parameters: {
              type: "object",
              properties: {
                patientId: {
                  type: "string",
                  description: "The patient's unique identifier"
                }
              },
              required: ["patientId"]
            }
          }
        ]
      };

      console.log("Creating OpenMic bot with payload:", JSON.stringify(botPayload, null, 2));
      
      const response = await fetch(`${this.baseUrl}/bots`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(botPayload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenMic API error response:", errorText);
        throw new Error(`OpenMic API error (${response.status}): ${response.statusText}`);
      }

      const apiResult: OpenMicApiResponse = await response.json();
      console.log("OpenMic bot created successfully:", apiResult);
      
      return this.mapApiResponseToBot(apiResult, bot);
    } catch (error) {
      console.error("Failed to create OpenMic bot:", error);
      throw new Error(`Failed to create OpenMic bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateBot(botId: string, updates: Partial<OpenMicBot>): Promise<OpenMicBot> {
    const configCheck = this.checkConfiguration();
    
    if (!configCheck.configured) {
      console.warn(`OpenMic integration not configured: ${configCheck.error}`);
      throw new Error(`OpenMic integration error: ${configCheck.error}`);
    }

    try {
      const updatePayload = {
        name: updates.name,
        personality: updates.personality?.join(", "),
        system_prompt: updates.greeting,
        functions: updates.functions,
      };

      const response = await fetch(`${this.baseUrl}/bots/${botId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenMic API update error:", errorText);
        throw new Error(`OpenMic API error (${response.status}): ${response.statusText}`);
      }

      const apiResult: OpenMicApiResponse = await response.json();
      console.log("OpenMic bot updated successfully:", apiResult);
      
      return this.mapApiResponseToBot(apiResult, { id: botId, ...updates });
    } catch (error) {
      console.error("Failed to update OpenMic bot:", error);
      throw new Error(`Failed to update OpenMic bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteBot(botId: string): Promise<void> {
    const configCheck = this.checkConfiguration();
    
    if (!configCheck.configured) {
      console.warn(`OpenMic integration not configured: ${configCheck.error}`);
      throw new Error(`OpenMic integration error: ${configCheck.error}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/bots/${botId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenMic API delete error:", errorText);
        throw new Error(`OpenMic API error (${response.status}): ${response.statusText}`);
      }
      
      console.log("OpenMic bot deleted successfully");
    } catch (error) {
      console.error("Failed to delete OpenMic bot:", error);
      throw new Error(`Failed to delete OpenMic bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBots(): Promise<OpenMicBot[]> {
    const configCheck = this.checkConfiguration();
    
    if (!configCheck.configured) {
      console.warn(`OpenMic integration not configured: ${configCheck.error}`);
      throw new Error(`OpenMic integration error: ${configCheck.error}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/bots`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenMic API list error:", errorText);
        throw new Error(`OpenMic API error (${response.status}): ${response.statusText}`);
      }

      const apiResults: OpenMicApiResponse[] = await response.json();
      console.log("OpenMic bots fetched successfully:", apiResults);
      
      return apiResults.map(apiBot => this.mapApiResponseToBot(apiBot));
    } catch (error) {
      console.error("Failed to fetch OpenMic bots:", error);
      throw new Error(`Failed to fetch OpenMic bots: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const openMicClient = new OpenMicClient();
