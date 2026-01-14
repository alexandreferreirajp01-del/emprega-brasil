import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Heart, Sparkles } from 'lucide-react';

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
            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>

              {/* Content */}
              <div className="p-8 text-center">
                {/* Animated Icons */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="mb-6"
                >
                  <Sparkles className="w-16 h-16 text-yellow-400 mx-auto" />
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-slate-900 dark:text-white mb-3"
                >
                  Bem-vindo! 🎉
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-slate-700 dark:text-slate-300 mb-2"
                >
                  Emprega Brasil+
                </motion.p>

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4 my-6"
                >
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Você está entrando em um mundo de <span className="font-semibold text-[#0A66C2]">oportunidades</span> infinitas.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Que você encontre a vaga perfeita e tenha sucesso em sua jornada profissional.
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
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    onClick={handleClose}
                    className="w-full bg-gradient-to-r from-[#0A66C2] to-blue-600 hover:from-[#004182] hover:to-[#0A66C2] text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    Explorar Vagas ✨
                  </Button>
                </motion.div>

                {/* Footer Text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-xs text-slate-500 dark:text-slate-400 mt-4"
                >
                  Boa sorte em sua busca! 🚀
                </motion.p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}