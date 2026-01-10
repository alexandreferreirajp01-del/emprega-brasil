import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, User as UserIcon, X, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from 'react-markdown';

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // Visitante pode usar
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isOpen || conversationId) return;
    
    const initConversation = async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: 'assistente_publico',
          metadata: {
            name: 'Chat com Assistente',
            user_email: user?.email || 'visitante'
          }
        });
        setConversationId(conv.id);
        
        setMessages([{
          role: 'assistant',
          content: '👋 Olá! Sou o assistente virtual do **Emprega Brasil+**.\n\nComo posso ajudar você hoje?\n\n💼 Posso te ajudar a:\n- Encontrar vagas de emprego\n- Informar sobre notícias\n- Tirar dúvidas sobre o app\n- Sugerir vagas por categoria ou cidade\n\nO que você procura?'
        }]);
      } catch (e) {
        console.error('Erro ao criar conversa:', e);
      }
    };
    
    initConversation();
  }, [isOpen, user, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    '💼 Tem vagas de auxiliar de cozinha?',
    '🏢 Vagas em João Pessoa',
    '💻 Vagas de TI',
    '📰 Últimas notícias',
    '❓ Como funciona o Premium?'
  ];

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#0A66C2] to-[#004182] hover:from-[#004182] hover:to-[#0A66C2] shadow-lg z-50 transition-all hover:scale-110"
      >
        <Bot className="w-6 h-6 text-white" />
      </Button>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl h-[600px] p-0 gap-0 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] dark:from-slate-800 dark:to-slate-950 p-4 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Assistente Virtual</h2>
                <p className="text-white/70 text-xs">Emprega Brasil+</p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              IA
            </Badge>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-[#0A66C2] dark:bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-[#0A66C2] text-white' 
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-[#0A66C2] dark:text-blue-400">{children}</strong>,
                          code: ({ children }) => <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">{children}</code>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <UserIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-[#0A66C2] dark:bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0A66C2] dark:text-blue-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700 rounded-b-lg">
            {messages.length <= 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestions.map((sug, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(sug)}
                    className="text-xs rounded-full dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    {sug}
                  </Button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta..."
                className="flex-1 h-12 rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                disabled={loading}
              />
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="h-12 px-6 bg-[#0A66C2] hover:bg-[#004182] dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}