import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

// Ícone do WhatsApp
function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function FloatingButtons() {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
      if (visitorMode === 'true') {
        setIsVisitor(true);
        return;
      }
      
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setIsVisitor(true);
      }
    };
    checkAuth();
  }, []);

  const canUseChat = user && (user.subscription_type === 'basic' || user.subscription_type === 'premium' || user.subscription_type === 'admin' || user.role === 'admin');

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    const userMessage = message.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');
    setSending(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é o assistente virtual do Vagas Abertas Paraíba, uma plataforma de vagas de emprego na Paraíba.
        
Responda de forma breve, amigável e útil. Foque em ajudar com:
- Dúvidas sobre vagas de emprego
- Como usar a plataforma
- Informações sobre planos (básico gratuito e premium R$29,90 vitalício)
- Dicas de emprego

Mensagem do usuário: ${userMessage}`,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" }
          }
        }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.response || 'Desculpe, não consegui processar sua mensagem.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente ou entre em contato pelo WhatsApp.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Botão Chat */}
      {canUseChat && (
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="fixed bottom-24 md:bottom-6 right-20 z-50 w-14 h-14 bg-[#0056ff] hover:bg-[#0044cc] rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
          aria-label="Chat de suporte"
        >
          {chatOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
        </button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {chatOpen && canUseChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 md:bottom-24 right-4 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#0056ff] p-4 text-white">
              <h3 className="font-semibold">Suporte Vagas Abertas</h3>
              <p className="text-sm text-white/80">Como posso ajudar?</p>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Olá {user?.full_name?.split(' ')[0] || 'usuário'}!</p>
                  <p>Como posso ajudar você hoje?</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#0056ff] text-white rounded-br-sm' 
                      : 'bg-white text-slate-700 shadow-sm rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0056ff]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 rounded-full bg-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056ff]"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sending}
                  className="rounded-full bg-[#0056ff] hover:bg-[#0044cc] h-10 w-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}