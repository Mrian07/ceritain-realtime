'use client';

import { motion } from 'framer-motion';
import { Message } from '@/hooks/useChat';

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isAI = message.sender === 'ai';

  return (
    <motion.div
      initial={{ opacity: 0, x: isAI ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex w-full mb-4 ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[75%] rounded-xl px-4 py-3 shadow-sm ${isAI
            ? 'bg-[var(--ai-bubble-bg)] text-[var(--ai-bubble-text)]'
            : 'bg-[var(--user-bubble-bg)] text-[var(--user-bubble-text)]'
          }`}
        style={{
          wordBreak: 'break-word',
        }}
      >
        <p className="text-[15px] leading-relaxed tracking-normal">
          {message.text}
        </p>
        <p
          className={`text-xs mt-1.5 ${isAI ? 'opacity-60' : 'opacity-80'
            }`}
        >
          {message.timestamp.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}
