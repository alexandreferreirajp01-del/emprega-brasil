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
        '-created_date'
      );
      return msgs.reverse();
    },
    enabled: !!conversaId && isOpen,
    refetchInterval: 5000,
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
      queryClient.invalidateQueries({ queryKey: ['support-chat'] });
      refetch();
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
              Enviar Mensagem
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Contatar Suporte</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="min-h-[120px]"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Enviar'
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Contatar Suporte</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="min-h-[120px]"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Enviar'
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