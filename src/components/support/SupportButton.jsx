import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function SupportButton({ user }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      // Buscar email de admin
      const users = await base44.entities.User.list();
      const admin = users.find(u => u.role === 'admin' || u.subscription_type === 'admin');
      
      if (!admin) {
        throw new Error('Admin não encontrado');
      }

      return await base44.functions.invoke('sendMessage', {
        destinatario_email: admin.email,
        conteudo: content,
        message_type: 'user_to_admin'
      });
    },
    onSuccess: () => {
      toast.success('Mensagem enviada! Responderemos em breve.');
      setMessage('');
      setOpen(false);
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    }
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Fale com o Suporte</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Descreva sua dúvida ou problema..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="dark:bg-slate-700 dark:border-slate-600"
          />
          <Button 
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {sendMessageMutation.isPending ? (
              'Enviando...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Mensagem
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}