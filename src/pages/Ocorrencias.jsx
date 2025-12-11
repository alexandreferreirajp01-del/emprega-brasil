import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, AlertCircle, CheckCircle, MessageSquare, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function Ocorrencias() {
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);
  const [response, setResponse] = useState('');
  const queryClient = useQueryClient();

  const { data: occurrences = [], isLoading } = useQuery({
    queryKey: ['occurrences'],
    queryFn: () => base44.entities.Occurrence.list('-created_date', 500)
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, response }) => {
      await base44.entities.Occurrence.update(id, {
        admin_response: response,
        status: 'answered',
        responded_at: new Date().toISOString(),
        responded_by: (await base44.auth.me()).email
      });

      // Enviar notificação para o usuário
      const occurrence = occurrences.find(o => o.id === id);
      if (occurrence) {
        await base44.entities.Notification.create({
          user_email: occurrence.user_email,
          title: 'Resposta da sua Ocorrência',
          message: `O administrador respondeu sua ocorrência sobre "${occurrence.job_title}": ${response}`,
          type: 'system',
          is_read: false
        });

        // Enviar email
        await base44.integrations.Core.SendEmail({
          to: occurrence.user_email,
          subject: 'Resposta da sua Ocorrência - Vagas Abertas PB',
          body: `Olá ${occurrence.user_name},\n\nO administrador respondeu sua ocorrência sobre a vaga "${occurrence.job_title}":\n\n"${response}"\n\nAtenciosamente,\nEquipe Vagas Abertas Paraíba`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
      setSelectedOccurrence(null);
      setResponse('');
    }
  });

  const resolveMutation = useMutation({
    mutationFn: (id) => base44.entities.Occurrence.update(id, { status: 'resolved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    }
  });

  const pendingCount = occurrences.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Ocorrências</h1>
              <p className="text-white/80">Gerencie reportes de vagas</p>
            </div>
            {pendingCount > 0 && (
              <Badge className="bg-white text-orange-600 text-lg px-4 py-2">
                {pendingCount} Pendentes
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        ) : occurrences.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">Nenhuma ocorrência</h3>
              <p className="text-slate-500">Não há reportes de vagas no momento</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {occurrences.map((occurrence) => (
              <Card key={occurrence.id} className="shadow hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">{occurrence.subject}</h3>
                        <Badge
                          className={
                            occurrence.status === 'pending'
                              ? 'bg-orange-100 text-orange-700'
                              : occurrence.status === 'answered'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }
                        >
                          {occurrence.status === 'pending'
                            ? 'Pendente'
                            : occurrence.status === 'answered'
                            ? 'Respondida'
                            : 'Concluída'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{occurrence.message}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>Vaga: {occurrence.job_title}</span>
                        <span>Usuário: {occurrence.user_name}</span>
                        <span>Email: {occurrence.user_email}</span>
                        <span>
                          {new Date(occurrence.created_date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {occurrence.admin_response && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 mb-1">Resposta:</p>
                          <p className="text-sm text-blue-800">{occurrence.admin_response}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {occurrence.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOccurrence(occurrence);
                            setResponse('');
                          }}
                          className="rounded-lg bg-blue-600 hover:bg-blue-700"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Responder
                        </Button>
                      )}
                      {occurrence.status === 'answered' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Marcar como concluída?')) {
                              resolveMutation.mutate(occurrence.id);
                            }
                          }}
                          className="rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Concluir
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Response Dialog */}
      <Dialog open={!!selectedOccurrence} onOpenChange={() => setSelectedOccurrence(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Responder Ocorrência</DialogTitle>
          </DialogHeader>
          {selectedOccurrence && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-slate-700 mb-2">Assunto:</p>
                <p className="text-sm text-slate-600">{selectedOccurrence.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Sua Resposta:</label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Digite sua resposta..."
                  className="min-h-[150px] rounded-xl"
                />
              </div>
              <Button
                onClick={() => respondMutation.mutate({ id: selectedOccurrence.id, response })}
                disabled={!response.trim() || respondMutation.isPending}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                {respondMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Enviar Resposta'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}