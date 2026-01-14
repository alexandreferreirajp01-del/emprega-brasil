import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Heart } from 'lucide-react';

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
            {/* LED Border Animation */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="relative w-full max-w-sm">
                <motion.div
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(10, 102, 194, 0.3)',
                      '0 0 40px rgba(10, 102, 194, 0.6)',
                      '0 0 20px rgba(10, 102, 194, 0.3)',
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl"
                />
              </div>
            </motion.div>

            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative border border-blue-200 dark:border-blue-900">
              {/* Animated Border LED */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-blue-400 border-r-blue-300"
                />
              </div>
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>

              {/* Content */}
              <div className="p-6 text-center relative z-10">
                {/* Logo */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mb-4"
                >
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/704fcb47f_file_000000001aec71f583d94b71860e2dbd.png"
                    alt="Emprega Brasil+"
                    className="w-14 h-14 mx-auto object-contain"
                  />
                </motion.div>

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

                {/* Heart Animation */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mb-6"
                >
                  <Heart className="w-8 h-8 text-red-500 mx-auto fill-red-500" />
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