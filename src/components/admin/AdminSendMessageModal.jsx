import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AdminSendMessageModal({ open, onOpenChange, targetUser, adminUser }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      // Criar conversa_id ordenado alfabeticamente
      const emails = [adminUser.email, targetUser.email].sort();
      const conversa_id = emails.join('_');

      // Salvar mensagem na entidade MensagemDireta
      await base44.entities.MensagemDireta.create({
        conversa_id,
        remetente_email: adminUser.email,
        remetente_nome: adminUser.custom_full_name || adminUser.full_name || 'Administrador',
        remetente_foto: adminUser.profile_photo || '',
        remetente_tipo: 'admin',
        destinatario_email: targetUser.email,
        destinatario_nome: targetUser.custom_full_name || targetUser.full_name || targetUser.email,
        destinatario_foto: targetUser.profile_photo || '',
        conteudo: message.trim(),
        lida: false,
        message_type: 'direct',
        status: 'new',
      });

      // Criar notificação para o usuário
      await base44.entities.Notification.create({
        title: '💬 Nova mensagem do Administrador',
        message: `Você recebeu uma mensagem: "${message.trim().substring(0, 80)}${message.trim().length > 80 ? '...' : ''}"`,
        type: 'user',
        reference_type: 'chat',
        user_email: targetUser.email,
        is_read: false,
      });

      // Enviar email via backend function (usa RESEND_API_KEY)
      await base44.functions.invoke('sendAdminMessage', {
        targetEmail: targetUser.email,
        targetName: targetUser.custom_full_name || targetUser.full_name || targetUser.email,
        messageContent: message.trim(),
      });

      toast.success('✅ Mensagem enviada com sucesso!');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('❌ Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-600" />
            Enviar Mensagem
          </DialogTitle>
        </DialogHeader>

        {targetUser && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-2">
            <Avatar className="w-10 h-10">
              <AvatarImage src={targetUser.profile_photo} />
              <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                {targetUser.full_name?.[0]?.toUpperCase() || targetUser.email?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-slate-800">{targetUser.custom_full_name || targetUser.full_name || 'Sem nome'}</p>
              <p className="text-xs text-slate-500">{targetUser.email}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem para o usuário..."
            className="min-h-[120px] resize-none rounded-xl"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) handleSend();
            }}
          />
          <p className="text-xs text-slate-400">Ctrl+Enter para enviar • O usuário receberá uma notificação e um email</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={sending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Mensagem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}