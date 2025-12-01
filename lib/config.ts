// Configuration utilities

export const config = {
  realtimeApi: {
    sessionUrl:
      process.env.NEXT_PUBLIC_REALTIME_API_URL ||
      "https://apiceritain.indonesiacore.com/api/realtime/session",
    openaiUrl:
      process.env.NEXT_PUBLIC_OPENAI_REALTIME_URL ||
      "https://api.openai.com/v1/realtime",
  },
  defaults: {
    voice: (process.env.NEXT_PUBLIC_DEFAULT_VOICE as any) || "alloy",
    systemPrompt:
      process.env.NEXT_PUBLIC_SYSTEM_PROMPT ||
      "jadi seorang psikolog yang membantu menyelesaikan masalah user",
  },
} as const;
