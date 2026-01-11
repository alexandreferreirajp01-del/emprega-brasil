import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ReportJobModal({ job, user, isOpen, onClose }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Preencha o assunto e a mensagem');
      return;
    }

    if (!email.trim()) {
      toast.error('Preencha seu e-mail de contato');
      return;
    }

    if (!phone.trim()) {
      toast.error('Preencha seu telefone de contato');
      return;
    }

    setLoading(true);

    try {
      // Criar ocorrência
      await base44.entities.Occurrence.create({
        user_email: user?.email || email,
        user_name: user?.full_name || email,
        job_id: job.id,
        job_title: job.title,
        subject: subject.trim(),
        message: `${message.trim()}\n\n--- Contato ---\nEmail: ${email}\nTelefone: ${phone || 'Não informado'}`,
        status: 'pending'
      });

      // Notificar admins
      try {
        await base44.functions.invoke('notifyAdmins', {
          event_type: 'job_report',
          data: {
            job_title: job.title,
            job_id: job.id,
            user_email: user?.email || email,
            subject: subject
          }
        });
      } catch (e) {
        // Ignorar erro de notificação
      }

      toast.success('Ocorrência enviada com sucesso!');
      
      // Reset form
      setSubject('');
      setMessage('');
      setPhone('');
      onClose();
    } catch (error) {
      toast.error('Erro ao enviar ocorrência');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Reportar Vaga
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Info da vaga */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Reportando:</p>
            <p className="font-semibold text-slate-800">{job?.title}</p>
            <p className="text-sm text-slate-500">{job?.company}</p>
          </div>

          {/* Assunto */}
          <div>
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Vaga duplicada, Informações incorretas..."
              className="rounded-lg mt-1"
              maxLength={200}
              required
            />
          </div>

          {/* Mensagem */}
          <div>
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva o problema ou sua dúvida sobre esta vaga..."
              className="rounded-lg mt-1 min-h-[120px]"
              maxLength={1000}
              required
            />
            <p className="text-xs text-slate-500 mt-1">{message.length}/1000 caracteres</p>
          </div>

          {/* Contato - Email */}
          <div>
            <Label htmlFor="email">Seu E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="rounded-lg mt-1"
              required
            />
          </div>

          {/* Contato - Telefone */}
          <div>
            <Label htmlFor="phone">Seu Telefone *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="rounded-lg mt-1"
              maxLength={20}
              required
            />
          </div>

          {/* Info */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 rounded-lg shadow-sm">
            <p className="text-sm text-slate-700 font-medium">
              📧 Sua ocorrência será enviada para nossa equipe. 
              Responderemos assim que possível através do e-mail fornecido.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-lg"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-700 rounded-lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Enviar Ocorrência'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}