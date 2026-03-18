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

      // Enviar email de notificação
      try {
        await base44.integrations.Core.SendEmail({
          to: targetUser.email,
          subject: '💬 Você recebeu uma mensagem do Administrador - Vagas Abertas PB',
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1D4371, #2B5A8F); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">💬 Nova Mensagem</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Vagas Abertas PB</p>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="color: #475569; font-size: 16px;">Olá, <strong>${targetUser.custom_full_name || targetUser.full_name || 'usuário'}</strong>!</p>
                <p style="color: #475569;">Você recebeu uma mensagem do Administrador da plataforma:</p>
                <div style="background: #f1f5f9; border-left: 4px solid #1D4371; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #1e293b; margin: 0; font-size: 15px; line-height: 1.6;">${message.trim()}</p>
                </div>
                <p style="color: #475569;">Para responder, acesse sua caixa de mensagens na plataforma.</p>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="https://vagasabertaspb.com.br/Mensagens" style="background: #1D4371; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                    Ver Mensagem
                  </a>
                </div>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">
                  Vagas Abertas PB — contato@vagasabertaspb.com.br
                </p>
              </div>
            </div>
          `
        });
      } catch (emailErr) {
        // Email é opcional, não bloqueia o envio
        console.warn('Falha ao enviar email de notificação:', emailErr);
      }

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