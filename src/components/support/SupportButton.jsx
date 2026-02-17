import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function SupportButton({ user, inline = false, discrete = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const adminEmail = 'alexandreferreirajp01@gmail.com';
  
  // Criar conversa_id
  const conversaId = user ? [user.email, adminEmail].sort().join('_') : null;

  // Buscar mensagens da conversa
  const { data: messages = [], refetch } = useQuery({
    queryKey: ['support-chat', conversaId],
    queryFn: async () => {
      if (!conversaId) return [];
      const msgs = await base44.entities.MensagemDireta.filter(
        { conversa_id: conversaId },
        'created_date'
      );
      return msgs;
    },
    enabled: !!conversaId,
    refetchInterval: isOpen ? 2000 : 10000,
  });

  // Scroll para o final ao abrir ou receber mensagens
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const response = await base44.functions.invoke('sendMessage', {
        destinatario_email: adminEmail,
        conteudo: content,
        message_type: 'support'
      });
      return response.data;
    },
    onSuccess: () => {
      setMessage('');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['support-chat'] });
        queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
        refetch();
      }, 500);
    },
    onError: (error) => {
      console.error('Erro na mutation:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    }
  });

  const handleSend = async () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Permitir acesso mesmo sem usuário autenticado
  if (!user) {
    // Versão para usuários não autenticados
    return (
      <>
        {inline && (
          <Card className="overflow-hidden">
            <CardContent className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Precisa de Ajuda?</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Fale diretamente com nossa equipe</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                Faça login para enviar mensagens ao suporte.
              </p>
              <Button 
                onClick={() => window.location.href = '/splash'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        )}
        {discrete && (
          <button
            onClick={() => window.location.href = '/splash'}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Suporte - Faça login"
          >
            Suporte
          </button>
        )}
      </>
    );
  }

  // Versão inline para Home
  if (inline) {
    return (
      <>
        <Card className="overflow-hidden">
          <CardContent className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Precisa de Ajuda?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Fale diretamente com nossa equipe</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              Envie uma mensagem para nossos administradores e receba suporte personalizado.
            </p>
            <Button 
              onClick={() => setIsOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Abrir Chat
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-lg h-[600px] flex flex-col p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat com Suporte
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                    <p className="text-xs">Envie uma mensagem para iniciar</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isFromMe = msg.remetente_email === user?.email;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isFromMe
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.conteudo}</p>
                          <p className={`text-[10px] mt-1 ${isFromMe ? 'text-blue-100' : 'text-slate-500'}`}>
                            {new Date(msg.created_date).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending || !message.trim()}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Versão discreta para outras páginas
  if (discrete) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          title="Suporte"
        >
          Suporte
        </button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-lg h-[600px] flex flex-col p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat com Suporte
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                    <p className="text-xs">Envie uma mensagem para iniciar</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isFromMe = msg.remetente_email === user?.email;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isFromMe
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.conteudo}</p>
                          <p className={`text-[10px] mt-1 ${isFromMe ? 'text-blue-100' : 'text-slate-500'}`}>
                            {new Date(msg.created_date).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending || !message.trim()}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}