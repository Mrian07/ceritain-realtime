// Testing utilities for Realtime API

/**
 * Test if the Realtime API is accessible and returns valid token
 */
export async function testRealtimeAPI(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
  latency?: number;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_REALTIME_API_URL ||
        "https://apiceritain.indonesiacore.com/api/realtime/session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "test connection",
          voice: "alloy",
        }),
      }
    );

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        latency,
      };
    }

    const data = await response.json();

    // Check for API error
    if (data.errorCode !== 0) {
      return {
        success: false,
        error: `API Error: ${data.message}`,
        latency,
      };
    }

    if (!data.result?.client_secret?.value) {
      return {
        success: false,
        error: "Invalid response: missing result.client_secret.value",
        latency,
      };
    }

    return {
      success: true,
      token: data.result.client_secret.value,
      latency,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      latency: Date.now() - startTime,
    };
  }
}

/**
 * Check if browser supports WebRTC
 */
export function checkWebRTCSupport(): {
  supported: boolean;
  features: {
    getUserMedia: boolean;
    RTCPeerConnection: boolean;
    RTCDataChannel: boolean;
  };
  issues: string[];
} {
  const issues: string[] = [];

  const getUserMedia = !!(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );

  if (!getUserMedia) {
    issues.push("getUserMedia not supported");
  }

  const RTCPeerConnection = !!(
    window.RTCPeerConnection ||
    (window as unknown as { webkitRTCPeerConnection?: unknown })
      .webkitRTCPeerConnection
  );

  if (!RTCPeerConnection) {
    issues.push("RTCPeerConnection not supported");
  }

  const RTCDataChannel = RTCPeerConnection;

  const supported = getUserMedia && RTCPeerConnection;

  return {
    supported,
    features: {
      getUserMedia,
      RTCPeerConnection,
      RTCDataChannel,
    },
    issues,
  };
}

/**
 * Check microphone permission status
 */
export async function checkMicrophonePermission(): Promise<{
  status: "granted" | "denied" | "prompt" | "unknown";
  error?: string;
}> {
  try {
    if (!navigator.permissions) {
      return { status: "unknown", error: "Permissions API not supported" };
    }

    const result = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });

    return { status: result.state as "granted" | "denied" | "prompt" };
  } catch (error) {
    return {
      status: "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Test microphone access
 */
export async function testMicrophone(): Promise<{
  success: boolean;
  error?: string;
  deviceLabel?: string;
}> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const audioTrack = stream.getAudioTracks()[0];
    const deviceLabel = audioTrack.label;

    // Stop the stream immediately
    stream.getTracks().forEach((track) => track.stop());

    return {
      success: true,
      deviceLabel,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get available audio devices
 */
export async function getAudioDevices(): Promise<{
  microphones: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
  error?: string;
}> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    const microphones = devices.filter((d) => d.kind === "audioinput");
    const speakers = devices.filter((d) => d.kind === "audiooutput");

    return { microphones, speakers };
  } catch (error) {
    return {
      microphones: [],
      speakers: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Run all diagnostic tests
 */
export async function runDiagnostics() {
  console.group("🔍 Realtime Call Diagnostics");

  // 1. WebRTC Support
  console.log("1️⃣ Checking WebRTC support...");
  const webrtcSupport = checkWebRTCSupport();
  console.log(
    webrtcSupport.supported ? "✅" : "❌",
    "WebRTC Support:",
    webrtcSupport
  );

  // 2. Microphone Permission
  console.log("\n2️⃣ Checking microphone permission...");
  const micPermission = await checkMicrophonePermission();
  console.log("🎤 Microphone Permission:", micPermission);

  // 3. Audio Devices
  console.log("\n3️⃣ Checking audio devices...");
  const devices = await getAudioDevices();
  console.log("🔊 Microphones:", devices.microphones.length);
  console.log("🔉 Speakers:", devices.speakers.length);

  // 4. API Connection
  console.log("\n4️⃣ Testing API connection...");
  const apiTest = await testRealtimeAPI();
  console.log(apiTest.success ? "✅" : "❌", "API Test:", apiTest);

  console.groupEnd();

  return {
    webrtcSupport,
    micPermission,
    devices,
    apiTest,
  };
}
