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

  // Connect to WebRTC
  const connect = useCallback(
    async (token: string) => {
      try {
        setStatus("connecting");
        setError(null);

        // Get user media with fallback
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        audioStreamRef.current = stream;

        // Setup audio context for visualization
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        monitorAudioLevel();

        // Create peer connection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        peerConnectionRef.current = pc;

        // Add audio track
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle incoming audio
        pc.ontrack = (event) => {
          const remoteAudio = new Audio();
          remoteAudio.srcObject = event.streams[0];
          remoteAudio.play().catch(console.error);
        };

        // Data channel for messages
        const dataChannel = pc.createDataChannel("oai-events");
        dataChannelRef.current = dataChannel;

        dataChannel.onopen = () => {
          console.log("Data channel opened");
          setStatus("connected");
        };

        dataChannel.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            // Handle different message types
            if (message.type === "transcript") {
              setTranscript(message.text || "");
            } else if (message.type === "response") {
              setAiResponse(message.text || "");
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

        // Send offer to OpenAI Realtime API
        const response = await fetch("https://api.openai.com/v1/realtime", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        });

        if (!response.ok) {
          throw new Error(`WebRTC connection failed: ${response.status}`);
        }

        const answerSdp = await response.text();
        await pc.setRemoteDescription({
          type: "answer",
          sdp: answerSdp,
        });
      } catch (err) {
        console.error("WebRTC connection error:", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Connection failed");
        disconnect();
      }
    },
    [monitorAudioLevel]
  );

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
