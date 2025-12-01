"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useRealtimeWebRTC } from "@/hooks/useRealtimeWebRTC";
import { createRealtimeSession } from "@/lib/realtime-api";

interface CallPageProps {
  onEndCall: () => void;
  contactName?: string;
  contactAvatar?: string;
}

export function CallPage({
  onEndCall,
  contactName = "Psikolog AI",
  contactAvatar,
}: CallPageProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showError, setShowError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const [webrtcState, webrtcActions] = useRealtimeWebRTC();

  // Initialize session and connect
  useEffect(() => {
    let mounted = true;

    const initializeCall = async () => {
      try {
        // Create session and get token
        const token = await createRealtimeSession({
          prompt:
            "jadi seorang psikolog yang membantu menyelesaikan masalah user",
          voice: "alloy",
        });

        if (!mounted) return;

        // Connect WebRTC with token
        await webrtcActions.connect(token);
      } catch (error) {
        console.error("Failed to initialize call:", error);
        if (mounted) {
          setShowError(true);
        }
      }
    };

    initializeCall();

    return () => {
      mounted = false;
      webrtcActions.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Call duration timer
  useEffect(() => {
    if (webrtcState.status === "connected") {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [webrtcState.status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    webrtcActions.disconnect();
    onEndCall();
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setShowError(false);

    try {
      const token = await createRealtimeSession({
        prompt:
          "jadi seorang psikolog yang membantu menyelesaikan masalah user",
        voice: "alloy",
      });

      await webrtcActions.connect(token);
    } catch (error) {
      console.error("Retry failed:", error);
      setShowError(true);
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusText = () => {
    switch (webrtcState.status) {
      case "connecting":
        return "Menghubungkan...";
      case "connected":
        return webrtcState.isMuted
          ? "Terhubung • Mic Mati"
          : "Terhubung • Mic Aktif";
      case "error":
        return "Koneksi Gagal";
      case "disconnected":
        return "Terputus";
      default:
        return "Memulai...";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50"
      style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
      }}
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_50%)]" />
      </div>

      {/* Main Content */}
      <div className="relative h-full flex flex-col items-center justify-between py-16 px-8">
        {/* Top Section - Avatar & Status */}
        <div className="flex flex-col items-center gap-8 mt-16">
          {/* Avatar with pulse animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl ring-4 ring-white/10">
              <span className="text-white text-5xl font-bold">
                {contactAvatar || "AI"}
              </span>
            </div>

            {/* Pulse rings for connecting state */}
            {(webrtcState.status === "connecting" ||
              webrtcState.status === "idle") && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-blue-400/30"
                  animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-blue-400/30"
                  animate={{ scale: [1, 1.6, 1.6], opacity: [0.6, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
              </>
            )}

            {/* Active indicator for connected state */}
            {webrtcState.status === "connected" && (
              <motion.div
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.div>

          {/* Contact Name & Status */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-4xl font-semibold text-white mb-3 tracking-tight">
              {contactName}
            </h1>
            <AnimatePresence mode="wait">
              <motion.p
                key={webrtcState.status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg text-white/70"
              >
                {getStatusText()}
              </motion.p>
            </AnimatePresence>

            {webrtcState.status === "connected" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg text-white/50 font-mono mt-1"
              >
                {formatDuration(callDuration)}
              </motion.p>
            )}

            {/* Transcript Display */}
            {webrtcState.transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 max-w-md px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl"
              >
                <p className="text-sm text-white/60 mb-1">Anda:</p>
                <p className="text-white">{webrtcState.transcript}</p>
              </motion.div>
            )}

            {/* AI Response Display */}
            {webrtcState.aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 max-w-md px-6 py-3 bg-blue-500/20 backdrop-blur-md rounded-2xl border border-blue-400/30"
              >
                <p className="text-sm text-blue-300 mb-1">Psikolog AI:</p>
                <p className="text-white">{webrtcState.aiResponse}</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Bottom Section - Controls */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md mb-12"
        >
          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-8 mb-12">
            {/* Mute Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={webrtcActions.toggleMute}
              disabled={webrtcState.status !== "connected"}
              className={`w-14 h-14 rounded-full transition-all shadow-lg ${
                webrtcState.isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/10 hover:bg-white/20 backdrop-blur-md"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={webrtcState.isMuted ? "Unmute" : "Mute"}
            >
              {webrtcState.isMuted ? (
                <MicOff className="w-6 h-6 text-white mx-auto" />
              ) : (
                <Mic className="w-6 h-6 text-white mx-auto" />
              )}
            </motion.button>

            {/* Speaker Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-14 h-14 rounded-full transition-all shadow-lg ${
                !isSpeakerOn
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/10 hover:bg-white/20 backdrop-blur-md"
              }`}
              aria-label={isSpeakerOn ? "Turn off speaker" : "Turn on speaker"}
            >
              {isSpeakerOn ? (
                <Volume2 className="w-6 h-6 text-white mx-auto" />
              ) : (
                <VolumeX className="w-6 h-6 text-white mx-auto" />
              )}
            </motion.button>
          </div>

          {/* End Call Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEndCall}
            className="w-full py-4 rounded-full bg-red-500 hover:bg-red-600 transition-all shadow-2xl flex items-center justify-center gap-3"
            aria-label="End call"
          >
            <PhoneOff className="w-6 h-6 text-white" />
            <span className="text-white font-semibold text-lg">
              Akhiri Panggilan
            </span>
          </motion.button>
        </motion.div>
      </div>

      {/* Audio wave visualization (based on actual audio level) */}
      {webrtcState.status === "connected" && !webrtcState.isMuted && (
        <div className="absolute bottom-64 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {[...Array(7)].map((_, i) => {
            const baseHeight = 8;
            const maxHeight = 32;
            const height =
              baseHeight + webrtcState.audioLevel * (maxHeight - baseHeight);

            return (
              <motion.div
                key={i}
                className="w-1.5 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full shadow-lg"
                animate={{
                  height: [height * 0.5, height, height * 0.5],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Error Modal */}
      <AnimatePresence>
        {(showError || webrtcState.error) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-500/20"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Koneksi Gagal
                </h3>
              </div>

              <p className="text-white/70 mb-6">
                {webrtcState.error ||
                  "Tidak dapat terhubung ke server. Silakan coba lagi."}
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                      <span className="text-white font-medium">Mencoba...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 text-white" />
                      <span className="text-white font-medium">Coba Lagi</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEndCall}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                >
                  <span className="text-white font-medium">Tutup</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
