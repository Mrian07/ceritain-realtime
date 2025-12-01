'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { Mic, ArrowUp } from 'lucide-react';

interface InputBarProps {
  onSendMessage: (text: string) => void;
}

export function InputBar({ onSendMessage }: InputBarProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    // Placeholder untuk voice recording functionality
    if (!isRecording) {
      console.log('Start recording voice note...');
      // TODO: Implement voice recording
    } else {
      console.log('Stop recording voice note...');
      // TODO: Stop recording and send
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto rounded-2xl shadow-lg border"
        style={{
          backgroundColor: 'var(--input-bg)',
          borderColor: 'var(--input-border)',
        }}
      >
        <div className="flex items-end gap-2 px-4 py-3">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={handleMicClick}
            className={`p-2 rounded-full transition-all flex-shrink-0 ${isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400'
              }`}
            aria-label="Voice note"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Textarea Field */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan Anda..."
            rows={1}
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:opacity-50 resize-none max-h-[200px] overflow-y-auto py-2"
            style={{
              minHeight: '24px',
            }}
          />

          {/* Send Button - Only show when there's text */}
          {inputText.trim() && (
            <button
              type="submit"
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-sm hover:shadow-md flex-shrink-0"
              aria-label="Send message"
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
