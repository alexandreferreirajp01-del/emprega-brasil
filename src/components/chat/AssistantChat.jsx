import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bot, Send, Loader2, X, Sparkles, Paperclip, Image as ImageIcon, File, Crown, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from 'react-markdown';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AssistantChat({ user, isPremium, inline = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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
          content: '👋 Olá! Sou o assistente virtual do **Vagas Abertas Paraíba**.\n\nComo posso ajudar você hoje?\n\n💼 Posso te ajudar a:\n- Encontrar vagas de emprego\n- Informar sobre notícias\n- Tirar dúvidas sobre o app\n- Sugerir vagas por categoria ou cidade\n\nO que você procura?'
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

    let isFirstAssistantMessage = true;
    let typingTimeout = null;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      const newMessages = data.messages || [];
      
      const lastMsg = newMessages[newMessages.length - 1];
      const isNewAssistantMsg = lastMsg?.role === 'assistant' && 
                                 !messages.find(m => m.id === lastMsg.id);
      
      if (isNewAssistantMsg && isFirstAssistantMessage) {
        isFirstAssistantMessage = false;
        setIsTyping(true);
        
        if (typingTimeout) clearTimeout(typingTimeout);
        
        const randomDelay = Math.floor(Math.random() * 3000) + 2000;
        typingTimeout = setTimeout(() => {
          setIsTyping(false);
          setMessages(newMessages);
        }, randomDelay);
      } else {
        setIsTyping(false);
        setMessages(newMessages);
      }
    });

    return () => {
      unsubscribe();
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [conversationId, messages]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return { name: file.name, url: file_url, type: file.type };
      });

      const uploaded = await Promise.all(uploadPromises);
      setUploadedFiles([...uploadedFiles, ...uploaded]);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || !conversationId || loading) return;

    const userMessage = input.trim();
    const files = uploadedFiles.map(f => f.url);
    
    const userMsg = {
      role: 'user',
      content: userMessage || 'Arquivos anexados',
      file_urls: files.length > 0 ? files : undefined
    };
    setMessages(prev => [...prev, userMsg]);
    
    setInput('');
    setUploadedFiles([]);
    setLoading(true);

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage || 'Arquivos anexados',
        file_urls: files.length > 0 ? files : undefined
      });

      try {
        const currentUser = await base44.auth.me();
        await base44.entities.ChatHistory.create({
          conversation_id: conversationId,
          user_email: currentUser?.email || 'visitante',
          message_role: 'user',
          message_content: userMessage || 'Arquivos anexados',
          file_urls: files.length > 0 ? files : undefined
        });
      } catch (e) {
        // Ignorar erro de histórico
      }
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente em alguns segundos.'
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

  const handleButtonClick = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
    } else {
      setIsOpen(true);
    }
  };

  if (inline) {
    // Renderização inline para a Home
    return (
      <>
        <Card className="overflow-hidden border-2 border-[#0A66C2]/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#0A66C2] to-[#004182] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Assistente IA</CardTitle>
                  <p className="text-sm text-white/80">Tire suas dúvidas instantaneamente</p>
                </div>
              </div>
              {!isPremium && (
                <Badge className="bg-yellow-500 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  PRO
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Converse com nosso assistente inteligente para encontrar vagas, obter informações e tirar dúvidas sobre o app.
            </p>
            <Button 
              onClick={handleButtonClick}
              className="w-full bg-gradient-to-r from-[#0A66C2] to-[#004182] hover:opacity-90 text-white h-12"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isPremium ? 'Iniciar Conversa' : 'Desbloquear Assistente'}
            </Button>
          </CardContent>
        </Card>

        {/* Dialog de Chat */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
            <DialogHeader className="bg-gradient-to-r from-[#0A66C2] to-[#004182] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <DialogTitle>Assistente Virtual</DialogTitle>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <DialogDescription className="text-white/70 text-sm">Online agora</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900">
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#0A66C2] text-white rounded-br-sm' 
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm rounded-bl-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown 
                          className="prose prose-sm max-w-none dark:prose-invert"
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                            strong: ({ children }) => <strong className="font-semibold text-[#0A66C2] dark:text-blue-400">{children}</strong>,
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] dark:text-blue-400 underline">{children}</a>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {(loading || isTyping) && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#0A66C2] dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-[#0A66C2] dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-[#0A66C2] dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">digitando...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
              {messages.length <= 1 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(sug)}
                      className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1 flex items-center gap-1 text-xs">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="w-3 h-3 text-[#0A66C2]" />
                      ) : (
                        <File className="w-3 h-3 text-[#0A66C2]" />
                      )}
                      <span className="truncate max-w-[80px]">{file.name}</span>
                      <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || loading}
                  className="h-10 w-10 flex items-center justify-center border dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 rounded-full transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#0A66C2]" />
                  ) : (
                    <Paperclip className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  )}
                </button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite ou envie arquivo..."
                  className="flex-1 h-10 rounded-full text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && uploadedFiles.length === 0) || loading || !conversationId}
                  className="h-10 w-10 flex items-center justify-center bg-[#0A66C2] hover:bg-[#004182] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Upgrade */}
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">Recurso Premium</DialogTitle>
              <DialogDescription className="text-center text-base">
                O Assistente de IA é exclusivo para membros Premium
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  Com o Premium você tem:
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span>Assistente de IA 24/7 para tirar dúvidas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span>Busca inteligente de vagas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span>Acesso a vagas exclusivas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span>Ferramentas profissionais avançadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span>Suporte prioritário</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex flex-col gap-2">
                <Link to={createPageUrl('Subscription')}>
                  <Button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold h-12">
                    <Crown className="w-5 h-5 mr-2" />
                    Assinar Premium Agora
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full"
                >
                  Voltar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Botão discreto para outras páginas
  return (
    <>
      <button
        onClick={handleButtonClick}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-all text-sm"
        title={isPremium ? "Assistente IA" : "Assistente IA - Apenas Premium"}
      >
        <Sparkles className="w-4 h-4 text-[#0A66C2]" />
        <span className="text-slate-700 dark:text-slate-200">Assistente IA</span>
        {!isPremium && (
          <Badge className="bg-yellow-500 text-white text-xs ml-1">
            <Crown className="w-2.5 h-2.5 mr-0.5" />
            PRO
          </Badge>
        )}
      </button>

      {/* Modais compartilhados */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
          {/* ... mesmo conteúdo do dialog inline ... */}
        </DialogContent>
      </Dialog>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md">
          {/* ... mesmo conteúdo do modal de upgrade ... */}
        </DialogContent>
      </Dialog>
    </>
  );
}