import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

interface ToastProps {
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key="toast-container"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
          dir="rtl"
        >
          <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
             toast.type === 'success' ? 'bg-[#10B981]/90 border-[#10B981]/20 text-white' :
             toast.type === 'error' ? 'bg-red-500/90 border-red-500/20 text-white' :
             toast.type === 'warning' ? 'bg-yellow-500/90 border-yellow-500/20 text-white' :
             'bg-gray-800/90 border-gray-700 text-white'
          }`}>
             {toast.type === 'success' && <CheckCircle className="w-6 h-6 shrink-0" />}
             {toast.type === 'error' && <XCircle className="w-6 h-6 shrink-0" />}
             {toast.type === 'warning' && <AlertCircle className="w-6 h-6 shrink-0" />}
             {toast.type === 'info' && <Info className="w-6 h-6 shrink-0" />}
             
             <p className="font-bold flex-1 text-sm">{toast.message}</p>
             
             <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0">
               <XCircle className="w-5 h-5" />
             </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
