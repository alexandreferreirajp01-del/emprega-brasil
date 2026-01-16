import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Send, Bot, Loader2, MessageSquare, 
  User, Sparkles, Shield, Code, Plus, Trash2, Upload, X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import ReactMarkdown from 'react-markdown';

const agents = [
  {
    id: 'assistente_dev',
    name: 'Assistente Dev',
    icon: Code,
    color: 'from-purple-500 to-indigo-600',
    description: 'Assistente de IA para auxiliar o desenvolvedor a fazer modificações no aplicativo Emprega Brasil+',
    bgColor: 'bg-gradient-to-br from-purple-50 to-indigo-50',
    textColor: 'text-purple-600'
  },
  {
    id: 'assistente_publico',
    name: 'Assistente Público',
    icon: MessageSquare,
    color: 'from-blue-500 to-cyan-600',
    description: 'Assistente virtual do Emprega Brasil+ com acesso em TEMPO REAL aos dados de vagas, notícias e todas as entidades',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    textColor: 'text-blue-600'
  },
  {
    id: 'validador_vagas',
    name: 'Validador de Vagas',
    icon: Shield,
    color: 'from-green-500 to-emerald-600',
    description: 'Agente de Validação Automática de Vagas - Garantir que todas as vagas tenham contato válido e informações corretas',
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
    textColor: 'text-green-600'
  }
];

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Só mostrar tool_calls se não tiver content (significa que ainda está processando)
  const isProcessing = message.tool_calls && message.tool_calls.length > 0 && !message.content;
  
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser && 'flex flex-col items-end'}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-2.5 ${
            isUser 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
          }`}>
            {isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown 
                className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  code: ({ inline, children }) => 
                    inline ? (
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs font-mono">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto my-2">
                        <code className="text-xs">{children}</code>
                      </pre>
                    )
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        
        {message.file_urls && message.file_urls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.file_urls.map((url, idx) => (
              <img key={idx} src={url} alt="Anexo" className="max-w-[200px] rounded-lg border" />
            ))}
          </div>
        )}
        
        {isProcessing && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Processando...</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              {message.tool_calls.slice(0, 3).map((tool, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  <span>{tool.name?.replace('entities.', '').replace('.', ' ') || 'Executando função'}</span>
                </div>
              ))}
              {message.tool_calls.length > 3 && (
                <div className="text-slate-400 pl-3">
                  +{message.tool_calls.length - 3} operações
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default function Agentes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isDono = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser.subscription_type === 'dono';
        const isAdmin = currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        
        if (!isDono && !isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      loadConversations();
    }
  }, [selectedAgent]);

  useEffect(() => {
    if (currentConversation) {
      const unsubscribe = base44.agents.subscribeToConversation(currentConversation.id, (data) => {
        setMessages(data.messages || []);
      });
      return () => unsubscribe();
    }
  }, [currentConversation]);

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const convs = await base44.agents.listConversations({ agent_name: selectedAgent });
      setConversations(convs || []);
      if (convs && convs.length > 0) {
        setCurrentConversation(convs[0]);
        setMessages(convs[0].messages || []);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: selectedAgent,
        metadata: {
          name: `Conversa ${new Date().toLocaleString('pt-BR')}`,
          description: 'Nova conversa'
        }
      });
      setConversations([conv, ...conversations]);
      setCurrentConversation(conv);
      setMessages([]);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      alert('Erro ao criar conversa');
    }
  };

  const deleteConversation = async (convId) => {
    if (!confirm('Deseja excluir esta conversa?')) return;
    try {
      await base44.agents.deleteConversation(convId);
      const newConvs = conversations.filter(c => c.id !== convId);
      setConversations(newConvs);
      if (currentConversation?.id === convId) {
        setCurrentConversation(newConvs[0] || null);
        setMessages(newConvs[0]?.messages || []);
      }
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      alert('Erro ao excluir conversa');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploadPromises = files.map(async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    });
    const urls = await Promise.all(uploadPromises);
    setUploadedFiles([...uploadedFiles, ...urls]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;
    if (!currentConversation) {
      await createNewConversation();
      return;
    }

    setSending(true);
    try {
      const messageData = {
        role: 'user',
        content: inputMessage.trim()
      };

      if (uploadedFiles.length > 0) {
        messageData.file_urls = uploadedFiles;
      }

      await base44.agents.addMessage(currentConversation, messageData);
      setInputMessage('');
      setUploadedFiles([]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] dark:from-slate-800 dark:to-slate-950 pt-6 pb-8 px-4 transition-colors">
        <div className="max-w-7xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Agentes de IA</h1>
          </div>
          <p className="text-white/70 text-sm">Gerencie agentes e conversas inteligentes</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!selectedAgent ? (
          // Lista de Agentes
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <Card 
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className="cursor-pointer hover:shadow-lg transition-all rounded-2xl overflow-hidden border-0"
                >
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {agent.description}
                    </p>
                    <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl">
                      Iniciar Chat
                      <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          // Interface de Chat
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-280px)]">
            {/* Sidebar - Lista de Conversas */}
            <Card className="rounded-2xl overflow-hidden border-0 lg:col-span-1">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
                <h3 className="font-bold text-white">Conversas</h3>
                <Button 
                  size="sm" 
                  onClick={createNewConversation}
                  className="bg-white/20 hover:bg-white/30 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="overflow-y-auto h-[calc(100%-60px)]">
                {loadingConversations ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-sm">
                    Nenhuma conversa ainda
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setCurrentConversation(conv);
                        setMessages(conv.messages || []);
                      }}
                      className={`p-4 border-b cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group ${
                        currentConversation?.id === conv.id ? 'bg-blue-50 dark:bg-slate-800' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 dark:text-white truncate">
                          {conv.metadata?.name || 'Conversa'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {new Date(conv.created_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Chat Area */}
            <Card className="rounded-2xl overflow-hidden border-0 lg:col-span-3 flex flex-col">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setSelectedAgent(null)}
                    className="text-white hover:bg-white/20 rounded-lg"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  {(() => {
                    const agent = agents.find(a => a.id === selectedAgent);
                    const Icon = agent?.icon;
                    return (
                      <>
                        {Icon && <Icon className="w-6 h-6 text-white" />}
                        <div>
                          <h3 className="font-bold text-white">{agent?.name}</h3>
                          <p className="text-xs text-white/70">Online</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                      Inicie uma conversa com o agente
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <MessageBubble key={idx} message={msg} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* File Preview */}
              {uploadedFiles.length > 0 && (
                <div className="p-3 border-t bg-white dark:bg-slate-800 flex gap-2 overflow-x-auto">
                  {uploadedFiles.map((url, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img src={url} alt="Anexo" className="w-20 h-20 object-cover rounded-lg" />
                      <button
                        onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t bg-white dark:bg-slate-800">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl flex-shrink-0"
                  >
                    <Upload className="w-5 h-5" />
                  </Button>
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 min-h-[48px] max-h-32 rounded-xl resize-none"
                    rows={1}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || (!inputMessage.trim() && uploadedFiles.length === 0)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl flex-shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}