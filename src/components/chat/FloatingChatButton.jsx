import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, User as UserIcon, X, Sparkles, Paperclip, Image as ImageIcon, File } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from 'react-markdown';

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
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

    let isFirstAssistantMessage = true;
    let typingTimeout = null;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      const newMessages = data.messages || [];
      
      // Detecta se a última mensagem é nova e do assistente
      const lastMsg = newMessages[newMessages.length - 1];
      const isNewAssistantMsg = lastMsg?.role === 'assistant' && 
                                 !messages.find(m => m.id === lastMsg.id);
      
      if (isNewAssistantMsg && isFirstAssistantMessage) {
        // Simula digitação apenas para a primeira resposta
        isFirstAssistantMessage = false;
        setIsTyping(true);
        
        // Cancela timeout anterior se existir
        if (typingTimeout) clearTimeout(typingTimeout);
        
        const randomDelay = Math.floor(Math.random() * 3000) + 2000; // 2-5 segundos
        typingTimeout = setTimeout(() => {
          setIsTyping(false);
          setMessages(newMessages);
        }, randomDelay);
      } else {
        // Atualiza mensagens normalmente
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

      // Salvar no histórico
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
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-3 md:bottom-6 md:right-6 bg-gradient-to-r from-[#0A66C2] to-[#004182] text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50 flex items-center justify-center group"
          title="Assistente IA"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-[90vw] md:w-96 h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border dark:border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <h2 className="text-white font-semibold text-sm">Assistente Virtual</h2>
                <p className="text-white/70 text-xs">Online agora</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900">
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
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-[#0A66C2] dark:text-blue-400">{children}</strong>,
                          code: ({ children }) => <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">{children}</code>,
                          a: ({ href, children }) => (
                            <a 
                              href={href} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#0A66C2] dark:text-blue-400 underline hover:text-[#004182] dark:hover:text-blue-300 font-medium transition-colors"
                            >
                              {children}
                            </a>
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

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
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

            {/* Preview de arquivos */}
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
                disabled={(!input.trim() && uploadedFiles.length === 0) || loading}
                className="h-10 w-10 flex items-center justify-center bg-[#0A66C2] hover:bg-[#004182] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}