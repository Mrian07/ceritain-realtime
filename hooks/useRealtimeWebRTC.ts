import { useState, useEffect, useRef, useCallback } from "react";

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface RealtimeWebRTCState {
  status: ConnectionStatus;
  error: string | null;
  transcript: string;
  aiResponse: string;
  isMuted: boolean;
  audioLevel: number;
}

export interface RealtimeWebRTCActions {
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
}

export function useRealtimeWebRTC(): [
  RealtimeWebRTCState,
  RealtimeWebRTCActions
] {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Monitor audio level
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const checkLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);

      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop audio stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setStatus("disconnected");
  }, []);

  // Connect to WebRTC
  const connect = useCallback(
    async (token: string) => {
      try {
        setStatus("connecting");
        setError(null);

        // Create peer connection
        const pc = new RTCPeerConnection();
        peerConnectionRef.current = pc;

        // Handle incoming audio from model
        pc.ontrack = (event) => {
          const [stream] = event.streams;
          const remoteAudio = new Audio();
          remoteAudio.srcObject = stream;
          remoteAudio.autoplay = true;
          remoteAudio.play().catch(console.error);
        };

        // Get user media and add to peer connection
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStreamRef.current = stream;

        // Add mic tracks to peer connection
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }

        // Ensure we can receive audio from the model
        pc.addTransceiver("audio", { direction: "recvonly" });

        // Setup audio context for visualization
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        monitorAudioLevel();

        // Data channel for Realtime events
        const dataChannel = pc.createDataChannel("oai-events");
        dataChannelRef.current = dataChannel;

        dataChannel.onopen = () => {
          console.log("Data channel opened");
          setStatus("connected");
        };

        dataChannel.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("Received event:", message.type, message);

            // Handle different message types
            if (message.type === "response.audio_transcript.done") {
              setTranscript(message.transcript || "");
            } else if (message.type === "response.done") {
              const text =
                message.response?.output?.[0]?.content?.[0]?.transcript;
              if (text) setAiResponse(text);
            }
          } catch (err) {
            console.error("Failed to parse data channel message:", err);
          }
        };

        dataChannel.onerror = (err) => {
          console.error("Data channel error:", err);
          setError("Data channel error occurred");
        };

        // Create and set local description
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send SDP offer to OpenAI Realtime WebRTC endpoint
        console.log("Using token:", token.substring(0, 20) + "...");
        const model = "gpt-realtime-mini-2025-10-06";
        const sdpResp = await fetch(
          `https://api.openai.com/v1/realtime?model=${encodeURIComponent(
            model
          )}`,
          {
            method: "POST",
            body: offer.sdp,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/sdp",
              "OpenAI-Beta": "realtime=v1",
            },
          }
        );

        if (!sdpResp.ok) {
          const t = await sdpResp.text();
          console.error("SDP Response Error:", t);
          throw new Error(`SDP failed: ${sdpResp.status} ${t}`);
        }

        const answerSDP = await sdpResp.text();
        console.log("Received SDP answer:", answerSDP.substring(0, 200));

        await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });
        console.log("Remote description set successfully");
      } catch (err) {
        console.error("WebRTC connection error:", err);
        const errorObj = err as unknown;
        // console.error("Error details:", {
        //   name: errorObj?.name,
        //   message: errorObj?.message,
        //   stack: errorObj?.stack,
        // });
        setStatus("error");
        setError(
          err instanceof Error
            ? err.message
            : `Connection failed: ${JSON.stringify(err)}`
        );
        disconnect();
      }
    },
    [disconnect, monitorAudioLevel]
  );

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (audioStreamRef.current) {
      const audioTrack = audioStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Set muted state
  const setMutedState = useCallback((muted: boolean) => {
    if (audioStreamRef.current) {
      const audioTrack = audioStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !muted;
        setIsMuted(muted);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return [
    {
      status,
      error,
      transcript,
      aiResponse,
      isMuted,
      audioLevel,
    },
    {
      connect,
      disconnect,
      toggleMute,
      setMuted: setMutedState,
    },
  ];
}
