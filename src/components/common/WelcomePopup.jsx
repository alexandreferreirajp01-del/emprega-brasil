import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Verificar se veio do link especial e se é primeira vez
    const isFromSpecialLink = window.location.origin === 'https://empregabrasil.site' && 
                             window.location.pathname === '/home';
    const hasSeenWelcome = localStorage.getItem('welcome_popup_shown');

    if (isFromSpecialLink && !hasSeenWelcome) {
      // Delay pequeno para melhor efeito
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('welcome_popup_shown', 'true');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative">
              {/* LED Border Animation - Corre pela borda */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl" style={{ filter: 'drop-shadow(0 0 8px rgba(10, 102, 194, 0.6))' }}>
                <defs>
                  <linearGradient id="ledGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0A66C2" stopOpacity="1" />
                    <stop offset="50%" stopColor="#378FE9" stopOpacity="1" />
                    <stop offset="100%" stopColor="#0A66C2" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <motion.rect
                  x="8"
                  y="8"
                  width="calc(100% - 16px)"
                  height="calc(100% - 16px)"
                  rx="12"
                  fill="none"
                  stroke="url(#ledGradient)"
                  strokeWidth="2"
                  strokeDasharray="300"
                  animate={{
                    strokeDashoffset: [300, -300]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </svg>
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>

              {/* Content */}
              <div className="p-6 text-center relative z-10">

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-slate-900 dark:text-white mb-2"
                >
                  Bem-vindo! 🎉
                </motion.h2>

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3 my-4"
                >
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Bem-vindo ao Emprega Brasil+
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Sua jornada para encontrar a vaga perfeita começa aqui. Boa sorte! 🚀
                  </p>
                </motion.div>



                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    onClick={handleClose}
                    className="w-full bg-gradient-to-r from-[#0A66C2] to-blue-600 hover:from-[#004182] hover:to-[#0A66C2] text-white font-semibold py-2 rounded-lg transition-all shadow-lg hover:shadow-xl text-sm"
                  >
                    Começar Agora
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}