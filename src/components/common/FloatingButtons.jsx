import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { base44 } from '@/api/base44Client';

export default function FloatingButtons() {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [hideChat, setHideChat] = useState(false);
  const messagesEndRef = useRef(null);

  // Esconder chat em páginas específicas
  useEffect(() => {
    const checkPage = () => {
      const path = window.location.pathname;
      const isResumePage = path.includes('ProfessionalResume');
      setHideChat(isResumePage);
    };
    
    checkPage();
    window.addEventListener('popstate', checkPage);
    
    // Observer para mudanças de URL (SPA)
    const observer = new MutationObserver(checkPage);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      window.removeEventListener('popstate', checkPage);
      observer.disconnect();
    };
  }, []);

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
        // Carregar mensagens anteriores
        loadMessages(currentUser.email);
      } catch (e) {
        setIsVisitor(true);
      }
    };
    checkAuth();
  }, []);

  const loadMessages = async (email) => {
    try {
      const chatMessages = await base44.entities.ChatMessage.filter(
        { user_email: email },
        'created_date',
        50
      );
      if (chatMessages && chatMessages.length > 0) {
        setMessages(chatMessages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.message
        })));
      }
    } catch (e) {
      console.log('Sem histórico de chat');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const canUseChat = user && (user.subscription_type === 'basic' || user.subscription_type === 'premium' || user.subscription_type === 'admin' || user.role === 'admin');

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    const userMessage = message.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');
    setSending(true);

    try {
      // Salvar mensagem do usuário
      await base44.entities.ChatMessage.create({
        user_email: user.email,
        user_name: user.full_name || user.email,
        message: userMessage,
        sender: 'user',
        conversation_id: user.email
      });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é o assistente virtual do Vagas Abertas Paraíba, uma plataforma de vagas de emprego na Paraíba.
        
Responda de forma breve, amigável e útil. Foque em ajudar com:
- Como enviar currículo: Acesse a vaga desejada e clique em "Candidatar-se" para ver as opções de contato
- Como melhorar perfil: Adicione foto, telefone e mantenha seu nome atualizado no Perfil
- Como usar filtros: Na página de Vagas, use os filtros de cidade, tipo e função para encontrar vagas
- Como falar com suporte: WhatsApp (83) 99197-1320
- Como favoritar vagas: Clique no coração nas vagas para salvar
- Como ver histórico: Acesse Perfil > Histórico para ver vagas visualizadas
- Planos: Básico (gratuito) e Premium (R$29,90 vitalício com acesso a vagas exclusivas)

Nome do usuário: ${user?.full_name || 'Usuário'}
Mensagem: ${userMessage}`
      });

      const botResponse = (typeof response === 'string' ? response : response?.response) || 'Olá! Como posso ajudar você hoje? Para dúvidas sobre vagas ou planos, estou à disposição. Você também pode entrar em contato via WhatsApp: (83) 99197-1320.';
      setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);

      // Salvar resposta do bot
      await base44.entities.ChatMessage.create({
        user_email: user.email,
        user_name: 'Assistente',
        message: botResponse,
        sender: 'bot',
        conversation_id: user.email
      });

    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente ou entre em contato pelo WhatsApp.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Botão Chat */}
      {canUseChat && !hideChat && (
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="fixed bottom-20 md:bottom-6 right-4 z-40 w-14 h-14 bg-[#0056ff] hover:bg-[#0044cc] rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
          aria-label="Chat de suporte"
        >
          {chatOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
        </button>
      )}

      {/* Chat Window */}
      {chatOpen && canUseChat && !hideChat && (
        <div className="fixed bottom-36 md:bottom-24 right-4 z-40 w-[calc(100%-2rem)] md:w-96 max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
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
              <div ref={messagesEndRef} />
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
          </div>
        )}
    </>
  );
}