import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Send, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ReportJobModal({ isOpen, onClose, job, user }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const createOccurrenceMutation = useMutation({
    mutationFn: async (data) => {
      // Criar ocorrência
      const occurrence = await base44.entities.Occurrence.create(data);
      
      // Enviar notificações para admins
      const admins = await base44.entities.User.filter({ 
        $or: [
          { role: 'admin' },
          { subscription_type: 'admin' },
          { email: 'alexandreferreirajp01@gmail.com' }
        ]
      });

      for (const admin of admins) {
        await base44.entities.Notification.create({
          user_email: admin.email,
          title: '🚨 Nova Ocorrência Reportada',
          message: `${data.user_name} reportou um problema na vaga "${data.job_title}". Assunto: ${data.subject}`,
          type: 'system',
          job_id: data.job_id
        });

        // Enviar e-mail para admin
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: '🚨 Nova Ocorrência - Vagas Abertas PB',
          body: `
            <h2>Nova Ocorrência Reportada</h2>
            <p><strong>Usuário:</strong> ${data.user_name} (${data.user_email})</p>
            <p><strong>Vaga:</strong> ${data.job_title}</p>
            <p><strong>Assunto:</strong> ${data.subject}</p>
            <p><strong>Mensagem:</strong></p>
            <p>${data.message}</p>
            <br>
            <p>Acesse o painel administrativo para responder.</p>
          `
        });
      }

      return occurrence;
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
      setTimeout(() => {
        setSubject('');
        setMessage('');
        setSuccess(false);
        onClose();
      }, 2000);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      return;
    }

    if (message.length > 1000) {
      return;
    }

    createOccurrenceMutation.mutate({
      user_email: user.email,
      user_name: user.full_name || user.email,
      job_id: job.id,
      job_title: job.title,
      subject: subject.trim(),
      message: message.trim(),
      status: 'pending'
    });
  };

  const handleClose = () => {
    if (!createOccurrenceMutation.isPending) {
      setSubject('');
      setMessage('');
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Reportar Problema na Vaga
          </DialogTitle>
          <DialogDescription>
            Descreva o problema encontrado nesta vaga. Nossa equipe analisará e responderá em breve.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Ocorrência Enviada!</h3>
            <p className="text-sm text-slate-600">Nossa equipe receberá sua mensagem e responderá em breve.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vaga */}
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Vaga:</p>
              <p className="font-medium text-slate-800 text-sm">{job.title}</p>
            </div>

            {/* Assunto */}
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Vaga inválida, dados incorretos..."
                maxLength={100}
                required
                disabled={createOccurrenceMutation.isPending}
                className="rounded-xl h-11"
              />
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva detalhadamente o problema encontrado..."
                maxLength={1000}
                required
                disabled={createOccurrenceMutation.isPending}
                className="rounded-xl min-h-[120px] resize-none"
              />
              <p className="text-xs text-slate-500 text-right">
                {message.length}/1000 caracteres
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createOccurrenceMutation.isPending}
                className="flex-1 rounded-xl h-11"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!subject.trim() || !message.trim() || message.length > 1000 || createOccurrenceMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11"
              >
                {createOccurrenceMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}