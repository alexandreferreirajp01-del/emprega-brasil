import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Mail, ExternalLink, Phone, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatPhone(num) {
  const d = num.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return num;
}

export default function ApplyModal({ job, contacts, open, onClose }) {
  if (!open || !job) return null;

  const whatsappMsg = encodeURIComponent(`Olá! Vi a vaga de ${job.title} e gostaria de me candidatar.`);
  const emailSubject = encodeURIComponent(`Candidatura - ${job.title}`);

  const totalContacts = contacts.whatsapps.length + contacts.phones.length + contacts.emails.length + contacts.sites.length;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center pointer-events-none"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden w-full sm:max-w-md pointer-events-auto">
              {/* Header gradient */}
              <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] px-6 pt-6 pb-8 relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Candidatura</p>
                    <h2 className="text-white font-bold text-lg leading-tight line-clamp-1">{job.title}</h2>
                  </div>
                </div>
                <p className="text-white/70 text-sm mt-2">
                  {totalContacts} {totalContacts === 1 ? 'opção disponível' : 'opções disponíveis'} para se candidatar
                </p>
              </div>

              {/* Contact options */}
              <div className="px-4 py-4 space-y-3 max-h-[60vh] overflow-y-auto pb-safe">

                {/* WhatsApp buttons */}
                {contacts.whatsapps.map((num, i) => (
                  <motion.a
                    key={`wa-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    href={`https://wa.me/55${num.replace(/\D/g,'')}?text=${whatsappMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-2xl transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-[#25D366] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#25D366] font-semibold uppercase tracking-wide">WhatsApp</p>
                      <p className="text-slate-800 dark:text-white font-bold text-base">{formatPhone(num)}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#25D366] group-hover:translate-x-1 transition-transform" />
                  </motion.a>
                ))}

                {/* Phone buttons */}
                {contacts.phones.map((num, i) => (
                  <motion.a
                    key={`tel-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (contacts.whatsapps.length + i) * 0.05 }}
                    href={`tel:${num}`}
                    className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Telefone</p>
                      <p className="text-slate-800 dark:text-white font-bold text-base">{formatPhone(num)}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </motion.a>
                ))}

                {/* Email buttons */}
                {contacts.emails.map((em, i) => (
                  <motion.a
                    key={`em-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (contacts.whatsapps.length + contacts.phones.length + i) * 0.05 }}
                    href={`mailto:${em}?subject=${emailSubject}`}
                    className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-purple-500 font-semibold uppercase tracking-wide">E-mail</p>
                      <p className="text-slate-800 dark:text-white font-medium text-sm truncate">{em}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </motion.a>
                ))}

                {/* Site/Link buttons */}
                {contacts.sites.map((url, i) => (
                  <motion.a
                    key={`site-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (contacts.whatsapps.length + contacts.phones.length + contacts.emails.length + i) * 0.05 }}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide">Link de Candidatura</p>
                      <p className="text-slate-800 dark:text-white font-medium text-sm truncate">{url}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
                  </motion.a>
                ))}

                {/* Nenhum contato */}
                {totalContacts === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm">Nenhuma informação de contato disponível.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 pb-6 pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-slate-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}