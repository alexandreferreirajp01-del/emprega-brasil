import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

function generateVisitorId() {
  let id = localStorage.getItem('vagas_visitor_id');
  if (!id) {
    id = 'visitor_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('vagas_visitor_id', id);
  }
  return id;
}

export default function UniversalChat() {
  const [user, setUser] = useState(null);
  const [visitorId, setVisitorId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Check auth and set user/visitor
  useEffect(() => {
    const init = async () => {
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
      
      if (visitorMode === 'true') {
        const vId = generateVisitorId();
        setVisitorId(vId);
        return;
      }
      
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        const vId = generateVisitorId();
        setVisitorId(vId);
      }
    };
    init();
  }, []);

  // Load messages when chat opens
  useEffect(() => {
    if (chatOpen) {
      loadChatHistory();
    }
  }, [chatOpen, user, visitorId]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Poll for new messages
  useEffect(() => {
    if (!chatOpen) return;
    
    const interval = setInterval(() => {
      loadChatHistory();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [chatOpen, user, visitorId]);

  const getSenderId = () => {
    return user?.email || visitorId;
  };

  const getSenderName = () => {
    if (user?.full_name) return user.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Visitante';
  };

  const getSenderType = () => {
    if (!user) return 'visitor';
    if (user.role === 'admin' || user.subscription_type === 'admin') return 'admin';
    if (user.subscription_type === 'recruiter') return 'recruiter';
    if (user.subscription_type === 'premium') return 'premium';
    return 'basic';
  };

  const loadChatHistory = async () => {
    const senderId = getSenderId();
    if (!senderId) return;
    
    setIsLoading(true);
    try {
      const messages = await base44.entities.SupportChat.filter(
        { sender_id: senderId },
        'created_date',
        100
      );
      
      // Also get admin responses for this sender
      const adminResponses = await base44.entities.SupportChat.filter(
        { sender_id: `admin_to_${senderId}` },
        'created_date',
        100
      );
      
      // Combine and sort
      const allMessages = [...messages, ...adminResponses].sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      );
      
      setChatMessages(allMessages);
    } catch (e) {
      console.log('Error loading chat:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const text = inputMessage.trim();
    if (!text || isSending) return;
    
    const senderId = getSenderId();
    if (!senderId) return;

    setIsSending(true);
    setInputMessage('');

    // Optimistic update
    const tempMessage = {
      id: 'temp_' + Date.now(),
      sender_id: senderId,
      sender_name: getSenderName(),
      sender_type: getSenderType(),
      message: text,
      is_from_admin: false,
      created_date: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, tempMessage]);

    try {
      await base44.entities.SupportChat.create({
        sender_id: senderId,
        sender_name: getSenderName(),
        sender_type: getSenderType(),
        message: text,
        is_from_admin: false,
        is_read: false,
      });
      
      // Reload to get real message
      await loadChatHistory();
    } catch (e) {
      console.error('Error sending:', e);
      // Remove temp message on error
      setChatMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setInputMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Button - Fixed Position */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-20 md:bottom-6 right-4 z-50 w-12 h-12 bg-[#0A66C2] hover:bg-[#004182] rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 relative"
        aria-label="Abrir chat de suporte"
        style={{ 
          borderRadius: '20px 20px 20px 4px',
        }}
      >
        {chatOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {chatOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-4 z-50 w-[calc(100%-2rem)] md:w-[380px] max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200" style={{ animation: 'slideUp 0.3s ease-out' }}>
          {/* Header */}
          <div className="bg-[#0A66C2] p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Suporte Vagas Abertas</h3>
                <p className="text-xs text-white/80">Tire suas dúvidas aqui</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-72 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {isLoading && chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-[#0A66C2]" />
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#0A66C2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-[#0A66C2]" />
                </div>
                <p className="text-slate-600 font-medium">Olá{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!</p>
                <p className="text-slate-500 text-sm mt-1">Como podemos ajudar você hoje?</p>
                <div className="mt-4 space-y-2">
                  <button 
                    onClick={() => setInputMessage('Como me candidatar a uma vaga?')}
                    className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-slate-600 hover:bg-[#0A66C2]/5 transition-colors border"
                  >
                    💼 Como me candidatar a uma vaga?
                  </button>
                  <button 
                    onClick={() => setInputMessage('Quais são os planos disponíveis?')}
                    className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-slate-600 hover:bg-[#0A66C2]/5 transition-colors border"
                  >
                    ⭐ Quais são os planos disponíveis?
                  </button>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isAdmin = msg.is_from_admin;
                return (
                  <div key={msg.id || idx} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      isAdmin 
                        ? 'bg-white text-slate-800 shadow-sm rounded-bl-md border' 
                        : 'bg-[#0A66C2] text-white rounded-br-md'
                    }`}>
                      {isAdmin && (
                        <p className="text-xs text-[#0A66C2] font-medium mb-1">Suporte</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-slate-400' : 'text-white/70'}`}>
                        {formatTime(msg.created_date)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-white">
            <div className="flex gap-2 items-end">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0A66C2] max-h-24 overflow-y-auto"
                style={{ minHeight: '42px' }}
              />
              <Button
                onClick={handleSend}
                disabled={isSending || !inputMessage.trim()}
                className="rounded-xl bg-[#0A66C2] hover:bg-[#004182] h-[42px] w-[42px] p-0 flex-shrink-0"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Respondemos o mais rápido possível
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}