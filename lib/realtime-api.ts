// Realtime API utilities

export interface RealtimeSessionResponse {
  errorCode: number;
  message: string;
  result: {
    object: string;
    id: string;
    model: string;
    modalities: string[];
    instructions: string;
    voice: string;
    output_audio_format: string;
    tools: any[];
    tool_choice: string;
    temperature: number;
    max_response_output_tokens: string;
    turn_detection: {
      type: string;
      threshold: number;
      prefix_padding_ms: number;
      silence_duration_ms: number;
      idle_timeout_ms: number | null;
      create_response: boolean;
      interrupt_response: boolean;
    };
    speed: number;
    tracing: any;
    truncation: string;
    prompt: any;
    expires_at: number;
    input_audio_noise_reduction: any;
    input_audio_format: string;
    input_audio_transcription: any;
    client_secret: {
      value: string;
      expires_at: number;
    };
    include: any;
  };
}

export interface RealtimeSessionPayload {
  prompt: string;
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}

/**
 * Create a new realtime session with the API
 */
export async function createRealtimeSession(
  payload: RealtimeSessionPayload
): Promise<string> {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_REALTIME_API_URL ||
        "https://apiceritain.indonesiacore.com/api/realtime/session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data: RealtimeSessionResponse = await response.json();

    console.log("Session created:", {
      sessionId: data.result?.id,
      expiresAt: data.result?.client_secret?.expires_at,
    });

    // Check for API error
    if (data.errorCode !== 0) {
      throw new Error(`API Error: ${data.message}`);
    }

    // Extract client_secret from result
    if (!data.result?.client_secret?.value) {
      throw new Error("Invalid response: missing result.client_secret.value");
    }

    return data.result.client_secret.value;
  } catch (error) {
    console.error("Failed to create realtime session:", error);
    throw error;
  }
}
