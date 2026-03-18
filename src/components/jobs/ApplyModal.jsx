import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Mail, ExternalLink, Phone, Sparkles, ChevronRight, Copy, Check } from "lucide-react";

function formatPhone(num) {
  const d = num.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return num;
}

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isEmail(str) {
  return emailRegex.test(str?.trim());
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1 p-1.5 rounded-lg hover:bg-black/10 transition-colors flex-shrink-0"
      title="Copiar"
    >
      {copied
        ? <Check className="w-4 h-4 text-green-500" />
        : <Copy className="w-4 h-4 text-slate-400" />}
    </button>
  );
}

export default function ApplyModal({ job, contacts, open, onClose }) {
  if (!open || !job) return null;

  const whatsappMsg = encodeURIComponent(`Olá! Vi a vaga de ${job.title} e gostaria de me candidatar.`);
  const emailSubject = encodeURIComponent(`Candidatura - ${job.title}`);

  // Separar sites que são na verdade e-mails
  const sitesReal = contacts.sites.filter(s => !isEmail(s));
  const emailsFromSites = contacts.sites.filter(s => isEmail(s));
  const allEmails = [...contacts.emails, ...emailsFromSites];

  const totalContacts = contacts.whatsapps.length + contacts.phones.length + allEmails.length + sitesReal.length;

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

                {/* WhatsApp */}
                {contacts.whatsapps.map((num, i) => (
                  <motion.div
                    key={`wa-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-2xl transition-all group"
                  >
                    <a
                      href={`https://wa.me/55${num.replace(/\D/g,'')}?text=${whatsappMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      <div className="w-12 h-12 bg-[#25D366] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#25D366] font-semibold uppercase tracking-wide">WhatsApp</p>
                        <p className="text-slate-800 dark:text-white font-bold text-base">{formatPhone(num)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#25D366] group-hover:translate-x-1 transition-transform" />
                    </a>
                    <CopyButton value={num} />
                  </motion.div>
                ))}

                {/* Telefone */}
                {contacts.phones.map((num, i) => (
                  <motion.div
                    key={`tel-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (contacts.whatsapps.length + i) * 0.05 }}
                    className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl transition-all group"
                  >
                    <a
                      href={`tel:${num}`}
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Telefone</p>
                        <p className="text-slate-800 dark:text-white font-bold text-base">{formatPhone(num)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <CopyButton value={num} />
                  </motion.div>
                ))}

                {/* E-mails (incluindo os que vieram do campo sites) */}
                {allEmails.map((em, i) => (
                  <motion.div
                    key={`em-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (contacts.whatsapps.length + contacts.phones.length + i) * 0.05 }}
                    className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl transition-all group"
                  >
                    <a
                      href={`mailto:${em}?subject=${emailSubject}`}
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-purple-500 font-semibold uppercase tracking-wide">E-mail</p>
                        <p className="text-slate-800 dark:text-white font-medium text-sm truncate">{em}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <CopyButton value={em} />
                  </motion.div>
                ))}

                {/* Sites/Links reais */}
                {sitesReal.map((url, i) => {
                  const href = url.startsWith('http') ? url : `https://${url}`;
                  return (
                    <motion.div
                      key={`site-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (contacts.whatsapps.length + contacts.phones.length + allEmails.length + i) * 0.05 }}
                      className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl transition-all group"
                    >
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 flex-1 min-w-0"
                      >
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                          <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide">Link de Candidatura</p>
                          <p className="text-slate-800 dark:text-white font-medium text-sm truncate">{url}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
                      </a>
                      <CopyButton value={url} />
                    </motion.div>
                  );
                })}

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