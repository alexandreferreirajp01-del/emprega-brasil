import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, AlertCircle, Loader2, Send, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TimeAgo from "@/components/common/TimeAgo";

export default function Ocorrencias() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [response, setResponse] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.role === 'admin' || currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const { data: occurrences = [] } = useQuery({
    queryKey: ['occurrences'],
    queryFn: () => base44.entities.Occurrence.list('-created_date', 500),
    enabled: !!user,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, response, userEmail, userName }) => {
      await base44.entities.Occurrence.update(id, {
        status: 'resolved',
        admin_response: response,
        responded_by: user.email,
        responded_at: new Date().toISOString()
      });

      // Enviar notificação ao usuário
      await base44.entities.Notification.create({
        title: '✅ Resposta da Equipe',
        message: `Sua ocorrência foi respondida: ${response.substring(0, 100)}...`,
        type: 'system',
        user_email: userEmail
      });

      // Enviar email
      await base44.integrations.Core.SendEmail({
        to: userEmail,
        subject: 'Resposta da Equipe - Vagas Abertas PB',
        body: `Olá ${userName},\n\nSua ocorrência foi respondida:\n\n${response}\n\nAtenciosamente,\nEquipe Vagas Abertas Paraíba`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
      setRespondingTo(null);
      setResponse('');
      alert('Resposta enviada!');
    }
  });

  const pending = occurrences.filter(o => o.status === 'pending');
  const resolved = occurrences.filter(o => o.status === 'resolved');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Ocorrências
          </h1>
          <p className="text-white/70 text-sm">{pending.length} pendentes • {resolved.length} resolvidas</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Pendentes */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="w-5 h-5" />
              Pendentes ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((occ) => (
              <div key={occ.id} className="border-2 border-orange-200 rounded-xl p-4 bg-orange-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800">{occ.title}</h4>
                      <Badge className="bg-orange-600 text-white text-xs">
                        {occ.type === 'job_report' ? 'Vaga' : occ.type === 'chat_message' ? 'Chat' : 'Sistema'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{occ.message}</p>
                    <p className="text-xs text-slate-400">
                      Por {occ.user_name} ({occ.user_email}) • <TimeAgo date={occ.created_date} />
                    </p>
                  </div>
                </div>

                {respondingTo === occ.id ? (
                  <div className="space-y-3 mt-4 p-4 bg-white rounded-lg">
                    <Label>Sua Resposta</Label>
                    <Textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => respondMutation.mutate({
                          id: occ.id,
                          response,
                          userEmail: occ.user_email,
                          userName: occ.user_name
                        })}
                        disabled={!response.trim() || respondMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Resposta
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRespondingTo(null);
                          setResponse('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setRespondingTo(occ.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Responder
                  </Button>
                )}
              </div>
            ))}

            {pending.length === 0 && (
              <p className="text-center text-slate-400 py-6">Nenhuma ocorrência pendente</p>
            )}
          </CardContent>
        </Card>

        {/* Resolvidas */}
        {resolved.length > 0 && (
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                Resolvidas ({resolved.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resolved.map((occ) => (
                <div key={occ.id} className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-medium text-slate-800 mb-1">{occ.title}</h4>
                  <p className="text-sm text-slate-600 mb-2">{occ.message}</p>
                  <div className="p-3 bg-green-50 rounded-lg mt-2">
                    <p className="text-sm font-medium text-green-800 mb-1">Resposta:</p>
                    <p className="text-sm text-slate-700">{occ.admin_response}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Respondido por {occ.responded_by} • <TimeAgo date={occ.responded_at} />
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}