import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, X, Send, Bot } from 'lucide-react';
import { safeStorage } from '../lib/safeStorage';

export default function AIAssistant({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'model'; text: string }[]>([
    { id: '1', role: 'model', text: 'مرحباً بك في سوق سند! أنا مساعدك الذكي. كيف يمكنني مساعدتك في العثور على ما تبحث عنه اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    const newUserMessage = { id: crypto.randomUUID(), role: 'user' as const, text: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      let apiUrl = '/api/chat';
      if (typeof window !== 'undefined') {
        const isApk = window.location.protocol === 'file:' || 
                      window.location.protocol.startsWith('capacitor') || 
                      window.location.protocol.startsWith('ionic') ||
                      !window.location.hostname;
        if (isApk) {
          const savedOrigin = safeStorage.getItem('sanad_last_web_origin');
          const fallbackUrl = 'https://ais-pre-rr564v6vaibnd4puzzxi64-453310219968.europe-west2.run.app';
          const baseUrl = savedOrigin || fallbackUrl;
          apiUrl = `${baseUrl.replace(/\/$/, '')}/api/chat`;
        }
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errText}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        const modelResponse = { id: crypto.randomUUID(), role: 'model' as const, text: data.text || data.error || 'عذراً، حدث خطأ تأكد من إعداد الخادم.' };
        setMessages(prev => [...prev, modelResponse]);
      } catch (e) {
        throw new Error('Received unexpected non-JSON response format.');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model' as const, text: 'حدث خطأ في الاتصال. يرجى التأكد من أن مفتاح API الخاص بـ Gemini تمت إضافته بشكل صحيح وأن الخادم يعمل.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-[350px] max-w-[calc(100vw-48px)] h-[500px] bg-[#050505] rounded-3xl border border-gray-800 shadow-2xl flex flex-col z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#10B981] p-[1px]">
             <div className="w-full h-full bg-[#020806] rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#D4AF37]" />
             </div>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">مساعد سند الذكي</h3>
            <p className="text-[#10B981] text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              متصل
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black rounded-tl-sm font-medium' 
                  : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tr-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-400 p-4 rounded-2xl rounded-tr-sm flex gap-2 border border-gray-700">
              <motion.div className="w-1.5 h-1.5 bg-gray-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
              <motion.div className="w-1.5 h-1.5 bg-gray-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
              <motion.div className="w-1.5 h-1.5 bg-gray-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-gray-900 border-t border-gray-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اسألني عن أي شيء..."
            className="w-full bg-[#020806] text-white border border-gray-700 rounded-full py-3 pr-4 pl-12 focus:outline-none focus:border-[#D4AF37] transition-colors text-sm"
            dir="rtl"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-[#D4AF37] text-black rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Send className="w-4 h-4 rtl:-scale-x-100" />
          </button>
        </div>
      </div>
    </div>
  );
}
