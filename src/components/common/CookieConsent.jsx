import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('vagas_cookie_consent');
    if (!consent) {
      // Mostrar após 2 segundos
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('vagas_cookie_consent', 'accepted');
    setVisible(false);
  };

  const handleClose = () => {
    localStorage.setItem('vagas_cookie_consent', 'dismissed');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4">
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#0A66C2]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Cookie className="w-5 h-5 text-[#0A66C2]" />
              </div>
              <div className="flex-1 pr-4">
                <h3 className="font-semibold text-slate-800 text-sm mb-1">
                  Cookies e Privacidade
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Usamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa política.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAccept}
                    className="h-8 px-3 bg-[#0A66C2] hover:bg-[#004182] rounded-lg text-xs"
                  >
                    Aceitar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="h-8 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}