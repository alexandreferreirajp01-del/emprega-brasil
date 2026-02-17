import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, Send, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ChatButton({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const adminEmail = 'alexandreferreirajp01@gmail.com';
  
  // Criar conversa_id
  const conversaId = user ? [user.email, adminEmail].sort().join('_') : null;

  // Buscar mensagens da conversa
  const { data: messages = [], refetch, isLoading } = useQuery({
    queryKey: ['chat-messages', conversaId],
    queryFn: async () => {
      if (!conversaId) {
        console.log('ChatButton: conversaId não definido');
        return [];
      }
      console.log('ChatButton: Buscando mensagens para conversa_id:', conversaId);
      const msgs = await base44.entities.MensagemDireta.filter(
        { conversa_id: conversaId },
        'created_date'
      );
      console.log('ChatButton: Mensagens encontradas:', msgs.length);
      return msgs;
    },
    enabled: !!conversaId,
    refetchInterval: isOpen ? 3000 : 15000,
  });

  // Contar mensagens não lidas
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages', user?.email],
    queryFn: async () => {
      if (!user) return 0;
      const msgs = await base44.entities.MensagemDireta.filter({
        conversa_id: conversaId,
        destinatario_email: user.email,
        lida: false
      });
      return msgs.length;
    },
    enabled: !!user && !!conversaId,
    refetchInterval: 5000,
  });

  // Marcar como lida ao abrir
  useEffect(() => {
    const markAsRead = async () => {
      if (isOpen && messages.length > 0 && user) {
        const unreadMessages = messages.filter(
          msg => msg.destinatario_email === user.email && !msg.lida
        );
        
        for (const msg of unreadMessages) {
          try {
            await base44.entities.MensagemDireta.update(msg.id, { lida: true });
          } catch (error) {
            console.error('Erro ao marcar como lida:', error);
          }
        }
        
        if (unreadMessages.length > 0) {
          queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      }
    };
    
    markAsRead();
  }, [isOpen, messages, user, queryClient]);

  // Scroll para o final ao receber mensagens
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      console.log('ChatButton: Enviando mensagem...', { conversaId, adminEmail, content });
      const response = await base44.functions.invoke('sendMessage', {
        destinatario_email: adminEmail,
        conteudo: content,
        message_type: 'direct'
      });
      console.log('ChatButton: Resposta:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('ChatButton: Mensagem enviada com sucesso:', data);
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', conversaId] });
      queryClient.invalidateQueries({ queryKey: ['support-chat', conversaId] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
      setTimeout(() => refetch(), 500);
    },
    onError: (error) => {
      console.error('ChatButton: Erro ao enviar:', error);
      toast.error('Erro ao enviar mensagem');
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

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          toast.info('Faça login para usar o chat');
          setTimeout(() => {
            window.location.href = '/splash';
          }, 1500);
        }}
        className="relative"
        title="Chat - Faça login"
      >
        <Mail className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative"
        title="Chat com Suporte"
      >
        <Mail className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg h-[600px] flex flex-col p-0">
          <DialogHeader className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <DialogTitle className="text-white">Chat com Suporte</DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-800"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-4 bg-slate-50 dark:bg-slate-900">
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">
                  <Loader2 className="w-12 h-12 mx-auto mb-2 opacity-50 animate-spin" />
                  <p className="text-sm">Carregando mensagens...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Nenhuma mensagem ainda</p>
                  <p className="text-xs">Inicie a conversa com nossa equipe</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isFromMe = msg.remetente_email === user?.email;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex flex-col max-w-[75%]">
                        {!isFromMe && (
                          <span className="text-[10px] text-slate-500 mb-1 ml-2">
                            Suporte
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 shadow-sm ${
                            isFromMe
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.conteudo}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className={`text-[10px] ${isFromMe ? 'text-blue-100' : 'text-slate-500'}`}>
                              {new Date(msg.created_date).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                            {isFromMe && msg.lida && (
                              <span className="text-[10px] text-blue-100">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-white dark:bg-slate-800">
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